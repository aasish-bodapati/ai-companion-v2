import type { MemoryType, PrivacyLevel, RelationshipType } from '@/features/memory/api';

export const CONTENT_TYPES: Array<{ label: string; value: MemoryType | 'all' }> = [
  { label: 'All types', value: 'all' },
  // Core types
  { label: 'Conversation', value: 'conversation' },
  { label: 'Profile', value: 'profile' },
  { label: 'Preference', value: 'preference' },
  { label: 'Onboarding', value: 'onboarding' },
  { label: 'Message', value: 'message' },
  { label: 'Fact', value: 'fact' },
  // Enhanced semantic types
  { label: 'Goal', value: 'goal' },
  { label: 'Habit', value: 'habit' },
  { label: 'Achievement', value: 'achievement' },
  { label: 'Challenge', value: 'challenge' },
  { label: 'Learning', value: 'learning' },
  { label: 'Emotional State', value: 'emotional_state' },
  { label: 'Decision', value: 'decision' },
  { label: 'Planning', value: 'planning' },
  { label: 'Reflection', value: 'reflection' },
  { label: 'Feedback', value: 'feedback' },
  { label: 'Reminder', value: 'reminder' },
  { label: 'Milestone', value: 'milestone' },
  { label: 'Routine', value: 'routine' },
  { label: 'Skill', value: 'skill' },
  { label: 'Relationship', value: 'relationship' },
  { label: 'Event', value: 'event' },
];

export const PRIVACY_LEVELS: Array<{ label: string; value: PrivacyLevel }> = [
  { label: 'Public', value: 'public' },
  { label: 'Normal', value: 'normal' },
  { label: 'Private', value: 'private' },
  { label: 'Sensitive', value: 'sensitive' },
  { label: 'Confidential', value: 'confidential' },
];

export const RELATIONSHIP_TYPES: Array<{ label: string; value: RelationshipType; description: string }> = [
  { label: 'Contradicts', value: 'contradicts', description: 'Conflicts with another memory' },
  { label: 'Supports', value: 'supports', description: 'Reinforces another memory' },
  { label: 'Elaborates', value: 'elaborates', description: 'Provides more detail' },
  { label: 'Updates', value: 'updates', description: 'Updates information' },
  { label: 'Replaces', value: 'replaces', description: 'Supersedes another memory' },
  { label: 'Confirms', value: 'confirms', description: 'Validates another memory' },
  { label: 'Follows', value: 'follows', description: 'Comes after in sequence' },
  { label: 'Precedes', value: 'precedes', description: 'Comes before in sequence' },
  { label: 'Related to', value: 'related_to', description: 'Generally related' },
  { label: 'Similar to', value: 'similar_to', description: 'Similar content' },
  { label: 'Causes', value: 'causes', description: 'Leads to another memory' },
  { label: 'Caused by', value: 'caused_by', description: 'Result of another memory' },
];

export function typeBadgeColor(t: string): string {
  switch (t) {
    case 'conversation':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
    case 'profile':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200';
    case 'preference':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200';
    case 'onboarding':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200';
    case 'message':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    case 'fact':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
    case 'goal':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200';
    case 'habit':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200';
    case 'achievement':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
    case 'challenge':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
    case 'learning':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200';
    case 'emotional_state':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200';
    case 'decision':
      return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-200';
    case 'planning':
      return 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-200';
    case 'reflection':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
    case 'feedback':
      return 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-200';
    case 'reminder':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200';
    case 'milestone':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200';
    case 'routine':
      return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-200';
    case 'skill':
      return 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-200';
    case 'relationship':
      return 'bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-200';
    case 'event':
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
}

export function privacyBadgeColor(level: PrivacyLevel): string {
  switch (level) {
    case 'public':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
    case 'normal':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
    case 'private':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
    case 'sensitive':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
    case 'confidential':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
}

export function formatEmotionalValence(valence?: number): string {
  if (valence === undefined || valence === null) return 'Neutral';
  if (valence > 0.3) return 'Positive';
  if (valence < -0.3) return 'Negative';
  return 'Neutral';
}

export function emotionalValenceColor(valence?: number): string {
  if (valence === undefined || valence === null) return 'text-gray-500';
  if (valence > 0.3) return 'text-green-600';
  if (valence < -0.3) return 'text-red-600';
  return 'text-gray-500';
}

export function formatConfidenceScore(confidence?: number): string {
  if (confidence === undefined || confidence === null) return 'Unknown';
  const percentage = Math.round(confidence * 100);
  return `${percentage}%`;
}

export function formatRelationshipStrength(strength: number): string {
  if (strength >= 0.8) return 'Strong';
  if (strength >= 0.6) return 'Moderate';
  if (strength >= 0.4) return 'Weak';
  return 'Very Weak';
}
