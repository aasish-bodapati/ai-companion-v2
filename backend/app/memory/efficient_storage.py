"""
Efficient Memory Storage System - Optimized for performance and scalability.
"""

import json
import logging
import time
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, timezone
from collections import defaultdict, OrderedDict
import hashlib
import pickle
import gzip
import sqlite3
from pathlib import Path

logger = logging.getLogger(__name__)

def get_utc_now():
    """Get current UTC datetime without timezone info (timezone-naive)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

@dataclass
class MemoryChunk:
    """A compressed chunk of related memories."""
    chunk_id: str
    memories: List[Dict[str, Any]]
    categories: List[str]
    compressed_data: bytes
    compression_ratio: float
    last_accessed: datetime
    access_count: int
    chunk_size: int
    
    def is_stale(self, max_age_days: int = 30) -> bool:
        """Check if chunk is stale and should be archived."""
        return (get_utc_now() - self.last_accessed).days > max_age_days
    
    def update_access(self):
        """Update access statistics."""
        self.last_accessed = get_utc_now()
        self.access_count += 1

class EfficientMemoryStorage:
    """
    Efficient memory storage system with compression, indexing, and smart caching.
    """
    
    def __init__(self, storage_path: str = "memory_cache"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(exist_ok=True)
        
        # Memory chunks for efficient storage
        self.memory_chunks: Dict[str, MemoryChunk] = {}
        self.chunk_index: Dict[str, List[str]] = defaultdict(list)  # category -> chunk_ids
        
        # Smart caching
        self.hot_cache: OrderedDict[str, Any] = OrderedDict()  # LRU cache for hot memories
        self.cold_cache: OrderedDict[str, Any] = OrderedDict()  # LRU cache for cold memories
        self.max_hot_cache_size = 1000
        self.max_cold_cache_size = 5000
        
        # Compression settings
        self.compression_threshold = 1024  # bytes
        self.chunk_size_threshold = 50  # memories per chunk
        
        # Performance metrics
        self.storage_stats = {
            "total_memories": 0,
            "total_chunks": 0,
            "compression_ratio": 0.0,
            "cache_hit_rate": 0.0,
            "storage_efficiency": 0.0
        }
        
        # Initialize storage
        self._load_existing_chunks()
        self._initialize_database()
    
    def _initialize_database(self):
        """Initialize SQLite database for metadata and indexing."""
        db_path = self.storage_path / "memory_metadata.db"
        self.db_conn = sqlite3.connect(str(db_path))
        self.db_conn.execute("""
            CREATE TABLE IF NOT EXISTS memory_index (
                memory_id TEXT PRIMARY KEY,
                chunk_id TEXT,
                categories TEXT,
                importance REAL,
                last_accessed TEXT,
                access_count INTEGER,
                compressed_size INTEGER,
                original_size INTEGER
            )
        """)
        self.db_conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_categories ON memory_index(categories)
        """)
        self.db_conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_importance ON memory_index(importance)
        """)
        self.db_conn.commit()
    
    def _load_existing_chunks(self):
        """Load existing memory chunks from disk."""
        chunk_files = list(self.storage_path.glob("chunk_*.pkl.gz"))
        
        for chunk_file in chunk_files:
            try:
                with gzip.open(chunk_file, 'rb') as f:
                    chunk_data = pickle.load(f)
                    chunk_id = chunk_file.stem.replace("chunk_", "")
                    self.memory_chunks[chunk_id] = chunk_data
                    
                    # Rebuild index
                    for memory in chunk_data.memories:
                        for category in chunk_data.categories:
                            self.chunk_index[category].append(chunk_id)
                    
                    logger.info(f"Loaded chunk {chunk_id} with {len(chunk_data.memories)} memories")
            except Exception as e:
                logger.warning(f"Failed to load chunk {chunk_file}: {e}")
    
    def store_memory(self, memory_data: Dict[str, Any]) -> str:
        """Store a memory efficiently with compression and chunking."""
        memory_id = memory_data.get('faiss_id', str(hash(str(memory_data))))
        
        # Check if memory should be stored in hot cache
        if self._is_hot_memory(memory_data):
            self._add_to_hot_cache(memory_id, memory_data)
            return memory_id
        
        # Add to appropriate chunk
        chunk_id = self._find_or_create_chunk(memory_data)
        self._add_memory_to_chunk(chunk_id, memory_data)
        
        # Update database index
        self._update_memory_index(memory_id, chunk_id, memory_data)
        
        # Update statistics
        self.storage_stats["total_memories"] += 1
        self._update_storage_efficiency()
        
        return memory_id
    
    def _is_hot_memory(self, memory_data: Dict[str, Any]) -> bool:
        """Determine if memory should be kept in hot cache."""
        # High importance memories
        if memory_data.get('importance', 0) > 0.8:
            return True
        
        # Recently accessed memories
        if 'last_accessed' in memory_data:
            last_access = datetime.fromisoformat(memory_data['last_accessed'])
            if (get_utc_now() - last_access).days < 1:
                return True
        
        # Frequently accessed memories
        if memory_data.get('access_count', 0) > 5:
            return True
        
        return False
    
    def _add_to_hot_cache(self, memory_id: str, memory_data: Dict[str, Any]):
        """Add memory to hot cache (LRU)."""
        if memory_id in self.hot_cache:
            # Move to end (most recently used)
            self.hot_cache.move_to_end(memory_id)
        else:
            # Add new memory
            self.hot_cache[memory_id] = memory_data
            
            # Remove oldest if cache is full
            if len(self.hot_cache) > self.max_hot_cache_size:
                self.hot_cache.popitem(last=False)
    
    def _find_or_create_chunk(self, memory_data: Dict[str, Any]) -> str:
        """Find existing chunk or create new one for memory."""
        categories = memory_data.get('categories', [])
        
        # Try to find existing chunk with matching categories
        for category in categories:
            if category in self.chunk_index:
                for chunk_id in self.chunk_index[category]:
                    chunk = self.memory_chunks[chunk_id]
                    if len(chunk.memories) < self.chunk_size_threshold:
                        return chunk_id
        
        # Create new chunk
        chunk_id = f"chunk_{int(time.time())}_{len(self.memory_chunks)}"
        new_chunk = MemoryChunk(
            chunk_id=chunk_id,
            memories=[],
            categories=categories,
            compressed_data=b"",
            compression_ratio=0.0,
            last_accessed=get_utc_now(),
            access_count=0,
            chunk_size=0
        )
        
        self.memory_chunks[chunk_id] = new_chunk
        
        # Update index
        for category in categories:
            self.chunk_index[category].append(chunk_id)
        
        self.storage_stats["total_chunks"] += 1
        return chunk_id
    
    def _add_memory_to_chunk(self, chunk_id: str, memory_data: Dict[str, Any]):
        """Add memory to a chunk and compress if needed."""
        chunk = self.memory_chunks[chunk_id]
        chunk.memories.append(memory_data)
        chunk.chunk_size = len(chunk.memories)
        chunk.last_accessed = get_utc_now()
        
        # Compress chunk if it reaches threshold
        if chunk.chunk_size >= self.chunk_size_threshold:
            self._compress_chunk(chunk_id)
    
    def _compress_chunk(self, chunk_id: str):
        """Compress a chunk to save storage space."""
        chunk = self.memory_chunks[chunk_id]
        
        # Serialize and compress
        serialized_data = pickle.dumps(chunk.memories)
        original_size = len(serialized_data)
        
        if original_size > self.compression_threshold:
            compressed_data = gzip.compress(serialized_data)
            compressed_size = len(compressed_data)
            
            chunk.compressed_data = compressed_data
            chunk.compression_ratio = compressed_size / original_size
            
            # Save compressed chunk to disk
            chunk_file = self.storage_path / f"chunk_{chunk_id}.pkl.gz"
            with gzip.open(chunk_file, 'wb') as f:
                pickle.dump(chunk, f)
            
            # Clear memory (keep only metadata)
            chunk.memories = []
            logger.info(f"Compressed chunk {chunk_id}: {original_size} -> {compressed_size} bytes")
    
    def retrieve_memory(self, memory_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a memory efficiently."""
        # Check hot cache first
        if memory_id in self.hot_cache:
            self.storage_stats["cache_hit_rate"] += 1
            return self.hot_cache[memory_id]
        
        # Check cold cache
        if memory_id in self.cold_cache:
            self.storage_stats["cache_hit_rate"] += 1
            # Move to hot cache
            memory_data = self.cold_cache.pop(memory_id)
            self._add_to_hot_cache(memory_id, memory_data)
            return memory_data
        
        # Check database index
        cursor = self.db_conn.execute(
            "SELECT chunk_id FROM memory_index WHERE memory_id = ?", 
            (memory_id,)
        )
        result = cursor.fetchone()
        
        if result:
            chunk_id = result[0]
            return self._retrieve_from_chunk(chunk_id, memory_id)
        
        return None
    
    def _retrieve_from_chunk(self, chunk_id: str, memory_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve memory from a specific chunk."""
        if chunk_id not in self.memory_chunks:
            return None
        
        chunk = self.memory_chunks[chunk_id]
        
        # Decompress if needed
        if chunk.compressed_data and not chunk.memories:
            try:
                chunk.memories = pickle.loads(gzip.decompress(chunk.compressed_data))
            except Exception as e:
                logger.error(f"Failed to decompress chunk {chunk_id}: {e}")
                return None
        
        # Find specific memory
        for memory in chunk.memories:
            if memory.get('faiss_id') == memory_id:
                # Update access statistics
                chunk.update_access()
                self._update_memory_index(memory_id, chunk_id, memory)
                
                # Move to appropriate cache
                if self._is_hot_memory(memory):
                    self._add_to_hot_cache(memory_id, memory)
                else:
                    self._add_to_cold_cache(memory_id, memory)
                
                return memory
        
        return None
    
    def _add_to_cold_cache(self, memory_id: str, memory_data: Dict[str, Any]):
        """Add memory to cold cache (LRU)."""
        if memory_id in self.cold_cache:
            self.cold_cache.move_to_end(memory_id)
        else:
            self.cold_cache[memory_id] = memory_data
            
            # Remove oldest if cache is full
            if len(self.cold_cache) > self.max_cold_cache_size:
                self.cold_cache.popitem(last=False)
    
    def _update_memory_index(self, memory_id: str, chunk_id: str, memory_data: Dict[str, Any]):
        """Update the database index for a memory."""
        categories = json.dumps(memory_data.get('categories', []))
        importance = memory_data.get('importance', 0.5)
        last_accessed = get_utc_now().isoformat()
        access_count = memory_data.get('access_count', 0)
        
        # Get size information
        original_size = len(json.dumps(memory_data))
        compressed_size = len(memory_data.get('compressed_data', b'')) if memory_data.get('compressed_data') else original_size
        
        self.db_conn.execute("""
            INSERT OR REPLACE INTO memory_index 
            (memory_id, chunk_id, categories, importance, last_accessed, access_count, compressed_size, original_size)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (memory_id, chunk_id, categories, importance, last_accessed, access_count, compressed_size, original_size))
        self.db_conn.commit()
    
    def search_memories(self, query: str, categories: Optional[List[str]] = None, 
                       limit: int = 10) -> List[Dict[str, Any]]:
        """Search memories efficiently using database index."""
        # Build search query
        if categories:
            category_filter = " AND categories LIKE ?"
            params = [f"%{cat}%" for cat in categories]
        else:
            category_filter = ""
            params = []
        
        sql = f"""
            SELECT memory_id, chunk_id, importance, access_count 
            FROM memory_index 
            WHERE importance > 0.3 {category_filter}
            ORDER BY importance DESC, access_count DESC
            LIMIT ?
        """
        
        cursor = self.db_conn.execute(sql, params + [limit])
        results = []
        
        for row in cursor.fetchall():
            memory_id, chunk_id, importance, access_count = row
            memory = self.retrieve_memory(memory_id)
            if memory:
                results.append(memory)
        
        return results
    
    def _update_storage_efficiency(self):
        """Update storage efficiency metrics."""
        total_original_size = 0
        total_compressed_size = 0
        
        for chunk in self.memory_chunks.values():
            if chunk.compressed_data:
                total_compressed_size += len(chunk.compressed_data)
                total_original_size += chunk.chunk_size * 100  # Estimate original size
        
        if total_original_size > 0:
            self.storage_stats["compression_ratio"] = total_compressed_size / total_original_size
            self.storage_stats["storage_efficiency"] = 1.0 - self.storage_stats["compression_ratio"]
    
    def get_storage_stats(self) -> Dict[str, Any]:
        """Get comprehensive storage statistics."""
        total_accesses = sum(chunk.access_count for chunk in self.memory_chunks.values())
        
        return {
            **self.storage_stats,
            "hot_cache_size": len(self.hot_cache),
            "cold_cache_size": len(self.cold_cache),
            "total_accesses": total_accesses,
            "avg_access_per_memory": total_accesses / max(1, self.storage_stats["total_memories"]),
            "cache_hit_rate": self.storage_stats["cache_hit_rate"] / max(1, total_accesses)
        }
    
    def cleanup_stale_chunks(self, max_age_days: int = 30):
        """Remove stale chunks to free up storage."""
        chunks_to_remove = []
        
        for chunk_id, chunk in self.memory_chunks.items():
            if chunk.is_stale(max_age_days):
                chunks_to_remove.append(chunk_id)
        
        for chunk_id in chunks_to_remove:
            # Remove from memory
            chunk = self.memory_chunks.pop(chunk_id)
            
            # Remove from index
            for category in chunk.categories:
                if chunk_id in self.chunk_index[category]:
                    self.chunk_index[category].remove(chunk_id)
            
            # Remove from database
            self.db_conn.execute("DELETE FROM memory_index WHERE chunk_id = ?", (chunk_id,))
            
            # Remove file
            chunk_file = self.storage_path / f"chunk_{chunk_id}.pkl.gz"
            if chunk_file.exists():
                chunk_file.unlink()
            
            logger.info(f"Removed stale chunk {chunk_id}")
        
        self.db_conn.commit()
        self._update_storage_efficiency()

# Global instance
efficient_storage = EfficientMemoryStorage()
