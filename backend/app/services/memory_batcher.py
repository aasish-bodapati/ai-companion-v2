"""
Simplified Memory Batcher - Basic batch processing for memory operations
Reduces database load by batching memory operations without complex crash recovery.
"""

import time
import logging
import threading
from typing import List, Dict, Any, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor
import hashlib

from app.services.error_tracker import error_tracker
from app.services.metrics import metrics_collector

logger = logging.getLogger(__name__)


@dataclass
class MemoryBatchItem:
    """Item to be processed in a memory batch."""
    content: str
    content_type: str
    user_id: str
    conversation_id: Optional[str]
    metadata: Dict[str, Any]
    conversation_history: Optional[List[Dict]]
    timestamp: float = field(default_factory=time.time)
    priority: int = 0  # Higher number = higher priority


@dataclass
class MemoryBatch:
    """A batch of memory items for a specific user."""
    items: List[MemoryBatchItem]
    created_at: float
    user_id: str
    store_callback: Optional[Callable] = None


class MemoryBatcher:
    """
    Simplified memory batcher that processes memories in batches.
    Removed complex crash recovery, signal handling, and persistence for simplicity.
    """
    
    def __init__(
        self,
        batch_size: int = 5,
        batch_timeout: float = 30.0,  # seconds
        max_workers: int = 2,
        deduplication_window: float = 60.0,  # seconds
    ):
        self.batch_size = batch_size
        self.batch_timeout = batch_timeout
        self.max_workers = max_workers
        self.deduplication_window = deduplication_window
        
        # Thread-safe storage
        self._pending_batches: Dict[str, MemoryBatch] = {}
        self._lock = threading.Lock()
        self._executor = ThreadPoolExecutor(max_workers=max_workers)
        
        # Start timeout monitoring thread
        self._timeout_thread = threading.Thread(target=self._timeout_monitor, daemon=True)
        self._timeout_thread.start()
        
        # Simple deduplication tracking
        self._recent_hashes: Dict[str, float] = {}
        self._hash_lock = threading.Lock()
        
        # Basic statistics
        self._stats = {
            'batches_processed': 0,
            'items_processed': 0,
            'duplicates_skipped': 0,
            'start_time': time.time()
        }
        
        logger.info("Simplified MemoryBatcher initialized")

    def _get_content_hash(self, content: str, user_id: str) -> str:
        """Generate a hash for content deduplication."""
        return hashlib.md5(f"{user_id}:{content}".encode()).hexdigest()

    def _timeout_monitor(self):
        """Monitor batches for timeout and process them."""
        while True:
            try:
                time.sleep(0.1)  # Check every 100ms for faster response
                
                current_time = time.time()
                expired_batches = []
                
                with self._lock:
                    for user_id, batch in self._pending_batches.items():
                        if current_time - batch.created_at >= self.batch_timeout:
                            expired_batches.append((user_id, batch))
                
                # Process expired batches
                for user_id, batch in expired_batches:
                    logger.info(f"⏰ MEMORY: Processing timeout batch for user {user_id} ({len(batch.items)} items)")
                    self._process_batch_immediately(batch, batch.store_callback)
                    with self._lock:
                        if user_id in self._pending_batches:
                            del self._pending_batches[user_id]
                            
            except Exception as e:
                logger.error(f"Error in timeout monitor: {e}")
                time.sleep(1)  # Wait longer on error

    def add_memory(
        self,
        content: str,
        content_type: str,
        user_id: str,
        conversation_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict]] = None,
        priority: int = 0,
        store_callback: Optional[Callable] = None
    ) -> bool:
        """Add a memory item to the batch for processing."""
        try:
            # Create content hash for deduplication
            content_hash = self._get_content_hash(content, user_id)
            
            # Check for duplicates
            with self._hash_lock:
                current_time = time.time()
                if content_hash in self._recent_hashes:
                    last_seen = self._recent_hashes[content_hash]
                    if current_time - last_seen < self.deduplication_window:
                        self._stats['duplicates_skipped'] += 1
                        logger.info(f"🔄 MEMORY: Skipping duplicate memory for user {user_id}: {content[:50]}...")
                        return False
                
                self._recent_hashes[content_hash] = current_time
            
            # Create batch item
            item = MemoryBatchItem(
                content=content,
                content_type=content_type,
                user_id=user_id,
                conversation_id=conversation_id,
                metadata=metadata or {},
                conversation_history=conversation_history,
                priority=priority
            )
            
            # Add to user's batch
            with self._lock:
                if user_id not in self._pending_batches:
                    self._pending_batches[user_id] = MemoryBatch(
                        items=[],
                        created_at=time.time(),
                        user_id=user_id,
                        store_callback=store_callback
                    )
                
                batch = self._pending_batches[user_id]
                batch.items.append(item)
                
                # Update callback if provided (allows overriding)
                if store_callback:
                    batch.store_callback = store_callback
                
                # Process batch if it's full
                if len(batch.items) >= self.batch_size:
                    logger.info(f"📦 MEMORY: Processing full batch for user {user_id} ({len(batch.items)} items)")
                    self._process_batch_immediately(batch, store_callback)
                    del self._pending_batches[user_id]
                else:
                    logger.info(f"📝 MEMORY: Added to batch for user {user_id} (batch size: {len(batch.items)}/{self.batch_size})")
            
            # Record metrics
            metrics_collector.increment_counter("memory_batch_added", tags={"user_id": user_id})
            metrics_collector.set_gauge("memory_batch_size", len(batch.items), tags={"user_id": user_id})
            
            return True
            
        except Exception as e:
            logger.error(f"❌ MEMORY: Error adding memory to batch for user {user_id}: {e}")
            error_tracker.record_error(
                error_type="memory_batch_add_failed",
                error_message=str(e),
                user_id=user_id,
                conversation_id=conversation_id,
                context={"content_type": content_type, "content_length": len(content)}
            )
            return False

    def _process_batch_immediately(self, batch: MemoryBatch, store_callback: Optional[Callable]):
        """Process a batch immediately."""
        if not store_callback:
            logger.warning("⚠️ MEMORY: No store callback provided, skipping batch processing")
            return
        
        try:
            # Process each item in the batch
            successful_items = 0
            failed_items = 0
            
            for item in batch.items:
                try:
                    store_callback(
                        content=item.content,
                        content_type=item.content_type,
                        user_id=item.user_id,
                        conversation_id=item.conversation_id,
                        metadata=item.metadata,
                        conversation_history=item.conversation_history
                    )
                    self._stats['items_processed'] += 1
                    successful_items += 1
                except Exception as e:
                    logger.error(f"❌ MEMORY: Error processing memory item for user {item.user_id}: {e}")
                    error_tracker.record_error(
                        error_type="memory_item_processing_failed",
                        error_message=str(e),
                        user_id=item.user_id,
                        conversation_id=item.conversation_id,
                        context={"content_type": item.content_type, "content_length": len(item.content)}
                    )
                    failed_items += 1
            
            self._stats['batches_processed'] += 1
            logger.info(f"✅ MEMORY: Processed batch for user {batch.user_id} - {successful_items} successful, {failed_items} failed")
            
            # Record metrics
            metrics_collector.increment_counter("memory_batch_processed", tags={"user_id": batch.user_id})
            metrics_collector.increment_counter("memory_items_processed", successful_items, tags={"user_id": batch.user_id})
            if failed_items > 0:
                metrics_collector.increment_counter("memory_items_failed", failed_items, tags={"user_id": batch.user_id})
            
        except Exception as e:
            logger.error(f"❌ MEMORY: Error processing batch for user {batch.user_id}: {e}")
            error_tracker.record_error(
                error_type="memory_batch_processing_failed",
                error_message=str(e),
                user_id=batch.user_id,
                context={"batch_size": len(batch.items)}
            )

    def force_process_user(self, user_id: str, store_callback: Optional[Callable] = None) -> bool:
        """Force process all pending items for a specific user."""
        with self._lock:
            if user_id not in self._pending_batches:
                return False
            
            batch = self._pending_batches[user_id]
            if not batch.items:
                return False
            
            # Process the batch
            self._process_batch_immediately(batch, store_callback)
            del self._pending_batches[user_id]
            return True

    def force_process_all(self, store_callback: Optional[Callable] = None) -> int:
        """Force process all pending batches."""
        processed_count = 0
        
        with self._lock:
            user_ids = list(self._pending_batches.keys())
        
        for user_id in user_ids:
            if self.force_process_user(user_id, store_callback):
                processed_count += 1
        
        logger.info(f"Force processed {processed_count} batches")
        return processed_count

    def get_stats(self) -> Dict[str, Any]:
        """Get current statistics."""
        with self._lock:
            pending_count = sum(len(batch.items) for batch in self._pending_batches.values())
        
        stats = self._stats.copy()
        stats['pending_batches'] = len(self._pending_batches)
        stats['pending_items'] = pending_count
        stats['uptime'] = time.time() - stats['start_time']
        
        return stats

    def shutdown(self):
        """Graceful shutdown - process remaining batches."""
        logger.info("Shutting down simplified memory batcher...")
        
        # Process all remaining batches with their stored callbacks
        with self._lock:
            user_ids = list(self._pending_batches.keys())
        
        for user_id in user_ids:
            if user_id in self._pending_batches:
                batch = self._pending_batches[user_id]
                if batch.items:  # Only process if there are items
                    logger.info(f"🔄 MEMORY: Processing shutdown batch for user {user_id} ({len(batch.items)} items)")
                    self._process_batch_immediately(batch, batch.store_callback)
                    del self._pending_batches[user_id]
        
        # Shutdown executor
        self._executor.shutdown(wait=True)
        
        logger.info("Simplified memory batcher shutdown complete")


# Global instance for easy access
memory_batcher = MemoryBatcher()