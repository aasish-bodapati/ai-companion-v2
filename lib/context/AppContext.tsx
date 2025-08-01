'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  useJournalEntries, 
  useCreateJournalEntry 
} from '../hooks/useJournalEntries';
import { 
  useFitnessActivities, 
  useLogFitnessActivity 
} from '../hooks/useFitnessActivities';
import { 
  useTodaysWaterIntake, 
  useLogWaterIntake 
} from '../hooks/useWaterIntake';
import { toast } from '@/components/ui/use-toast';

type AppContextType = {
  // Auth
  session: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  
  // Journal
  journalEntries: any[];
  createJournalEntry: (content: string, mood?: string) => Promise<void>;
  
  // Fitness
  fitnessActivities: any[];
  logFitnessActivity: (activity: any) => Promise<void>;
  
  // Water
  waterIntake: any;
  logWaterIntake: (amountMl: number) => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Auth
  const { 
    session, 
    isLoading, 
    isAuthenticated, 
    signIn, 
    signUp, 
    signOut: signOutAuth 
  } = useAuth();
  
  // Journal
  const { data: journalEntries = [] } = useJournalEntries();
  const { mutateAsync: createJournalEntry } = useCreateJournalEntry();
  
  // Fitness
  const { data: fitnessActivities = [] } = useFitnessActivities();
  const { mutateAsync: logFitnessActivity } = useLogFitnessActivity();
  
  // Water
  const { data: waterIntake = { entries: [], totalMl: 0, totalGlasses: 0, percentage: 0 } } = useTodaysWaterIntake();
  const { mutateAsync: logWaterIntake } = useLogWaterIntake();
  
  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // Auth
    session,
    isLoading,
    isAuthenticated,
    signIn: async (email: string, password: string) => {
      await signIn.mutateAsync({ email, password });
    },
    signUp: async (email: string, password: string) => {
      await signUp.mutateAsync({ email, password });
    },
    signOut: async () => {
      await signOutAuth.mutateAsync();
    },
    
    // Journal
    journalEntries,
    createJournalEntry: async (content: string, mood?: string) => {
      await createJournalEntry({ content, mood });
    },
    
    // Fitness
    fitnessActivities,
    logFitnessActivity: async (activity: any) => {
      await logFitnessActivity(activity);
    },
    
    // Water
    waterIntake,
    logWaterIntake: async (amountMl: number) => {
      await logWaterIntake(amountMl);
    },
  }), [
    session, 
    isLoading, 
    isAuthenticated, 
    signIn, 
    signUp, 
    signOutAuth, 
    journalEntries, 
    createJournalEntry, 
    fitnessActivities, 
    logFitnessActivity, 
    waterIntake, 
    logWaterIntake
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Re-export hooks for convenience
export { 
  useJournalEntries, 
  useCreateJournalEntry 
} from '../hooks/useJournalEntries';

export { 
  useFitnessActivities, 
  useLogFitnessActivity 
} from '../hooks/useFitnessActivities';

export { 
  useTodaysWaterIntake as useWaterIntake,
  useLogWaterIntake 
} from '../hooks/useWaterIntake';

export function handleApiError(error: unknown, defaultMessage = 'Something went wrong') {
  const message = error instanceof Error ? error.message : defaultMessage;
  
  toast({
    title: 'Error',
    description: message,
    variant: 'destructive',
  });
  
  console.error('API Error:', error);
}
