'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import OverviewTab from './components/OverviewTab';
import BrowseTab from './components/BrowseTab';
import SearchTab from './components/SearchTab';
import CreateTab from './components/CreateTab';
import ContextTab from './components/ContextTab';

export default function ManageMemoriesPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'browse' | 'search' | 'create' | 'context'>('overview');

  return (
    <ProtectedRoute>
      <div className="min-h-[calc(100vh-8rem)] w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <AppLayout title="Memories" description="Manage and search your personal memories">
            {/* Tabs */}
            <div className="flex space-x-2 mb-6">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'browse', label: 'Browse' },
                { id: 'search', label: 'Search' },
                { id: 'create', label: 'Create' },
                { id: 'context', label: 'Context' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-3 py-2 text-sm rounded-md border ${
                    activeTab === (t.id as any)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Overview */}
            {activeTab === 'overview' && <OverviewTab />}

            {/* Browse */}
            {activeTab === 'browse' && <BrowseTab />}

            {/* Search */}
            {activeTab === 'search' && <SearchTab />}

            {/* Create */}
            {activeTab === 'create' && <CreateTab />}

            {/* Context */}
            {activeTab === 'context' && <ContextTab />}
          </AppLayout>
        </div>
      </div>
    </ProtectedRoute>
  );
}
