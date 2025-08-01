import { supabase } from '@/lib/supabase/client';

type ApiResponse<T> = {
  data?: T;
  error?: string;
};

// Generic API request handler
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`/api/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    return { data };
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    return { 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
}

// Journal API
export const journalApi = {
  getEntries: async () => {
    return apiRequest<{ entries: any[] }>('journal');
  },
  createEntry: async (content: string, mood?: string) => {
    return apiRequest<{ entry: any }>('journal', {
      method: 'POST',
      body: JSON.stringify({ content, mood }),
    });
  },
};

// Fitness API
export const fitnessApi = {
  getActivities: async () => {
    return apiRequest<{ activities: any[] }>('fitness');
  },
  logActivity: async (activity: {
    activity_type: string;
    duration: number;
    calories?: number;
    notes?: string;
  }) => {
    return apiRequest<{ activity: any }>('fitness', {
      method: 'POST',
      body: JSON.stringify(activity),
    });
  },
};

// Water API
export const waterApi = {
  getIntake: async () => {
    return apiRequest<{ entries: any[] }>('water');
  },
  logIntake: async (amountMl: number) => {
    return apiRequest<{ entry: any }>('water', {
      method: 'POST',
      body: JSON.stringify({ amount_ml: amountMl }),
    });
  },
};

// Auth API
export const authApi = {
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },
  onAuthStateChange: (callback: any) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },
};
