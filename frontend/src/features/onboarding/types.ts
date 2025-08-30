export type ResponseStyle = 'Concise' | 'Detailed' | 'Balanced';
export type MemoryPolicy = 'RememberAll' | 'ImportantOnly' | 'NoMemory';

export interface Identity {
  name?: string;
  nickname?: string;
  pronouns?: string;
  birthday?: string; // YYYY-MM-DD
  location?: string;
}

export interface Interests {
  topics?: string[];
  otherTopic?: string;
  hobbies?: string;
  favorites?: string;
}

export interface Communication {
  responseStyle?: ResponseStyle;
  tone?: string[];
  smallTalkLevel?: 0 | 1 | 2;
}

export interface Goals {
  primaryReason?: string;
  personalGoals?: string;
  checkinsEnabled?: boolean;
}

export interface Boundaries {
  avoidTopics?: string;
  memoryPolicy?: MemoryPolicy;
  recallEnabled?: boolean;
}

export interface Fun {
  dreamTrip?: string;
  randomFact?: string;
  aiPersona?: string;
}

export interface OnboardingProfileIn {
  // Step 1 – Daily Schedule
  daily_schedule?: string;
  schedule_preferences?: string;
  avoid_times?: string;
  wake_up_time?: string;
  bedtime?: string;
  
  // Step 2 – Communication Style
  communication_style?: string;
  additional_preferences?: string;
  fitness_goals?: string;
  communication_preferences?: string;

  // Step 3 – Current Challenges
  current_challenges?: string[];
  challenge_details?: string;
  immediate_goal?: string;

  // Legacy/extended sections expected by existing UI components
  identity?: Identity;
  interests?: Interests;
  communication?: Communication;
  goals?: Goals;
  // Legacy goals array used in onboarding wizard UI
  life_goals?: string[];
  // Primary selected goal used in onboarding wizard UI
  primary_goal?: string;
  boundaries?: Boundaries;
  fun?: Fun;
  
  // Allow any additional string properties to avoid TypeScript errors
  [key: string]: any;
}

export interface OnboardingProfileOut extends OnboardingProfileIn {
  id: string;
  user_id: string;
  completed: boolean;
}
