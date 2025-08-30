'use client';

import { useState } from 'react';
import { MemoryContext } from '@/components/memory/MemoryContext';

export default function ContextTab() {
  const [ctxConvId, setCtxConvId] = useState<string>('');
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Conversation Memory Context</h2>
      <div className="flex items-center space-x-3">
        <input
          value={ctxConvId}
          onChange={(e) => setCtxConvId(e.target.value)}
          placeholder="Enter conversation ID"
          className="w-full md:w-1/2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      {ctxConvId && <MemoryContext conversationId={ctxConvId} />}
    </div>
  );
}
