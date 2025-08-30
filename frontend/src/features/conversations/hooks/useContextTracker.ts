/**
 * Context Tracker Hook - Tracks conversation context to prevent repetition
 */

import { useState, useCallback, useRef } from 'react';

interface ContextState {
  discussedTopics: Set<string>;
  usedMemoryIds: Set<string>;
  contentHashes: Set<string>;
}

export function useContextTracker(conversationId: string) {
  const [contextState, setContextState] = useState<ContextState>({
    discussedTopics: new Set(),
    usedMemoryIds: new Set(),
    contentHashes: new Set()
  });

  const trackContent = useCallback((content: string, memoryIds?: string[]) => {
    const contentHash = hashContent(content);
    
    setContextState(prev => ({
      discussedTopics: new Set([...prev.discussedTopics, ...extractTopics(content)]),
      usedMemoryIds: new Set([...prev.usedMemoryIds, ...(memoryIds || [])]),
      contentHashes: new Set([...prev.contentHashes, contentHash])
    }));
  }, []);

  const isContentRepeated = useCallback((content: string): boolean => {
    const contentHash = hashContent(content);
    return contextState.contentHashes.has(contentHash);
  }, [contextState.contentHashes]);

  const getUsedMemoryIds = useCallback((): string[] => {
    return Array.from(contextState.usedMemoryIds);
  }, [contextState.usedMemoryIds]);

  const resetContext = useCallback(() => {
    setContextState({
      discussedTopics: new Set(),
      usedMemoryIds: new Set(),
      contentHashes: new Set()
    });
  }, []);

  return {
    trackContent,
    isContentRepeated,
    getUsedMemoryIds,
    resetContext,
    discussedTopics: Array.from(contextState.discussedTopics)
  };
}

function hashContent(content: string): string {
  // Simple hash function for content deduplication
  let hash = 0;
  const normalized = content.toLowerCase().trim();
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

function extractTopics(content: string): string[] {
  const topicKeywords = {
    'work': ['work', 'job', 'career', 'office', 'meeting', 'project'],
    'health': ['health', 'wellness'],
    'relationships': ['family', 'friend', 'relationship', 'partner'],
    'goals': ['goal', 'plan', 'objective', 'target', 'achieve'],
    'learning': ['learn', 'study', 'course', 'skill', 'knowledge']
  };

  const contentLower = content.toLowerCase();
  const topics: string[] = [];

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => contentLower.includes(keyword))) {
      topics.push(topic);
    }
  }

  return topics;
}
