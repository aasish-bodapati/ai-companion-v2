import { ProgressBarProps, ProgressBarVariant, ProgressBarSize, ProgressBarShape } from './ProgressBar';
import { COLORS } from '../../theme/constants';

type ProgressBarPreset = Partial<ProgressBarProps> & {
  variant?: ProgressBarVariant;
  size?: ProgressBarSize;
  shape?: ProgressBarShape;
};

export const progressBarConfigs: { [key: string]: ProgressBarPreset } = {
  // Default variants
  default: {
    variant: 'default',
    size: 'medium',
    shape: 'rounded',
    animated: true,
    showPercentage: true,
    showLabel: false,
    showValue: false,
    color: COLORS.primary.main,
    backgroundColor: COLORS.background.secondary,
    textColor: COLORS.text.primary,
  },
  minimal: {
    variant: 'minimal',
    size: 'small',
    shape: 'rounded',
    animated: false,
    showPercentage: false,
    showLabel: false,
    showValue: false,
    color: COLORS.primary.main,
    backgroundColor: 'transparent',
    textColor: COLORS.text.secondary,
  },
  filled: {
    variant: 'filled',
    size: 'medium',
    shape: 'rounded',
    animated: true,
    showPercentage: true,
    showLabel: true,
    showValue: false,
    color: COLORS.primary.main,
    backgroundColor: COLORS.background.tertiary,
    textColor: COLORS.text.primary,
  },
  outlined: {
    variant: 'outlined',
    size: 'medium',
    shape: 'rounded',
    animated: true,
    showPercentage: true,
    showLabel: false,
    showValue: false,
    color: COLORS.primary.main,
    backgroundColor: 'transparent',
    textColor: COLORS.text.primary,
    borderColor: COLORS.border.medium,
  },
  gradient: {
    variant: 'gradient',
    size: 'large',
    shape: 'pill',
    animated: true,
    showPercentage: true,
    showLabel: true,
    showValue: true,
    color: COLORS.primary.main,
    backgroundColor: COLORS.background.secondary,
    textColor: COLORS.text.primary,
  },

  // Size variants
  small: {
    variant: 'default',
    size: 'small',
    shape: 'rounded',
    animated: true,
    showPercentage: false,
    showLabel: false,
    showValue: false,
    color: COLORS.primary.main,
    backgroundColor: COLORS.background.secondary,
    textColor: COLORS.text.primary,
  },
  medium: {
    variant: 'default',
    size: 'medium',
    shape: 'rounded',
    animated: true,
    showPercentage: true,
    showLabel: false,
    showValue: false,
    color: COLORS.primary.main,
    backgroundColor: COLORS.background.secondary,
    textColor: COLORS.text.primary,
  },
  large: {
    variant: 'default',
    size: 'large',
    shape: 'rounded',
    animated: true,
    showPercentage: true,
    showLabel: true,
    showValue: false,
    color: COLORS.primary.main,
    backgroundColor: COLORS.background.secondary,
    textColor: COLORS.text.primary,
  },

  // Shape variants
  rectangular: {
    variant: 'default',
    size: 'medium',
    shape: 'rectangular',
    animated: true,
    showPercentage: true,
    showLabel: false,
    showValue: false,
    color: COLORS.primary.main,
    backgroundColor: COLORS.background.secondary,
    textColor: COLORS.text.primary,
  },
  rounded: {
    variant: 'default',
    size: 'medium',
    shape: 'rounded',
    animated: true,
    showPercentage: true,
    showLabel: false,
    showValue: false,
    color: COLORS.primary.main,
    backgroundColor: COLORS.background.secondary,
    textColor: COLORS.text.primary,
  },
  pill: {
    variant: 'default',
    size: 'medium',
    shape: 'pill',
    animated: true,
    showPercentage: true,
    showLabel: false,
    showValue: false,
    color: COLORS.primary.main,
    backgroundColor: COLORS.background.secondary,
    textColor: COLORS.text.primary,
  },
  circular: {
    variant: 'outlined',
    size: 'large',
    shape: 'circular',
    animated: true,
    showPercentage: true,
    showLabel: false,
    showValue: false,
    color: COLORS.primary.main,
    backgroundColor: 'transparent',
    textColor: COLORS.text.primary,
    borderColor: COLORS.border.medium,
  },

  // Health & Fitness Specific
  fitnessGoal: {
    variant: 'filled',
    size: 'medium',
    shape: 'pill',
    animated: true,
    showPercentage: true,
    showLabel: true,
    showValue: true,
    color: COLORS.primary.main,
    backgroundColor: COLORS.background.tertiary,
    textColor: COLORS.text.primary,
    unit: '%',
  },
  workoutProgress: {
    variant: 'default',
    size: 'medium',
    shape: 'rounded',
    animated: true,
    showPercentage: true,
    showLabel: true,
    showValue: false,
    color: COLORS.accent.blue,
    backgroundColor: COLORS.background.secondary,
    textColor: COLORS.text.primary,
  },
  nutritionGoal: {
    variant: 'filled',
    size: 'large',
    shape: 'pill',
    animated: true,
    showPercentage: true,
    showLabel: true,
    showValue: true,
    color: COLORS.accent.orange,
    backgroundColor: COLORS.background.tertiary,
    textColor: COLORS.text.primary,
    unit: 'g',
  },
  waterIntake: {
    variant: 'gradient',
    size: 'medium',
    shape: 'pill',
    animated: true,
    showPercentage: true,
    showLabel: true,
    showValue: true,
    color: COLORS.accent.blue,
    backgroundColor: COLORS.background.secondary,
    textColor: COLORS.text.primary,
    unit: 'L',
  },
  stepCount: {
    variant: 'outlined',
    size: 'small',
    shape: 'rounded',
    animated: true,
    showPercentage: false,
    showLabel: false,
    showValue: true,
    color: COLORS.accent.green,
    backgroundColor: 'transparent',
    textColor: COLORS.text.primary,
    borderColor: COLORS.accent.green,
    unit: ' steps',
  },
  caloriesBurned: {
    variant: 'filled',
    size: 'medium',
    shape: 'rounded',
    animated: true,
    showPercentage: true,
    showLabel: true,
    showValue: true,
    color: COLORS.accent.orange,
    backgroundColor: COLORS.background.tertiary,
    textColor: COLORS.text.primary,
    unit: ' cal',
  },
  sleepQuality: {
    variant: 'minimal',
    size: 'small',
    shape: 'pill',
    animated: false,
    showPercentage: false,
    showLabel: false,
    showValue: true,
    color: COLORS.accent.purple,
    backgroundColor: 'transparent',
    textColor: COLORS.text.secondary,
    unit: 'h',
  },
  heartRate: {
    variant: 'outlined',
    size: 'medium',
    shape: 'circular',
    animated: true,
    showPercentage: false,
    showLabel: false,
    showValue: true,
    color: COLORS.danger,
    backgroundColor: 'transparent',
    textColor: COLORS.text.primary,
    borderColor: COLORS.danger,
    unit: ' BPM',
  },
  moodScore: {
    variant: 'gradient',
    size: 'large',
    shape: 'pill',
    animated: true,
    showPercentage: true,
    showLabel: true,
    showValue: true,
    color: COLORS.accent.blue,
    backgroundColor: COLORS.background.secondary,
    textColor: COLORS.text.primary,
    unit: '/10',
  },
  weightLoss: {
    variant: 'filled',
    size: 'medium',
    shape: 'rounded',
    animated: true,
    showPercentage: true,
    showLabel: true,
    showValue: true,
    color: COLORS.accent.green,
    backgroundColor: COLORS.background.tertiary,
    textColor: COLORS.text.primary,
    unit: ' kg',
  },
  muscleGain: {
    variant: 'default',
    size: 'medium',
    shape: 'pill',
    animated: true,
    showPercentage: true,
    showLabel: true,
    showValue: true,
    color: COLORS.accent.orange,
    backgroundColor: COLORS.background.secondary,
    textColor: COLORS.text.primary,
    unit: ' kg',
  },
  flexibility: {
    variant: 'minimal',
    size: 'small',
    shape: 'rounded',
    animated: true,
    showPercentage: false,
    showLabel: false,
    showValue: true,
    color: COLORS.accent.cyan,
    backgroundColor: 'transparent',
    textColor: COLORS.text.secondary,
    unit: ' min',
  },
  strength: {
    variant: 'outlined',
    size: 'medium',
    shape: 'rectangular',
    animated: true,
    showPercentage: true,
    showLabel: true,
    showValue: false,
    color: COLORS.primary.main,
    backgroundColor: 'transparent',
    textColor: COLORS.text.primary,
    borderColor: COLORS.primary.main,
  },
  endurance: {
    variant: 'filled',
    size: 'medium',
    shape: 'pill',
    animated: true,
    showPercentage: true,
    showLabel: true,
    showValue: true,
    color: COLORS.accent.red,
    backgroundColor: COLORS.background.tertiary,
    textColor: COLORS.text.primary,
    unit: ' min',
  },
  balance: {
    variant: 'circular',
    size: 'large',
    shape: 'circular',
    animated: true,
    showPercentage: true,
    showLabel: false,
    showValue: false,
    color: COLORS.accent.purple,
    backgroundColor: 'transparent',
    textColor: COLORS.text.primary,
    borderColor: COLORS.accent.purple,
  },
  coordination: {
    variant: 'gradient',
    size: 'medium',
    shape: 'pill',
    animated: true,
    showPercentage: true,
    showLabel: true,
    showValue: true,
    color: COLORS.accent.blue,
    backgroundColor: COLORS.background.secondary,
    textColor: COLORS.text.primary,
    unit: '%',
  },
  recovery: {
    variant: 'minimal',
    size: 'small',
    shape: 'rounded',
    animated: false,
    showPercentage: false,
    showLabel: false,
    showValue: true,
    color: COLORS.accent.green,
    backgroundColor: 'transparent',
    textColor: COLORS.text.secondary,
    unit: '%',
  },
  consistency: {
    variant: 'filled',
    size: 'medium',
    shape: 'rounded',
    animated: true,
    showPercentage: true,
    showLabel: true,
    showValue: false,
    color: COLORS.primary.main,
    backgroundColor: COLORS.background.tertiary,
    textColor: COLORS.text.primary,
  },
  motivation: {
    variant: 'outlined',
    size: 'large',
    shape: 'pill',
    animated: true,
    showPercentage: true,
    showLabel: true,
    showValue: true,
    color: COLORS.accent.orange,
    backgroundColor: 'transparent',
    textColor: COLORS.text.primary,
    borderColor: COLORS.accent.orange,
    unit: '%',
  },
};

// Utility functions for progress bar data manipulation
export const calculateProgress = (current: number, target: number): number => {
  if (target === 0) return 0;
  return Math.min(Math.max((current / target) * 100, 0), 100);
};

export const getProgressColor = (progress: number, thresholds?: { warning: number; danger: number }): string => {
  const defaultThresholds = { warning: 70, danger: 90 };
  const { warning, danger } = thresholds || defaultThresholds;
  
  if (progress >= danger) return COLORS.danger;
  if (progress >= warning) return COLORS.warning;
  return COLORS.success;
};

export const formatProgressValue = (value: number, unit: string = '', decimals: number = 0): string => {
  const formattedValue = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
  return `${formattedValue}${unit}`;
};

export const getProgressBarConfig = (type: keyof typeof progressBarConfigs): ProgressBarPreset => {
  return progressBarConfigs[type] || progressBarConfigs.default;
};

export const createCustomProgressBarConfig = (
  baseConfig: keyof typeof progressBarConfigs,
  overrides: Partial<ProgressBarProps>
): ProgressBarPreset => {
  return {
    ...progressBarConfigs[baseConfig],
    ...overrides,
  };
};

// Health-specific utility functions
export const createFitnessProgressBar = (
  current: number,
  target: number,
  label: string,
  unit: string = ''
): ProgressBarProps => {
  const progress = calculateProgress(current, target);
  const color = getProgressColor(progress);
  
  return {
    ...progressBarConfigs.fitnessGoal,
    progress,
    label,
    valueLabel: formatProgressValue(current, unit),
    color,
  };
};

export const createNutritionProgressBar = (
  current: number,
  target: number,
  label: string,
  unit: string = 'g'
): ProgressBarProps => {
  const progress = calculateProgress(current, target);
  const color = getProgressColor(progress);
  
  return {
    ...progressBarConfigs.nutritionGoal,
    progress,
    label,
    valueLabel: formatProgressValue(current, unit),
    color,
  };
};

export const createWaterIntakeProgressBar = (
  current: number,
  target: number,
  label: string = 'Water Intake'
): ProgressBarProps => {
  const progress = calculateProgress(current, target);
  const color = getProgressColor(progress);
  
  return {
    ...progressBarConfigs.waterIntake,
    progress,
    label,
    valueLabel: formatProgressValue(current, 'L', 1),
    color,
  };
};
