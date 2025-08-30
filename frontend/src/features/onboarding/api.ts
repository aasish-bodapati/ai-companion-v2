import api from '@/lib/api';
import type { OnboardingProfileIn, OnboardingProfileOut } from './types';

export async function fetchMyOnboarding(): Promise<OnboardingProfileOut> {
  return api.get<OnboardingProfileOut>('/users/me/onboarding');
}

export async function saveMyOnboarding(payload: OnboardingProfileIn): Promise<OnboardingProfileOut> {
  return api.put<OnboardingProfileOut>('/users/me/onboarding', payload);
}

export async function completeMyOnboarding(): Promise<OnboardingProfileOut> {
  return api.post<OnboardingProfileOut>('/users/me/onboarding/complete');
}
