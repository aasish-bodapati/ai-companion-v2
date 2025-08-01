import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { waterApi } from '@/lib/api';

export function useWaterIntake() {
  return useQuery({
    queryKey: ['waterIntake'],
    queryFn: async () => {
      const { data, error } = await waterApi.getIntake();
      if (error) throw new Error(error);
      return data?.entries || [];
    },
  });
}

export function useLogWaterIntake() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (amountMl: number) => {
      const { data, error } = await waterApi.logIntake(amountMl);
      if (error) throw new Error(error);
      return data?.entry;
    },
    onSuccess: () => {
      // Invalidate and refetch water intake data after successful logging
      queryClient.invalidateQueries({ queryKey: ['waterIntake'] });
      queryClient.invalidateQueries({ queryKey: ['todaysWaterIntake'] });
    },
  });
}

export function useTodaysWaterIntake() {
  return useQuery({
    queryKey: ['todaysWaterIntake'],
    queryFn: async () => {
      const { data, error } = await waterApi.getIntake();
      if (error) throw new Error(error);
      
      // Calculate total water intake for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaysEntries = (data?.entries || []).filter((entry: any) => {
        const entryDate = new Date(entry.timestamp);
        return entryDate >= today;
      });
      
      const totalMl = todaysEntries.reduce(
        (sum: number, entry: any) => sum + (entry.amount_ml || 0), 
        0
      );
      
      return {
        entries: todaysEntries,
        totalMl,
        totalGlasses: Math.round(totalMl / 250), // Assuming 250ml per glass
        percentage: Math.min(100, Math.round((totalMl / 2000) * 100)), // 2L daily goal
      };
    },
  });
}
