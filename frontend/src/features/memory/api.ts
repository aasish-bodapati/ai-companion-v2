import api from '@/lib/api';

export type MemoryType = 'conversation' | 'profile' | 'preference' | 'onboarding' | 'message' | 'fact' |
  'goal' | 'habit' | 'achievement' | 'challenge' | 'learning' | 'emotional_state' | 'decision' | 
  'planning' | 'reflection' | 'feedback' | 'reminder' | 'milestone' | 'routine' | 'skill' | 'relationship' | 'event';

export type PrivacyLevel = 'public' | 'normal' | 'private' | 'sensitive' | 'confidential';

export type RelationshipType = 'contradicts' | 'supports' | 'elaborates' | 'updates' | 'replaces' | 'confirms' |
  'follows' | 'precedes' | 'concurrent' | 'parent_of' | 'child_of' | 'sibling_of' | 'causes' | 'caused_by' |
  'enables' | 'prevents' | 'related_to' | 'similar_to' | 'opposite_to';

export type EvolutionType = 'consolidation' | 'correction' | 'enhancement' | 'simplification' | 'reinforcement' |
  'forgetting' | 'revival' | 'archival' | 'merge' | 'split' | 'categorization' | 'recontextualization';

export interface MemoryMetadata {
  context?: string;
  mood?: string;
  energy_level?: number;
  goal_relevance?: Record<string, number>;
  priority_level?: string;
  people_mentioned?: string[];
  location?: string;
  activity_type?: string;
  learning_objective?: string;
  skill_level?: string;
  privacy_level?: PrivacyLevel;
  sharing_preferences?: string[];
  source_confidence?: number;
  verification_status?: string;
}

export interface MemoryNode {
  id: string;
  content: string;
  content_type: string;
  user_id: string;
  conversation_id?: string | null;
  
  // Enhanced categorization
  category?: string | null;
  subcategory?: string | null;
  
  // Temporal context
  effective_date?: string | null;
  expiration_date?: string | null;
  
  // Enhanced scoring
  relevance_score?: number;
  importance_score?: number; // 0..100 UI-facing importance
  confidence_score?: number;
  emotional_valence?: number;
  
  // Relationship modeling
  parent_memory_id?: string | null;
  related_memory_ids?: string[] | null;
  
  // Enhanced metadata
  memory_metadata?: MemoryMetadata | null;
  tags?: string[] | null;
  entities?: string[] | null;
  
  // Access patterns
  access_count?: number;
  last_accessed?: string | null;
  created_via?: string | null;
  
  // Privacy and sensitivity
  privacy_level?: PrivacyLevel;
  is_core?: boolean;
  
  timestamp: string; // ISO timestamp
  faiss_id?: string; // optional, if present
}

export interface MemoryRelationship {
  id: string;
  source_memory_id: string;
  target_memory_id: string;
  relationship_type: RelationshipType;
  strength: number;
  context?: string | null;
  created_at: string;
  created_by?: string | null;
}

export interface MemoryEvolution {
  id: string;
  memory_id: string;
  evolution_type: EvolutionType;
  old_content?: string | null;
  new_content?: string | null;
  old_metadata?: Record<string, any> | null;
  new_metadata?: Record<string, any> | null;
  reason?: string | null;
  confidence: number;
  timestamp: string;
  triggered_by?: string | null;
}

export async function listMyMemories(params?: { content_type?: string; core?: boolean; limit?: number }): Promise<MemoryNode[]> {
  return api.get<MemoryNode[]>('/memory/users/me/memories', params);
}

export interface MemorySearchResult {
  faiss_id: string;
  content: string;
  content_type: string;
  relevance_score: number; // boosted relevance
  timestamp: string;
  memory_metadata?: Record<string, any> | null;
}

export async function searchMyMemories(params: {
  query: string;
  content_type?: string;
  limit?: number;
  min_relevance?: number;
  debug?: boolean;
}): Promise<MemorySearchResult[]> {
  const { query, content_type, limit = 8, min_relevance = 0.5, debug = false } = params;
  const q: Record<string, string> = {
    query,
    limit: String(limit),
    min_relevance: String(min_relevance),
  };
  if (content_type) q.content_type = content_type;
  if (debug) q.debug = 'true';
  return api.get<MemorySearchResult[]>('/memory/users/me/memories/search', q);
}

export interface MemoryContextItem {
  id: string;
  content: string;
  type: MemoryType;
  relevance: number;
  timestamp: string; // ISO
  reason?: string;
}

export async function getConversationMemoryContext(conversationId: string): Promise<{ context: MemoryContextItem[] }> {
  return api.get<{ context: MemoryContextItem[] }>(`/conversations/${conversationId}/memory-context`);
}

export async function deleteMemory(memoryId: string): Promise<void> {
  await api.delete<void>(`/memory/memories/${memoryId}`);
}

export async function hardDeleteMemory(memoryId: string): Promise<void> {
  await api.delete<void>(`/memory/memories/${memoryId}/hard`);
}

export interface UpdateMemoryIn {
  content?: string;
  relevance_score?: number;
  importance_score?: number; // 0..100
  core?: boolean; // promote/demote core
}

export async function updateMemory(memoryId: string, body: UpdateMemoryIn): Promise<MemoryNode> {
  return api.patch<MemoryNode>(`/memory/memories/${memoryId}`, body);
}

export interface CreateMemoryIn {
  content: string;
  content_type?: string; // conversation | message | fact | onboarding | preference | profile
  conversation_id?: string | null;
  importance?: number; // 0..1 (backend scales)
  importance_score?: number; // 0..100
  source?: string;
  message_id?: string;
  core?: boolean;
  category?: string;
  consolidation_key?: string;
  rank_boost?: number; // 0..1
}

export async function createMemory(body: CreateMemoryIn): Promise<MemoryNode> {
  return api.post<MemoryNode>(`/memory/memories`, body);
}

export interface MemoryDigestOut {
  total_count: number;
  core_count: number;
  reinforced_sum: number;
  level: number; // 1..5
  candidate_ids: string[];
}

export async function getMemoryDigest(): Promise<MemoryDigestOut> {
  return api.get<MemoryDigestOut>(`/memory/users/me/memories/digest`);
}

export interface LifecycleOut {
  suppressed: number;
  consolidated: number;
}

export async function enforceLifecycle(consolidate = true): Promise<LifecycleOut> {
  return api.post<LifecycleOut>(`/memory/users/me/memories/lifecycle?consolidate=${consolidate ? 'true' : 'false'}`, {});
}

export async function consolidateMemories(): Promise<{ status: string; keys?: number; suppressed?: number }> {
  return api.post<{ status: string; keys?: number; suppressed?: number }>(`/memory/users/me/memories/consolidate`, {});
}

export interface MessageFeedbackIn {
  signal: 'up' | 'down';
  reason?: string;
  faiss_id?: string; // optional targeted memory id
}

export interface MessageFeedbackOut {
  status: 'recorded';
  signal: 'up' | 'down';
}

export async function sendMessageFeedback(messageId: string, body: MessageFeedbackIn): Promise<MessageFeedbackOut> {
  return api.post<MessageFeedbackOut>(`/messages/${messageId}/feedback`, body);
}

export async function reinforceMemory(memoryId: string, amount = 1): Promise<MemoryNode> {
  return api.post<MemoryNode>(`/memory/memories/${memoryId}/reinforce`, { amount });
}

// --- Audit history ---
export interface MemoryAuditItem {
  id: string;
  user_id: string;
  faiss_id: string;
  action: string; // update | soft_delete | hard_delete | search
  source?: string | null;
  conversation_id?: string | null;
  message_id?: string | null;
  before_content?: string | null;
  after_content?: string | null;
  before_metadata?: string | null;
  after_metadata?: string | null;
  request_ip?: string | null;
  user_agent?: string | null;
  created_at: string; // ISO
}

export interface MemoryAuditListOut {
  items: MemoryAuditItem[];
  total: number;
}

export async function getMemoryAudit(
  faissId: string,
  params?: { skip?: number; limit?: number }
): Promise<MemoryAuditListOut> {
  const q: Record<string, string> = {};
  if (params?.skip !== undefined) q.skip = String(params.skip);
  if (params?.limit !== undefined) q.limit = String(params.limit);
  return api.get<MemoryAuditListOut>(`/memory/memories/${faissId}/audit`, q);
}

// === Enhanced Memory API ===

export interface EnhancedMemoryCreate {
  content: string;
  content_type?: string;
  conversation_id?: string | null;
  category?: string;
  subcategory?: string;
  tags?: string[];
  entities?: string[];
  privacy_level?: PrivacyLevel;
  metadata?: MemoryMetadata;
  effective_date?: string;
  expiration_date?: string;
}

export interface EnhancedMemoryData {
  memory: MemoryNode;
  relationships: Array<{
    id: string;
    type: RelationshipType;
    target_memory_id: string;
    strength: number;
    context?: string;
  }>;
  evolution_history: Array<{
    id: string;
    type: EvolutionType;
    timestamp: string;
    reason?: string;
    confidence: number;
  }>;
}

export async function createEnhancedMemory(body: EnhancedMemoryCreate): Promise<MemoryNode> {
  return api.post<MemoryNode>('/memory/enhanced/memories', body);
}

export async function getEnhancedMemory(
  memoryId: string, 
  includeEvolution = true
): Promise<EnhancedMemoryData> {
  return api.get<EnhancedMemoryData>(
    `/memory/enhanced/memories/${memoryId}?include_evolution=${includeEvolution}`
  );
}

export interface UpdateEnhancedMemory {
  content?: string;
  category?: string;
  subcategory?: string;
  effective_date?: string;
  expiration_date?: string;
  relevance_score?: number;
  importance_score?: number;
  confidence_score?: number;
  emotional_valence?: number;
  parent_memory_id?: string;
  related_memory_ids?: string[];
  memory_metadata?: MemoryMetadata;
  tags?: string[];
  entities?: string[];
  privacy_level?: PrivacyLevel;
  is_core?: boolean;
}

export async function updateEnhancedMemory(
  memoryId: string, 
  updates: UpdateEnhancedMemory
): Promise<MemoryNode> {
  return api.patch<MemoryNode>(`/memory/enhanced/memories/${memoryId}`, updates);
}

// Memory Relationships

export interface CreateMemoryRelationship {
  source_memory_id: string;
  target_memory_id: string;
  relationship_type: RelationshipType;
  strength?: number;
  context?: string;
  created_by?: string;
}

export async function createMemoryRelationship(
  memoryId: string,
  relationship: CreateMemoryRelationship
): Promise<MemoryRelationship> {
  return api.post<MemoryRelationship>(`/memory/memories/${memoryId}/relationships`, relationship);
}

export async function getMemoryRelationships(
  memoryId: string,
  includeIncoming = true,
  includeOutgoing = true
): Promise<MemoryRelationship[]> {
  return api.get<MemoryRelationship[]>(
    `/memory/memories/${memoryId}/relationships?include_incoming=${includeIncoming}&include_outgoing=${includeOutgoing}`
  );
}

export async function getMemoryClusters(): Promise<string[][]> {
  return api.get<string[][]>('/memory/users/me/memory-clusters');
}

// Memory Evolution

export interface CreateMemoryEvolution {
  memory_id: string;
  evolution_type: EvolutionType;
  old_content?: string;
  new_content?: string;
  old_metadata?: Record<string, any>;
  new_metadata?: Record<string, any>;
  reason?: string;
  confidence?: number;
  triggered_by?: string;
}

export async function recordMemoryEvolution(
  memoryId: string,
  evolution: CreateMemoryEvolution
): Promise<MemoryEvolution> {
  return api.post<MemoryEvolution>(`/memory/memories/${memoryId}/evolution`, evolution);
}

export async function getMemoryEvolutionHistory(memoryId: string): Promise<MemoryEvolution[]> {
  return api.get<MemoryEvolution[]>(`/memory/memories/${memoryId}/evolution`);
}

// Memory Lifecycle

export interface LifecycleRequest {
  include_consolidation?: boolean;
  include_forgetting?: boolean;
  include_reinforcement?: boolean;
}

export interface LifecycleResults {
  consolidations: Array<{
    memory_id: string;
    type: EvolutionType;
    reason: string;
  }>;
  forgetting: Array<{
    memory_id: string;
    type: EvolutionType;
    reason: string;
  }>;
  reinforcements: Array<{
    memory_id: string;
    type: EvolutionType;
    reason: string;
  }>;
  stats: {
    total_memories: number;
    evolved_memories: number;
    consolidated_memories: number;
    forgotten_memories: number;
    reinforced_memories: number;
    evolution_rate: number;
  };
}

export async function runMemoryLifecycle(request: LifecycleRequest): Promise<LifecycleResults> {
  return api.post<LifecycleResults>('/memory/users/me/memory-lifecycle', request);
}

// Memory Analysis

export interface MemoryPatterns {
  total_memories: number;
  memory_types: Record<string, number>;
  categories: Record<string, number>;
  emotional_patterns: Record<string, number>;
  relationship_clusters: Array<{
    size: number;
    memory_ids: string[];
  }>;
  insights: string[];
}

export async function analyzeMemoryPatterns(days = 30): Promise<MemoryPatterns> {
  return api.get<MemoryPatterns>(`/memory/users/me/memory-patterns?days=${days}`);
}

export interface MemoryImprovement {
  memory_id: string;
  memory_content: string;
  suggestion_type: EvolutionType;
  reason: string;
  confidence: number;
  suggested_content?: string;
  suggested_metadata?: Record<string, any>;
}

export async function getMemoryImprovements(limit = 10): Promise<MemoryImprovement[]> {
  return api.get<MemoryImprovement[]>(`/memory/users/me/memory-suggestions?limit=${limit}`);
}

// Enhanced Search

export interface EnhancedSearchRequest {
  query: string;
  content_types?: string[];
  categories?: string[];
  tags?: string[];
  privacy_levels?: PrivacyLevel[];
  date_range?: { start: string; end: string };
  emotional_valence_range?: { min: number; max: number };
  importance_range?: { min: number; max: number };
  limit?: number;
  min_relevance?: number;
  include_relationships?: boolean;
  include_evolution?: boolean;
}

export async function enhancedMemorySearch(request: EnhancedSearchRequest): Promise<EnhancedMemoryData[]> {
  return api.post<EnhancedMemoryData[]>('/memory/users/me/memories/enhanced-search', request);
}

// Memory Statistics

export interface MemoryStatistics {
  lifecycle: {
    total_memories: number;
    evolved_memories: number;
    consolidated_memories: number;
    forgotten_memories: number;
    reinforced_memories: number;
    evolution_rate: number;
  };
  patterns: MemoryPatterns;
  clusters: {
    count: number;
    sizes: number[];
    average_size: number;
  };
}

export async function getMemoryStatistics(days = 30): Promise<MemoryStatistics> {
  return api.get<MemoryStatistics>(`/memory/users/me/memory-stats?days=${days}`);
}

// Type Information

export interface MemoryTypeInfo {
  type: string;
  description: string;
  default_categories: string[];
  default_subcategories: string[];
  typical_privacy_level: PrivacyLevel;
  default_importance_range: [number, number];
  decay_half_life_days: number;
}

export async function getMemoryTypes(): Promise<MemoryTypeInfo[]> {
  return api.get<MemoryTypeInfo[]>('/memory/memory-types');
}

export async function getRelationshipTypes(): Promise<string[]> {
  return api.get<string[]>('/memory/relationship-types');
}

export async function getEvolutionTypes(): Promise<string[]> {
  return api.get<string[]>('/memory/evolution-types');
}

export async function suggestMemoryCategories(content: string, memoryType: string): Promise<string[]> {
  return api.post<string[]>('/memory/suggest-categories', { content, memory_type: memoryType });
}

// Batch Operations

export interface BatchMemoryOperation {
  memory_ids: string[];
  operation: 'delete' | 'archive' | 'categorize' | 'tag';
  parameters?: Record<string, any>;
}

export interface BatchOperationResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
}

export async function batchMemoryOperation(operation: BatchMemoryOperation): Promise<BatchOperationResult> {
  return api.post<BatchOperationResult>('/memory/users/me/memories/batch', operation);
}
