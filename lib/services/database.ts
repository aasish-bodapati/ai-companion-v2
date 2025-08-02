import { supabase } from '@/lib/supabase/client';

// Types based on our database schema
type JournalEntry = {
  id?: string;
  user_id: string;
  content: string;
  mood?: string;
  created_at?: string;
  updated_at?: string;
};

type FitnessActivity = {
  id?: string;
  user_id: string;
  activity_type: string;
  duration_minutes: number;
  calories_burned?: number;
  notes?: string;
  date: string;
  created_at?: string;
};

type WaterIntake = {
  id?: string;
  user_id: string;
  amount_ml: number;
  timestamp: string;
};

type MoodEntry = {
  id?: string;
  user_id: string;
  mood: string;
  energy_level?: number;
  notes?: string;
  created_at?: string;
};

export const database = {
  // Journal Entries
  async getJournalEntries(userId: string) {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  },

  async createJournalEntry(entry: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert([entry])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  // Fitness Activities
  async getFitnessActivities(userId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('fitness_activities')
      .select('*')
      .eq('user_id', userId);

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query.order('date', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createFitnessActivity(activity: Omit<FitnessActivity, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('fitness_activities')
      .insert([activity])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  // Water Intake
  async getWaterIntake(userId: string, date: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('water_intake')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startOfDay.toISOString())
      .lte('timestamp', endOfDay.toISOString())
      .order('timestamp', { ascending: false });
      
    if (error) throw error;
    return data;
  },

  async logWaterIntake(entry: Omit<WaterIntake, 'id'>) {
    const { data, error } = await supabase
      .from('water_intake')
      .insert([entry])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  // Mood Entries
  async getMoodEntries(userId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createMoodEntry(entry: Omit<MoodEntry, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('mood_entries')
      .insert([entry])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  // Profile
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error; // 116 = no rows
    return data;
  },

  async updateProfile(userId: string, updates: { full_name?: string; avatar_url?: string }) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
};

export type { JournalEntry, FitnessActivity, WaterIntake, MoodEntry };
