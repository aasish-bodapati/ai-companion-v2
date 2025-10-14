/**
 * Central Hooks Exports - CONSOLIDATED ARCHITECTURE
 * 
 * This file consolidates all hook exports to prevent complexity.
 * 
 * CONSOLIDATED HOOKS (15+ → 3):
 * - useData: Data fetching, caching, polling, progress tracking
 * - useForm: Form state, validation, modals, search
 * - useUI: Responsive design, loading, auth, onboarding, health logging
 */

// ===== CONSOLIDATED HOOKS (3 CORE HOOKS) =====

// 1. Data Hook (Data fetching + Caching + Polling + Progress tracking)
export {
  useData,
  useProgressMetrics,
  useWeeklyActivity,
  useStepsTracking,
  useTodaysWorkout,
  useActiveRoutine,
  useWeather,
  useBodyTypeMetrics,
  useLazyData,
  usePollingData
} from './ConsolidatedDataHook';

// 2. Form Hook (Form state + Validation + Modals + Search)
export {
  useForm,
  useModal,
  useSearch,
  useLoggingModal,
  useSimpleForm,
  useRealtimeForm
} from './ConsolidatedFormHook';

// 3. UI Hook (Responsive + Loading + Auth + Onboarding + Health logging)
export {
  useResponsive,
  useLoadingState,
  useAuth,
  useAuthActions,
  useOnboarding,
  useHealthLogger,
  usePlatform,
  useOrientation,
  useSafeArea,
  useKeyboard,
  useToast,
  useHaptic,
  useTheme
} from './ConsolidatedUIHook';

// ===== LEGACY EXPORTS (for backward compatibility during migration) =====
// TODO: Remove these after updating all imports

// Legacy hooks (deprecated - use unified versions)
export { useLoadingState as legacyUseLoadingState } from './useLoadingState';

// Legacy unified hooks
export * from './unified';
