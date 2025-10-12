import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../theme/constants';

export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter';
export type ChartSize = 'small' | 'medium' | 'large';
export type ChartVariant = 'default' | 'minimal' | 'filled' | 'outlined';

export interface ChartDataPoint {
  x: number | string;
  y: number;
  label?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export interface ChartProps {
  // Core props
  data: ChartDataPoint[];
  type: ChartType;

  // Styling
  variant?: ChartVariant;
  size?: ChartSize;
  width?: number;
  height?: number;

  // Configuration
  showGrid?: boolean;
  showLabels?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  animated?: boolean;

  // Colors
  primaryColor?: string;
  secondaryColor?: string;
  gridColor?: string;
  textColor?: string;

  // Labels
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;

  // Callbacks
  onDataPointPress?: (dataPoint: ChartDataPoint, index: number) => void;
  onLegendPress?: (dataPoint: ChartDataPoint, index: number) => void;

  // Styling overrides
  containerStyle?: ViewStyle;
  chartStyle?: ViewStyle;
  titleStyle?: TextStyle;
  labelStyle?: TextStyle;
  legendStyle?: ViewStyle;
  gridStyle?: ViewStyle;

  // Accessibility
  testID?: string;
  accessibilityLabel?: string;
}

const Chart: React.FC<ChartProps> = ({
  data,
  type,
  variant = 'default',
  size = 'medium',
  width,
  height,
  showGrid = true,
  showLabels = true,
  showLegend = false,
  showTooltip = false,
  animated = true,
  primaryColor = COLORS.primary.main,
  secondaryColor = COLORS.accent.blue,
  gridColor = COLORS.border.light,
  textColor = COLORS.text.primary,
  title,
  xAxisLabel,
  yAxisLabel,
  onDataPointPress,
  onLegendPress,
  containerStyle,
  chartStyle,
  titleStyle,
  labelStyle,
  legendStyle,
  gridStyle,
  testID = 'chart',
  accessibilityLabel,
}) => {
  const chartDimensions = useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    const defaultWidth = width || (screenWidth - SPACING.xl * 2);
    const defaultHeight = height || getDefaultHeight(size);

    return {
      width: defaultWidth,
      height: defaultHeight,
    };
  }, [width, height, size]);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Sort data by x value for proper rendering
    return [...data].sort((a, b) => {
      const aVal = typeof a.x === 'string' ? parseFloat(a.x) : a.x;
      const bVal = typeof b.x === 'string' ? parseFloat(b.x) : b.x;
      return aVal - bVal;
    });
  }, [data]);

  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 100;
    return Math.max(...chartData.map(point => point.y));
  }, [chartData]);

  const minValue = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.min(...chartData.map(point => point.y));
  }, [chartData]);

  const valueRange = maxValue - minValue;

  const getDataPointPosition = (point: ChartDataPoint, index: number) => {
    const x = (index / (chartData.length - 1)) * (chartDimensions.width - 40);
    const y = chartDimensions.height - 40 -
      ((point.y - minValue) / valueRange) * (chartDimensions.height - 80);
    return { x, y };
  };

  const renderDataPoint = (point: ChartDataPoint, index: number) => {
    const position = getDataPointPosition(point, index);
    const pointColor = point.color || primaryColor;

    return (
      <View
        key={`point-${index}`}
        style={[
          styles.dataPoint,
          {
            left: position.x - 4,
            top: position.y - 4,
            backgroundColor: pointColor,
          },
        ]}
        testID={`${testID}-data-point-${index}`}
        accessibilityLabel={point.label || `Data point ${index + 1}`}
        accessibilityRole="button"
        onTouchEnd={() => onDataPointPress?.(point, index)}
      />
    );
  };

  const renderLine = () => {
    if (chartData.length < 2) return null;

    const pathData = chartData.map((point, index) => {
      const position = getDataPointPosition(point, index);
      return `${index === 0 ? 'M' : 'L'} ${position.x} ${position.y}`;
    }).join(' ');

    return (
      <View style={styles.lineContainer}>
        <View style={[styles.line, { borderColor: primaryColor }]} />
      </View>
    );
  };

  const renderBar = (point: ChartDataPoint, index: number) => {
    const position = getDataPointPosition(point, index);
    const barHeight = chartDimensions.height - 40 - position.y;
    const barWidth = Math.max(8, (chartDimensions.width - 40) / chartData.length - 4);

    return (
      <View
        key={`bar-${index}`}
        style={[
          styles.bar,
          {
            left: position.x - barWidth / 2,
            top: position.y,
            width: barWidth,
            height: barHeight,
            backgroundColor: point.color || primaryColor,
          },
        ]}
        testID={`${testID}-bar-${index}`}
        accessibilityLabel={point.label || `Bar ${index + 1}`}
        accessibilityRole="button"
        onTouchEnd={() => onDataPointPress?.(point, index)}
      />
    );
  };

  const renderPie = () => {
    if (chartData.length === 0) return null;

    const total = chartData.reduce((sum, point) => sum + point.y, 0);
    let currentAngle = 0;

    return chartData.map((point, index) => {
      const percentage = point.y / total;
      const angle = percentage * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      currentAngle += angle;

      return (
        <View
          key={`pie-${index}`}
          style={[
            styles.pieSlice,
            {
              backgroundColor: point.color || primaryColor,
              transform: [{ rotate: `${startAngle}deg` }],
            },
          ]}
          testID={`${testID}-pie-slice-${index}`}
          accessibilityLabel={point.label || `Pie slice ${index + 1}`}
          accessibilityRole="button"
          onTouchEnd={() => onDataPointPress?.(point, index)}
        />
      );
    });
  };

  const renderGrid = () => {
    if (!showGrid) return null;

    const gridLines = 5;
    const stepY = (chartDimensions.height - 80) / gridLines;

    return (
      <View style={[styles.grid, gridStyle]}>
        {Array.from({ length: gridLines + 1 }, (_, i) => (
          <View
            key={`grid-line-${i}`}
            style={[
              styles.gridLine,
              {
                top: i * stepY + 20,
                borderColor: gridColor,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderLabels = () => {
    if (!showLabels) return null;

    return (
      <View style={styles.labelsContainer}>
        {chartData.map((point, index) => {
          const position = getDataPointPosition(point, index);
          return (
            <Text
              key={`label-${index}`}
              style={[
                styles.label,
                {
                  left: position.x - 20,
                  top: position.y + 10,
                  color: textColor,
                },
                labelStyle,
              ]}
              numberOfLines={1}
            >
              {point.label || point.y.toString()}
            </Text>
          );
        })}
      </View>
    );
  };

  const renderLegend = () => {
    if (!showLegend) return null;

    return (
      <View style={[styles.legend, legendStyle]}>
        {chartData.map((point, index) => (
          <View
            key={`legend-${index}`}
            style={styles.legendItem}
            testID={`${testID}-legend-item-${index}`}
            accessibilityRole="button"
            onTouchEnd={() => onLegendPress?.(point, index)}
          >
            <View
              style={[
                styles.legendColor,
                { backgroundColor: point.color || primaryColor },
              ]}
            />
            <Text style={[styles.legendText, { color: textColor }]}>
              {point.label || `Item ${index + 1}`}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <View style={[styles.chartContainer, chartStyle]}>
            {renderGrid()}
            {renderLine()}
            {chartData.map(renderDataPoint)}
            {renderLabels()}
          </View>
        );
      case 'bar':
        return (
          <View style={[styles.chartContainer, chartStyle]}>
            {renderGrid()}
            {chartData.map(renderBar)}
            {renderLabels()}
          </View>
        );
      case 'pie':
        return (
          <View style={[styles.chartContainer, styles.pieContainer, chartStyle]}>
            {renderPie()}
            {renderLabels()}
          </View>
        );
      case 'area':
        return (
          <View style={[styles.chartContainer, chartStyle]}>
            {renderGrid()}
            {renderLine()}
            {chartData.map(renderDataPoint)}
            {renderLabels()}
          </View>
        );
      case 'scatter':
        return (
          <View style={[styles.chartContainer, chartStyle]}>
            {renderGrid()}
            {chartData.map(renderDataPoint)}
            {renderLabels()}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View
      style={[
        styles.container,
        styles[`container_${variant}`],
        styles[`container_${size}`],
        containerStyle,
      ]}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    >
      {title && (
        <Text style={[styles.title, { color: textColor }, titleStyle]}>
          {title}
        </Text>
      )}

      <View style={[styles.chartWrapper, { ...chartDimensions }]}>
        {renderChart()}
      </View>

      {showLegend && renderLegend()}

      {(xAxisLabel || yAxisLabel) && (
        <View style={styles.axisLabels}>
          {xAxisLabel && (
            <Text style={[styles.axisLabel, { color: textColor }]}>
              {xAxisLabel}
            </Text>
          )}
          {yAxisLabel && (
            <Text style={[styles.axisLabel, { color: textColor }]}>
              {yAxisLabel}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const getDefaultHeight = (size: ChartSize): number => {
  switch (size) {
    case 'small': return 150;
    case 'medium': return 200;
    case 'large': return 250;
    default: return 200;
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  container_default: {
    borderWidth: 1,
    borderColor: COLORS.border.medium,
  },
  container_minimal: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  container_filled: {
    backgroundColor: COLORS.background.secondary,
    borderWidth: 0,
  },
  container_outlined: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.border.medium,
  },
  container_small: {
    padding: SPACING.sm,
  },
  container_medium: {
    padding: SPACING.md,
  },
  container_large: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  chartWrapper: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  chartContainer: {
    flex: 1,
    position: 'relative',
  },
  pieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 1,
    borderTopWidth: 1,
  },
  lineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  line: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 2,
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bar: {
    position: 'absolute',
    borderRadius: BORDER_RADIUS.xs,
  },
  pieSlice: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  labelsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  label: {
    position: 'absolute',
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
    textAlign: 'center',
    width: 40,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.sm,
    marginVertical: SPACING.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.xs,
  },
  legendText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  axisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  axisLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
});

export default Chart;
