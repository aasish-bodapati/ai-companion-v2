"use client";

import { useState, useEffect } from 'react';
import { fetchRetrievalSettings, type RetrievalSettings as RetrievalSettingsType } from '@/features/settings/api';
import logger from '@/utils/logger';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

export function RetrievalSettings() {
  const [data, setData] = useState<RetrievalSettingsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetchRetrievalSettings();
        setData(res);
      } catch (e) {
        logger.error('Failed to load retrieval settings', e);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cog6ToothIcon className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Retrieval Settings</h3>
        </div>
        <span className="text-xs text-gray-500">Read-only</span>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-6">
        {loading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : !data ? (
          <div className="text-sm text-red-600">Failed to load settings.</div>
        ) : (
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Memory Enabled</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{String(data.MEMORY_ENABLED)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Provider</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{data.MEMORY_PROVIDER}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Embedding Model</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{data.EMBEDDING_MODEL_NAME}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Top K</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{data.RETRIEVAL_TOP_K}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Recent Messages</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{data.RETRIEVAL_RECENT_MESSAGES}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Min Relevance</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{data.MEMORY_MIN_RELEVANCE}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
