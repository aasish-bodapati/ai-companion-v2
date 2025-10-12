// Unified Hooks
export {
  useDataFetch,
  useAsyncData,
  useCachedData,
  usePollingData,
  useLazyData
} from '../useDataFetch';

export {
  useUnifiedForm,
  useSimpleForm,
  useRealtimeForm,
  useModalForm
} from '../useUnifiedForm';

// Re-export existing hooks that are already well-designed
export { useActiveRoutine } from '../useActiveRoutine';
export { useWeeklyActivity } from '../useWeeklyActivity';
export { useModalState } from '../useModalState';
export { useFormState } from '../useFormState';
export { useFormValidation } from '../useFormValidation';

// Responsive utilities
export { useResponsive } from '../../utils/responsive';
