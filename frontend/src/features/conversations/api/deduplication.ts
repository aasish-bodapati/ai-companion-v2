/**
 * Deduplication API - Frontend integration with backend deduplication services
 */

import api from '@/lib/api';

export interface DeduplicationStatus {
  is_duplicate: boolean;
  existing_memory_id?: string;
  similarity_score?: number;
}

export interface ConsolidationResult {
  consolidated: number;
  removed: number;
  groups_processed: number;
}

/**
 * Check if content would be a duplicate before sending
 */
export async function checkContentDuplication(
  content: string,
  contentType: string = 'message'
): Promise<DeduplicationStatus> {
  return api.post('/deduplication/check-duplicate', {
    content,
    content_type: contentType
  });
}

/**
 * Get conversation context status
 */
export async function getConversationContext(conversationId: string) {
  return api.get(`/deduplication/conversation-context/${conversationId}`);
}

/**
 * Trigger memory consolidation for user
 */
export async function consolidateMemories(
  contentType: string = 'message',
  batchSize: number = 50
): Promise<ConsolidationResult> {
  return api.post('/deduplication/consolidate', {
    content_type: contentType,
    batch_size: batchSize
  });
}

/**
 * Get deduplication metrics
 */
export async function getDeduplicationMetrics() {
  return api.get('/deduplication/metrics');
}
