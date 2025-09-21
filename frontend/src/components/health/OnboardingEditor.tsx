'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  UserIcon, 
  HeartIcon, 
  FlagIcon,
  CheckIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface OnboardingData {
  age?: number;
  gender?: string;
  height_cm?: number;
  current_weight_kg?: number;
  activity_level?: string;
  primary_goal?: string;
  completed?: boolean;
}

export function OnboardingEditor() {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<OnboardingData>({});

  const loadOnboardingData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await api.get('/health/profile/');
      setData(response || {});
    } catch (error) {
      console.error('Failed to load health profile data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadOnboardingData();
  }, [isAuthenticated, loadOnboardingData]);

  const handleInputChange = (field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!isAuthenticated) return;

    try {
      setSaving(true);
      
      // Check if profile exists
      const existingProfile = await api.get('/health/profile/');
      
      if (existingProfile) {
        // Update existing profile
        await api.put('/health/profile/', data);
      } else {
        // Create new profile
        await api.post('/health/profile/', data);
      }
      
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    loadOnboardingData(); // Reset to original data
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading profile data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <UserIcon className="h-5 w-5 text-blue-500" />
          Health Profile
          {!editing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              className="ml-auto hover:scale-105 transition-transform duration-200"
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your basic health information and goals
        </p>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-6">
            {/* Basic Info Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-blue-500" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age" className="text-gray-700 dark:text-gray-300">
                    Age
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    value={data.age || ''}
                    onChange={(e) => handleInputChange('age', parseInt(e.target.value) || '')}
                    placeholder="Enter your age"
                    className="mt-1 hover:border-blue-400 transition-colors duration-200 placeholder-subtle"
                  />
                </div>

                <div>
                  <Label htmlFor="gender" className="text-gray-700 dark:text-gray-300">
                    Gender
                  </Label>
                  <Select value={data.gender || ''} onValueChange={(value) => handleInputChange('gender', value)}>
                    <SelectTrigger className="mt-1 hover:border-blue-400 transition-colors duration-200 placeholder:text-gray-400 placeholder:italic">
                      <SelectValue placeholder="Choose your gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="height" className="text-gray-700 dark:text-gray-300">
                    Height (cm)
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    value={data.height_cm || ''}
                    onChange={(e) => handleInputChange('height_cm', parseFloat(e.target.value) || '')}
                    placeholder="Enter height in cm"
                    className="mt-1 hover:border-blue-400 transition-colors duration-200 placeholder-subtle"
                  />
                </div>

                <div>
                  <Label htmlFor="weight" className="text-gray-700 dark:text-gray-300">
                    Current Weight (kg)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    value={data.current_weight_kg || ''}
                    onChange={(e) => handleInputChange('current_weight_kg', parseFloat(e.target.value) || '')}
                    placeholder="Enter weight in kg"
                    className="mt-1 hover:border-blue-400 transition-colors duration-200 placeholder-subtle"
                  />
                </div>
              </div>
            </div>

            {/* Health Status Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <HeartIcon className="h-5 w-5 text-red-500" />
                Activity Level
              </h3>
              <div>
                <Label htmlFor="activity" className="text-gray-700 dark:text-gray-300">
                  How active are you?
                </Label>
                <Select value={data.activity_level || ''} onValueChange={(value) => handleInputChange('activity_level', value)}>
                  <SelectTrigger className="mt-1 hover:border-blue-400 transition-colors duration-200 placeholder:text-gray-400 placeholder:italic">
                    <SelectValue placeholder="Choose your activity level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary - Little to no exercise</SelectItem>
                    <SelectItem value="light">Light - Light exercise 1-3 days/week</SelectItem>
                    <SelectItem value="moderate">Moderate - Moderate exercise 3-5 days/week</SelectItem>
                    <SelectItem value="active">Active - Heavy exercise 6-7 days/week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Goals Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FlagIcon className="h-5 w-5 text-green-500" />
                Your Goals
              </h3>
              <div>
                <Label htmlFor="goal" className="text-gray-700 dark:text-gray-300">
                  Primary Goal
                </Label>
                <Select value={data.primary_goal || ''} onValueChange={(value) => handleInputChange('primary_goal', value)}>
                  <SelectTrigger className="mt-1 hover:border-blue-400 transition-colors duration-200 placeholder:text-gray-400 placeholder:italic">
                    <SelectValue placeholder="Choose your main goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lose_weight">Lose Weight</SelectItem>
                    <SelectItem value="gain_weight">Gain Weight</SelectItem>
                    <SelectItem value="maintain_weight">Maintain Weight</SelectItem>
                    <SelectItem value="build_muscle">Build Muscle</SelectItem>
                    <SelectItem value="improve_fitness">Improve Fitness</SelectItem>
                    <SelectItem value="general_health">General Health & Wellness</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1 hover:scale-105 transition-transform duration-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 hover:scale-105 transition-all duration-200"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Display Mode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-blue-500" />
                  Basic Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Age:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{data.age || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Gender:</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{data.gender || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Height:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{data.height_cm ? `${data.height_cm} cm` : 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Weight:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{data.current_weight_kg ? `${data.current_weight_kg} kg` : 'Not set'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <HeartIcon className="h-5 w-5 text-red-500" />
                  Health & Goals
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Activity Level:</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{data.activity_level || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Primary Goal:</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{data.primary_goal?.replace('_', ' ') || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      data.completed 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {data.completed ? 'Completed' : 'Incomplete'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
