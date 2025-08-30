'use client';

import { useState } from 'react';
import { CONTENT_TYPES, typeBadgeColor } from './common';
import { searchMyMemories, type MemorySearchResult, type MemoryType } from '@/features/memory/api';

export default function SearchTab() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchType, setSearchType] = useState<MemoryType | 'all'>('all');
  const [minRel, setMinRel] = useState<number>(0.5);
  const [debug, setDebug] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [results, setResults] = useState<MemorySearchResult[]>([]);

  const runSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await searchMyMemories({
        query: searchQuery.trim(),
        content_type: searchType === 'all' ? undefined : searchType,
        min_relevance: minRel,
        limit: 20,
        debug,
      });
      setResults(res);
    } catch (e) {
      console.error('Search failed', e);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Semantic Search</h2>
      <div className="flex flex-col md:flex-row md:items-center md:space-x-3 space-y-3 md:space-y-0">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search memories semantically (e.g., 'favorite coffee')"
          className="w-full md:w-1/2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value as MemoryType | 'all')}
          className="w-full md:w-56 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {CONTENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center space-x-4">
        <label className="flex-1 text-sm">
          <div className="flex justify-between">
            <span>Min relevance: {Math.round(minRel * 100)}%</span>
            <span className="text-gray-500">0–100%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={minRel}
            onChange={(e) => setMinRel(Number(e.target.value))}
            className="w-full"
          />
        </label>
        <label className="inline-flex items-center space-x-2 text-sm">
          <input type="checkbox" checked={debug} onChange={(e) => setDebug(e.target.checked)} />
          <span>Debug</span>
        </label>
        <button
          onClick={runSearch}
          disabled={searching || !searchQuery.trim()}
          className="px-3 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {searching ? 'Searching…' : 'Search'}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
        {searching ? (
          <div className="p-6 text-sm text-gray-500">Searching…</div>
        ) : results.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No results yet.</div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {results.map((r) => (
              <li key={r.faiss_id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${typeBadgeColor(r.content_type)}`}>{r.content_type}</span>
                      <span className="text-xs text-gray-500">{new Date(r.timestamp).toLocaleString()}</span>
                      <span className="text-xs text-blue-600">relevance {Math.round(r.relevance_score * 100)}%</span>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{r.content}</p>
                    {debug && r.memory_metadata && (
                      <pre className="mt-2 text-xs text-gray-500 overflow-x-auto">{JSON.stringify(r.memory_metadata, null, 2)}</pre>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
