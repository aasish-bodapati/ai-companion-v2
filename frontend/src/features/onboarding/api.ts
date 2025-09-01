import { api } from '@/lib/api';
import type { OnboardingProfileIn, OnboardingProfile } from './types';

export async function fetchMyOnboarding(): Promise<OnboardingProfile | null> {
  try {
    const response = await api.get('/users/me/onboarding');
    // The api.get() function returns the data directly, not wrapped in response.data
    return response || null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      // Profile doesn't exist yet, return null
      return null;
    }
    // For any other error, also return null instead of throwing
    console.error('Error fetching onboarding profile:', error);
    return null;
  }
}

export async function saveMyOnboarding(profile: OnboardingProfileIn): Promise<OnboardingProfile> {
  const response = await api.put('/users/me/onboarding', profile);
  return response;
}

export async function completeOnboarding(): Promise<{ message: string }> {
  const response = await api.post('/users/me/onboarding/complete');
  return response;
}
