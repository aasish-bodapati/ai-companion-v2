'use client';

import { useState } from 'react';
import { CONTENT_TYPES } from './common';
import { createMemory, type MemoryType } from '@/features/memory/api';

export default function CreateTab({ onCreated }: { onCreated?: () => void }) {
  const [cContent, setCContent] = useState<string>('');
  const [cType, setCType] = useState<MemoryType | 'fact'>('fact');
  const [cCore, setCCore] = useState<boolean>(false);
  const [cImportance, setCImportance] = useState<number>(50);
  const [cCategory, setCCategory] = useState<string>('');
  const [cConKey, setCConKey] = useState<string>('');
  const [cRankBoost, setCRankBoost] = useState<number>(0);
  const [cConvId, setCConvId] = useState<string>('');
  const [cMsgId, setCMsgId] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);

  const submitCreate = async () => {
    if (!cContent.trim()) return;
    setCreating(true);
    try {
      await createMemory({
        content: cContent.trim(),
        content_type: cType,
        core: cCore,
        importance_score: cImportance,
        category: cCategory || undefined,
        consolidation_key: cConKey || undefined,
        rank_boost: cRankBoost || undefined,
        conversation_id: cConvId || undefined,
        message_id: cMsgId || undefined,
      });
      setCContent('');
      setCType('fact');
      setCCore(false);
      setCImportance(50);
      setCCategory('');
      setCConKey('');
      setCRankBoost(0);
      setCConvId('');
      setCMsgId('');
      if (onCreated) onCreated();
    } catch (e) {
      console.error('Create failed', e);
      alert('Failed to create memory');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Create Memory</h2>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Content</label>
          <textarea
            value={cContent}
            onChange={(e) => setCContent(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <select
              value={cType}
              onChange={(e) => setCType(e.target.value as MemoryType)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CONTENT_TYPES.filter((t) => t.value !== 'all').map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Importance score (0–100)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={cImportance}
              onChange={(e) => setCImportance(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Category (optional)</label>
            <input
              value={cCategory}
              onChange={(e) => setCCategory(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Consolidation key (optional)</label>
            <input
              value={cConKey}
              onChange={(e) => setCConKey(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Rank boost (0–1, optional)</label>
            <input
              type="number"
              step={0.05}
              min={0}
              max={1}
              value={cRankBoost}
              onChange={(e) => setCRankBoost(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Conversation ID (optional)</label>
            <input
              value={cConvId}
              onChange={(e) => setCConvId(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Message ID (optional)</label>
            <input
              value={cMsgId}
              onChange={(e) => setCMsgId(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Core memory</label>
            <label className="flex items-center space-x-2 text-sm">
              <input type="checkbox" checked={cCore} onChange={(e) => setCCore(e.target.checked)} />
              <span>Mark as core</span>
            </label>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={submitCreate}
            disabled={creating || !cContent.trim()}
            className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
