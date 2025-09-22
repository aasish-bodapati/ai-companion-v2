'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageLoading } from '@/components/ui/loading-states';
import { UserIcon, CogIcon, BellIcon, ShieldCheckIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';

interface HealthProfile {
  id: number;
  user_id: number;
  age?: number;
  gender?: string;
  height_cm?: number;
  current_weight_kg?: number;
  activity_level?: string;
  created_at?: string;
  updated_at?: string;
}

export default function ProfilePage() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const router = useRouter();
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<HealthProfile>>({});

  // Debug health profile state
  useEffect(() => {
    console.log('Health profile state updated:', healthProfile);
  }, [healthProfile]);

  // Fetch health profile data
  useEffect(() => {
    const fetchHealthProfile = async () => {
      console.log('Auth state:', { isAuthenticated, isLoading, user });
      if (!isAuthenticated) {
        console.log('Not authenticated, skipping health profile fetch');
        return;
      }
      
      try {
        setIsLoadingProfile(true);
        console.log('Fetching health profile...');
        const response = await api.get('/health/profile/');
        console.log('Health profile response:', response);
        setHealthProfile(response);
      } catch (error) {
        console.error('Failed to fetch health profile:', error);
        console.error('Error details:', error);
        // Profile might not exist yet, that's okay
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchHealthProfile();
  }, [isAuthenticated, isLoading, user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleEdit = () => {
    setEditData(healthProfile || {});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditData({});
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      if (healthProfile) {
        // Update existing profile
        const response = await api.put('/health/profile/', editData);
        setHealthProfile(response.profile);
      } else {
        // Create new profile
        const response = await api.post('/health/profile/', editData);
        setHealthProfile(response.profile);
      }
      
      setIsEditing(false);
      setEditData({});
    } catch (error) {
      console.error('Failed to save health profile:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading while auth is initializing
  if (isLoading) {
    return <PageLoading className="min-h-screen" message="Loading..." />;
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <PageLoading className="min-h-screen" message="Redirecting to login..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-3xl mb-8">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative px-6 py-10">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                    Profile & Settings
                  </h1>
                  <p className="text-lg md:text-xl text-white/90 mb-4 max-w-2xl">
                    Manage your account settings, preferences, and personal information in one place.
                  </p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                    <button
                      className="bg-white/20 text-white hover:bg-white/30 px-6 py-3 rounded-xl font-semibold text-lg flex items-center gap-2 backdrop-blur-sm border-0 transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                      <CogIcon className="h-5 w-5" />
                      <span>Account Settings</span>
                    </button>
                    <button
                      className="bg-white/20 text-white hover:bg-white/30 px-6 py-3 rounded-xl font-semibold text-lg flex items-center gap-2 backdrop-blur-sm border-0 transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                      <ShieldCheckIcon className="h-5 w-5" />
                      <span>Privacy & Security</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-white/80">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-sm">Account Management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                      <span className="text-sm">Privacy Controls</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span className="text-sm">Personal Data</span>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <UserIcon className="h-16 w-16 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Account Details */}
              <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <UserIcon className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Full Name
                    </label>
                    <p className="text-lg text-gray-900 dark:text-white font-medium">
                      {user?.full_name || 'Not provided'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <p className="text-lg text-gray-900 dark:text-white font-medium">
                      {user?.email || 'Not provided'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      User ID
                    </label>
                    <p className="text-lg text-gray-900 dark:text-white font-mono font-medium">
                      {user?.id || 'Not available'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Health Profile */}
              <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <UserIcon className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                      Health Profile
                    </CardTitle>
                    {!isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEdit}
                        className="flex items-center gap-2"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoadingProfile ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 dark:text-gray-400 mt-2">Loading profile...</p>
                    </div>
                  ) : isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Age
                          </label>
                          <input
                            type="number"
                            value={editData.age || ''}
                            onChange={(e) => setEditData(prev => ({ ...prev, age: parseInt(e.target.value) || undefined }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Enter your age"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Gender
                          </label>
                          <select
                            value={editData.gender || ''}
                            onChange={(e) => setEditData(prev => ({ ...prev, gender: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Height (cm)
                          </label>
                          <input
                            type="number"
                            value={editData.height_cm || ''}
                            onChange={(e) => setEditData(prev => ({ ...prev, height_cm: parseFloat(e.target.value) || undefined }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Enter your height"
                          />
                        </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                     Weight (kg)
                   </label>
                   <input
                     type="number"
                     value={editData.current_weight_kg || ''}
                     onChange={(e) => setEditData(prev => ({ ...prev, current_weight_kg: parseFloat(e.target.value) || undefined }))}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                     placeholder="Enter your weight"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                     Activity Level
                   </label>
                   <select
                     value={editData.activity_level || ''}
                     onChange={(e) => setEditData(prev => ({ ...prev, activity_level: e.target.value }))}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                   >
                     <option value="">Select activity level</option>
                     <option value="sedentary">Sedentary</option>
                     <option value="lightly_active">Lightly Active</option>
                     <option value="moderately_active">Moderately Active</option>
                     <option value="very_active">Very Active</option>
                     <option value="extremely_active">Extremely Active</option>
                   </select>
                 </div>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="flex items-center gap-2 border-2 border-white"
                        >
                          {isSaving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <CheckIcon className="h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancel}
                          disabled={isSaving}
                          className="flex items-center gap-2"
                        >
                          <XMarkIcon className="h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Age
                          </label>
                          <p className="text-lg text-gray-900 dark:text-white font-medium">
                            {healthProfile?.age || 'Not provided'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Gender
                          </label>
                          <p className="text-lg text-gray-900 dark:text-white font-medium">
                            {healthProfile?.gender || 'Not provided'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Height (cm)
                          </label>
                          <p className="text-lg text-gray-900 dark:text-white font-medium">
                            {healthProfile?.height_cm || 'Not provided'}
                          </p>
                        </div>
                 <div className="space-y-2">
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                     Weight (kg)
                   </label>
                   <p className="text-lg text-gray-900 dark:text-white font-medium">
                     {healthProfile?.current_weight_kg || 'Not provided'}
                   </p>
                 </div>
                 <div className="space-y-2">
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                     Activity Level
                   </label>
                   <p className="text-lg text-gray-900 dark:text-white font-medium">
                     {healthProfile?.activity_level ? healthProfile.activity_level.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not provided'}
                   </p>
                 </div>
                      </div>
                      {!healthProfile && (
                        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                          No health profile found. Click Edit to create one.
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Settings */}
            <div className="space-y-6">
              <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <CogIcon className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                    Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start h-12 text-left">
                    <BellIcon className="h-5 w-5 mr-3" />
                    Notifications
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-12 text-left">
                    <ShieldCheckIcon className="h-5 w-5 mr-3" />
                    Privacy
                  </Button>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}