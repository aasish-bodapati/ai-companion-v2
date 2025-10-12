import { useState, useEffect, useCallback } from 'react';

import { BodyTypeScoringService, ScoringResult, DailyLog, WeeklyLog } from '../services/BodyTypeScoringService';
import { BodyTypeGoal, UserAttributes } from '../services/BodyTypeGoalsService';

interface UseBodyTypeScoringProps {
  bodyTypeGoal: BodyTypeGoal | null;
  userAttributes: UserAttributes | null;
  dailyLog?: DailyLog;
  weeklyLog?: WeeklyLog;
}

interface UseBodyTypeScoringReturn {
  dailyResult: ScoringResult | null;
  weeklyResult: ScoringResult | null;
  loading: boolean;
  error: string | null;
  refreshScores: () => void;
  isReady: boolean;
}

export function useBodyTypeScoring({
  bodyTypeGoal,
  userAttributes,
  dailyLog,
  weeklyLog,
}: UseBodyTypeScoringProps): UseBodyTypeScoringReturn {
  const [scoringService, setScoringService] = useState<BodyTypeScoringService | null>(null);
  const [dailyResult, setDailyResult] = useState<ScoringResult | null>(null);
  const [weeklyResult, setWeeklyResult] = useState<ScoringResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize scoring service when body type goal and user attributes are available
  useEffect(() => {
    if (bodyTypeGoal && userAttributes) {
      setScoringService(new BodyTypeScoringService(bodyTypeGoal, userAttributes));
      setError(null);
    } else {
      setScoringService(null);
      setDailyResult(null);
      setWeeklyResult(null);
    }
  }, [bodyTypeGoal, userAttributes]);

  // Calculate scores when service or logs change
  useEffect(() => {
    if (scoringService) {
      calculateScores();
    }
  }, [scoringService, dailyLog, weeklyLog, calculateScores]);

  const calculateScores = useCallback(async () => {
    if (!scoringService) return;

    setLoading(true);
    setError(null);

    try {
      // Calculate daily score
      if (dailyLog) {
        const daily = scoringService.scoreDailyProgress(dailyLog);
        setDailyResult(daily);
      } else {
        setDailyResult(null);
      }

      // Calculate weekly score
      if (weeklyLog) {
        const weekly = scoringService.scoreWeeklyProgress(weeklyLog);
        setWeeklyResult(weekly);
      } else {
        setWeeklyResult(null);
      }
    } catch {
      setError('Failed to calculate scores');
      setDailyResult(null);
      setWeeklyResult(null);
    } finally {
      setLoading(false);
    }
  }, [scoringService, dailyLog, weeklyLog]);

  const refreshScores = useCallback(() => {
    if (scoringService) {
      calculateScores();
    }
  }, [scoringService, calculateScores]);

  const isReady = !!(bodyTypeGoal && userAttributes && scoringService);

  return {
    dailyResult,
    weeklyResult,
    loading,
    error,
    refreshScores,
    isReady,
  };
}

export default useBodyTypeScoring;