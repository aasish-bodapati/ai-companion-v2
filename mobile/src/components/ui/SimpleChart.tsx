import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COMMON_STYLES } from '../../theme/constants';

const { width } = Dimensions.get('window');

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface SimpleChartProps {
  data: ChartDataPoint[];
  title?: string;
  type?: 'bar' | 'line' | 'donut';
  maxValue?: number;
  showValues?: boolean;
  height?: number;
}

export default function SimpleChart({
  data,
  title,
  type = 'bar',
  maxValue,
  showValues = true,
  height = 200,
}: SimpleChartProps) {
  const max = maxValue || Math.max(...data.map(d => d.value));
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const renderBarChart = () => {
    return (
      <View style={[styles.chartContainer, { height }]}>
        <View style={styles.barContainer}>
          {data.map((item, index) => {
            const percentage = (item.value / max) * 100;
            const color = item.color || colors[index % colors.length];
            
            return (
              <View key={index} style={styles.barItem}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${percentage}%`,
                        backgroundColor: color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel} numberOfLines={1}>
                  {item.label}
                </Text>
                {showValues && (
                  <Text style={styles.barValue}>{item.value}</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderLineChart = () => {
    const chartWidth = width - 80;
    const chartHeight = height - 60;
    const pointSpacing = chartWidth / (data.length - 1);

    return (
      <View style={[styles.chartContainer, { height }]}>
        <View style={[styles.lineContainer, { width: chartWidth, height: chartHeight }]}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percent, index) => (
            <View
              key={index}
              style={[
                styles.gridLine,
                {
                  top: (percent / 100) * chartHeight,
                  opacity: 0.2,
                },
              ]}
            />
          ))}
          
          {/* Data points and lines */}
          {data.map((item, index) => {
            const x = index * pointSpacing;
            const y = chartHeight - (item.value / max) * chartHeight;
            const color = item.color || colors[index % colors.length];
            
            return (
              <View key={index}>
                {/* Line to next point */}
                {index < data.length - 1 && (
                  <View
                    style={[
                      styles.line,
                      {
                        left: x,
                        top: y,
                        width: pointSpacing,
                        height: 2,
                        backgroundColor: color,
                        transform: [
                          {
                            rotate: `${Math.atan2(
                              (chartHeight - ((data[index + 1].value / max) * chartHeight)) - y,
                              pointSpacing
                            )}rad`,
                          },
                        ],
                      },
                    ]}
                  />
                )}
                
                {/* Data point */}
                <View
                  style={[
                    styles.dataPoint,
                    {
                      left: x - 6,
                      top: y - 6,
                      backgroundColor: color,
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>
        
        {/* Labels */}
        <View style={styles.lineLabels}>
          {data.map((item, index) => (
            <Text key={index} style={styles.lineLabel} numberOfLines={1}>
              {item.label}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  const renderDonutChart = () => {
    const radius = 150;
    const strokeWidth = 40;
    const circumference = 2 * Math.PI * radius;
    
    // Check if all values are zero
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    const isEmpty = totalValue === 0;

    return (
      <View style={[styles.chartContainer, { height }]}>
        <View style={styles.donutContainer}>
          <View style={styles.donutChart}>
            {!isEmpty ? (
              <>
                {data.map((item, index) => {
                  const percentage = (item.value / max) * 100;
                  const color = item.color || colors[index % colors.length];
                  
                  return (
                    <View
                      key={index}
                      style={[
                        styles.donutSegment,
                        {
                          width: radius * 2 + strokeWidth,
                          height: radius * 2 + strokeWidth,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.donutArc,
                          {
                            width: radius * 2,
                            height: radius * 2,
                            borderRadius: radius,
                            borderWidth: strokeWidth,
                            borderColor: color,
                            transform: [{ rotate: `${-90 + (index * 360 / data.length)}deg` }],
                          },
                        ]}
                      />
                    </View>
                  );
                })}
                
                {/* Center text */}
                <View style={styles.donutCenter}>
                  <Text style={styles.donutCenterText}>{totalValue}</Text>
                  <Text style={styles.donutCenterLabel}>Total</Text>
                </View>
              </>
            ) : (
              /* Empty state */
              <View style={styles.donutCenter}>
                <View style={[styles.donutEmptyRing, {
                  width: radius * 2,
                  height: radius * 2,
                  borderRadius: radius,
                  borderWidth: strokeWidth,
                  borderColor: '#e5e7eb',
                }]} />
                <View style={styles.donutCenter}>
                  <Text style={styles.donutCenterText}>0</Text>
                  <Text style={styles.donutCenterLabel}>No Data</Text>
                </View>
              </View>
            )}
          </View>
          
          {/* Legend */}
          <View style={styles.legend}>
            {data.map((item, index) => {
              const color = item.color || colors[index % colors.length];
              return (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: color }]} />
                  <Text style={styles.legendLabel}>{item.label}</Text>
                  <Text style={styles.legendValue}>{item.value}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return renderLineChart();
      case 'donut':
        return renderDonutChart();
      default:
        return renderBarChart();
    }
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      {renderChart()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 20,
  },
  chartContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Bar Chart Styles
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '100%',
    paddingHorizontal: 8,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  barWrapper: {
    height: '85%',
    justifyContent: 'flex-end',
    width: '100%',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  barValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 2,
  },
  // Line Chart Styles
  lineContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  line: {
    position: 'absolute',
  },
  dataPoint: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: COMMON_STYLES.smallRadius,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  lineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  lineLabel: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    flex: 1,
  },
  // Donut Chart Styles
  donutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  donutChart: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  donutSegment: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutArc: {
    position: 'absolute',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  donutCenterLabel: {
    fontSize: 18,
    color: '#6b7280',
  },
  donutEmptyRing: {
    position: 'absolute',
  },
  legend: {
    marginLeft: 20,
    flex: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
    fontWeight: '500',
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
});
