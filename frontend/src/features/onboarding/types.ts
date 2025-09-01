export interface OnboardingProfileIn {
  // New onboarding flow fields
  user_prompt?: string;
  processed_summary?: string;
  memory_chunks?: string[];
  structured_data?: Record<string, any>;
  
  // Personal assistant focused fields
  daily_schedule?: string;
  schedule_preferences?: string;
  fitness_goals?: string;
  nutrition_goals?: string;
  dietary_preferences?: string;
  communication_style?: string;
  additional_preferences?: string;
  
  // User narrative
  user_blueprint?: string;
  
  // Status
  completed?: boolean;
}



export interface OnboardingProfile extends OnboardingProfileIn {
  id: string;
  user_id: string;
  updated_at?: string;
}
