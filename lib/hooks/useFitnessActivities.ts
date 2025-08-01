import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fitnessApi } from '@/lib/api';

export function useFitnessActivities() {
  return useQuery({
    queryKey: ['fitnessActivities'],
    queryFn: async () => {
      const { data, error } = await fitnessApi.getActivities();
      if (error) throw new Error(error);
      return data?.activities || [];
    },
  });
}

export function useLogFitnessActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (activity: {
      activity_type: string;
      duration: number;
      calories?: number;
      notes?: string;
    }) => {
      const { data, error } = await fitnessApi.logActivity(activity);
      if (error) throw new Error(error);
      return data?.activity;
    },
    onSuccess: () => {
      // Invalidate and refetch fitness activities after successful logging
      queryClient.invalidateQueries({ queryKey: ['fitnessActivities'] });
    },
  });
}

export function useTodaysActivities() {
  return useQuery({
    queryKey: ['todaysActivities'],
    queryFn: async () => {
      const { data, error } = await fitnessApi.getActivities();
      if (error) throw new Error(error);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return (data?.activities || []).filter((activity: any) => {
        const activityDate = new Date(activity.date);
        return activityDate >= today;
      });
    },
  });
}
