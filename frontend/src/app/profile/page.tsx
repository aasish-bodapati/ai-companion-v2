'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { MemoryStatus } from '@/components/memory/MemoryStatus';
import { useState, useEffect } from 'react';
import { RetrievalSettings } from '@/features/settings/retrieval-settings';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, UserCircle, SparklesIcon, AlertTriangle, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { PasswordChangeModal } from '@/features/profile/PasswordChangeModal';
import { AccountDeletionModal } from '@/features/profile/AccountDeletionModal';
import OnboardingPreferences from '@/features/profile/OnboardingPreferences';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'account' | 'preferences' | 'onboarding'>('account');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  


  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handlePasswordChangeSuccess = () => {
    // Could show a toast notification here
    console.log('Password changed successfully');
  };

  // Show loading state while user is being fetched
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">Loading profile...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-[calc(100vh-8rem)] w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <AppLayout 
          title="Your Profile"
          description="Manage your account information and settings"
        >
          <div className="space-y-6">


            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex gap-6" aria-label="Tabs">
                <button
                  type="button"
                  className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium focus:outline-none ${
                    activeTab === 'account'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('account')}
                >
                  Account
                </button>

                <button
                  type="button"
                  className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium focus:outline-none ${
                    activeTab === 'preferences'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('preferences')}
                >
                  Preferences
                </button>
              </nav>
            </div>

            {activeTab === 'account' && (
              <>
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Account Information</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                        Personal details and account information
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
                <div className="mt-8 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Account Settings</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Manage your account preferences.</p>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-6">
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-md font-medium text-gray-900 dark:text-white">Change Password</h4>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Update your password regularly to keep your account secure.</p>
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => setIsPasswordModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                          >
                            Change Password
                          </button>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h4 className="text-md font-medium text-gray-900 dark:text-white">Danger Zone</h4>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Permanently delete your account and all associated data.</p>
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                          >
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}



            {activeTab === 'preferences' && (
              <div className="space-y-6">
                {/* Memory System Status */}
                <MemoryStatus />
                {/* Retrieval Settings (read-only) */}
                <RetrievalSettings />
                
                {/* Onboarding Preferences */}
                <OnboardingPreferences />
              </div>
            )}
          </div>
        </AppLayout>
      </div>

      {/* Modals */}
      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={handlePasswordChangeSuccess}
      />
      
      <AccountDeletionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
