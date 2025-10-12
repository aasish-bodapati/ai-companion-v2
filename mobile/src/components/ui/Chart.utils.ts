import { ChartProps, ChartDataPoint, ChartType, ChartSize, ChartVariant } from './Chart';
import { COLORS } from '../../theme/constants';

type ChartPreset = Partial<ChartProps> & {
  type: ChartType;
  variant?: ChartVariant;
  size?: ChartSize;
};

export const chartConfigs: { [key: string]: ChartPreset } = {
  // Line Charts
  lineChart: {
    type: 'line',
    variant: 'default',
    size: 'medium',
    showGrid: true,
    showLabels: true,
    showLegend: false,
    animated: true,
    primaryColor: COLORS.primary.main,
    secondaryColor: COLORS.accent.blue,
  },
  lineChartMinimal: {
    type: 'line',
    variant: 'minimal',
    size: 'small',
    showGrid: false,
    showLabels: false,
    showLegend: false,
    animated: false,
    primaryColor: COLORS.primary.main,
  },
  lineChartFilled: {
    type: 'line',
    variant: 'filled',
    size: 'large',
    showGrid: true,
    showLabels: true,
    showLegend: true,
    animated: true,
    primaryColor: COLORS.primary.main,
    secondaryColor: COLORS.accent.blue,
  },

  // Bar Charts
  barChart: {
    type: 'bar',
    variant: 'default',
    size: 'medium',
    showGrid: true,
    showLabels: true,
    showLegend: false,
    animated: true,
    primaryColor: COLORS.primary.main,
    secondaryColor: COLORS.accent.blue,
  },
  barChartMinimal: {
    type: 'bar',
    variant: 'minimal',
    size: 'small',
    showGrid: false,
    showLabels: false,
    showLegend: false,
    animated: false,
    primaryColor: COLORS.primary.main,
  },
  barChartFilled: {
    type: 'bar',
    variant: 'filled',
    size: 'large',
    showGrid: true,
    showLabels: true,
    showLegend: true,
    animated: true,
    primaryColor: COLORS.primary.main,
    secondaryColor: COLORS.accent.blue,
  },

  // Pie Charts
  pieChart: {
    type: 'pie',
    variant: 'default',
    size: 'medium',
    showGrid: false,
    showLabels: true,
    showLegend: true,
    animated: true,
    primaryColor: COLORS.primary.main,
    secondaryColor: COLORS.accent.blue,
  },
  pieChartMinimal: {
    type: 'pie',
    variant: 'minimal',
    size: 'small',
    showGrid: false,
    showLabels: false,
    showLegend: false,
    animated: false,
    primaryColor: COLORS.primary.main,
  },
  pieChartFilled: {
    type: 'pie',
    variant: 'filled',
    size: 'large',
    showGrid: false,
    showLabels: true,
    showLegend: true,
    animated: true,
    primaryColor: COLORS.primary.main,
    secondaryColor: COLORS.accent.blue,
  },

  // Area Charts
  areaChart: {
    type: 'area',
    variant: 'default',
    size: 'medium',
    showGrid: true,
    showLabels: true,
    showLegend: false,
    animated: true,
    primaryColor: COLORS.primary.main,
    secondaryColor: COLORS.accent.blue,
  },
  areaChartMinimal: {
    type: 'area',
    variant: 'minimal',
    size: 'small',
    showGrid: false,
    showLabels: false,
    showLegend: false,
    animated: false,
    primaryColor: COLORS.primary.main,
  },

  // Scatter Charts
  scatterChart: {
    type: 'scatter',
    variant: 'default',
    size: 'medium',
    showGrid: true,
    showLabels: true,
    showLegend: false,
    animated: true,
    primaryColor: COLORS.primary.main,
    secondaryColor: COLORS.accent.blue,
  },
  scatterChartMinimal: {
    type: 'scatter',
    variant: 'minimal',
    size: 'small',
    showGrid: false,
    showLabels: false,
    showLegend: false,
    animated: false,
    primaryColor: COLORS.primary.main,
  },

  // Health & Fitness Specific
  fitnessProgress: {
    type: 'line',
    variant: 'filled',
    size: 'medium',
    showGrid: true,
    showLabels: true,
    showLegend: false,
    animated: true,
    primaryColor: COLORS.primary.main,
    secondaryColor: COLORS.accent.orange,
    title: 'Fitness Progress',
    xAxisLabel: 'Time',
    yAxisLabel: 'Progress',
  },
  workoutVolume: {
    type: 'bar',
    variant: 'default',
    size: 'medium',
    showGrid: true,
    showLabels: true,
    showLegend: false,
    animated: true,
    primaryColor: COLORS.accent.blue,
    secondaryColor: COLORS.accent.green,
    title: 'Workout Volume',
    xAxisLabel: 'Week',
    yAxisLabel: 'Volume',
  },
  nutritionBreakdown: {
    type: 'pie',
    variant: 'filled',
    size: 'large',
    showGrid: false,
    showLabels: true,
    showLegend: true,
    animated: true,
    primaryColor: COLORS.primary.main,
    secondaryColor: COLORS.accent.orange,
    title: 'Nutrition Breakdown',
  },
  weightTracking: {
    type: 'line',
    variant: 'outlined',
    size: 'medium',
    showGrid: true,
    showLabels: true,
    showLegend: false,
    animated: true,
    primaryColor: COLORS.primary.main,
    secondaryColor: COLORS.accent.blue,
    title: 'Weight Tracking',
    xAxisLabel: 'Date',
    yAxisLabel: 'Weight (kg)',
  },
  caloriesBurned: {
    type: 'area',
    variant: 'filled',
    size: 'medium',
    showGrid: true,
    showLabels: true,
    showLegend: false,
    animated: true,
    primaryColor: COLORS.accent.orange,
    secondaryColor: COLORS.accent.red,
    title: 'Calories Burned',
    xAxisLabel: 'Time',
    yAxisLabel: 'Calories',
  },
  exerciseDistribution: {
    type: 'bar',
    variant: 'minimal',
    size: 'small',
    showGrid: false,
    showLabels: false,
    showLegend: false,
    animated: false,
    primaryColor: COLORS.primary.main,
    secondaryColor: COLORS.accent.blue,
  },
  moodTracking: {
    type: 'scatter',
    variant: 'default',
    size: 'medium',
    showGrid: true,
    showLabels: true,
    showLegend: false,
    animated: true,
    primaryColor: COLORS.accent.blue,
    secondaryColor: COLORS.accent.green,
    title: 'Mood Tracking',
    xAxisLabel: 'Date',
    yAxisLabel: 'Mood (1-10)',
  },
  waterIntake: {
    type: 'bar',
    variant: 'filled',
    size: 'small',
    showGrid: false,
    showLabels: true,
    showLegend: false,
    animated: true,
    primaryColor: COLORS.accent.blue,
    secondaryColor: COLORS.accent.cyan,
    title: 'Water Intake',
    xAxisLabel: 'Day',
    yAxisLabel: 'Liters',
  },
  sleepPattern: {
    type: 'area',
    variant: 'minimal',
    size: 'medium',
    showGrid: true,
    showLabels: true,
    showLegend: false,
    animated: true,
    primaryColor: COLORS.accent.purple,
    secondaryColor: COLORS.accent.blue,
    title: 'Sleep Pattern',
    xAxisLabel: 'Time',
    yAxisLabel: 'Hours',
  },
  heartRate: {
    type: 'line',
    variant: 'outlined',
    size: 'medium',
    showGrid: true,
    showLabels: true,
    showLegend: false,
    animated: true,
    primaryColor: COLORS.danger,
    secondaryColor: COLORS.accent.red,
    title: 'Heart Rate',
    xAxisLabel: 'Time',
    yAxisLabel: 'BPM',
  },
};

// Utility functions for chart data manipulation
export const createChartData = (
  data: Array<{ x: number | string; y: number; label?: string; color?: string }>
): ChartDataPoint[] => {
  return data.map((item, index) => ({
    x: item.x,
    y: item.y,
    label: item.label || `Point ${index + 1}`,
    color: item.color,
    metadata: {},
  }));
};

export const generateTimeSeriesData = (
  startDate: Date,
  days: number,
  generator: (date: Date, index: number) => number,
  labelGenerator?: (date: Date, index: number) => string
): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    data.push({
      x: date.toISOString().split('T')[0], // YYYY-MM-DD format
      y: generator(date, i),
      label: labelGenerator ? labelGenerator(date, i) : date.toLocaleDateString(),
      metadata: { date: date.toISOString() },
    });
  }
  
  return data;
};

export const generateWeeklyData = (
  weekStart: Date,
  generator: (day: number) => number,
  dayLabels?: string[]
): ChartDataPoint[] => {
  const defaultLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const labels = dayLabels || defaultLabels;
  
  return Array.from({ length: 7 }, (_, i) => ({
    x: labels[i],
    y: generator(i),
    label: `${labels[i]}: ${generator(i)}`,
    metadata: { day: i },
  }));
};

export const generateMonthlyData = (
  monthStart: Date,
  generator: (day: number) => number
): ChartDataPoint[] => {
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  
  return Array.from({ length: daysInMonth }, (_, i) => ({
    x: i + 1,
    y: generator(i),
    label: `Day ${i + 1}: ${generator(i)}`,
    metadata: { day: i + 1 },
  }));
};

export const getChartConfig = (type: keyof typeof chartConfigs): ChartPreset => {
  return chartConfigs[type] || chartConfigs.lineChart;
};

export const createCustomChartConfig = (
  baseConfig: keyof typeof chartConfigs,
  overrides: Partial<ChartProps>
): ChartPreset => {
  return {
    ...chartConfigs[baseConfig],
    ...overrides,
  };
};
