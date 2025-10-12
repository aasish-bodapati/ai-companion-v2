import React, { useMemo, useCallback } from 'react';
import { FlatList, View, Text, StyleSheet, ListRenderItem } from 'react-native';
import { usePerformance } from './usePerformance';

interface VirtualizedListProps<T> {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  itemHeight?: number;
  maxToRenderPerBatch?: number;
  windowSize?: number;
  removeClippedSubviews?: boolean;
  getItemLayout?: (data: T[] | null | undefined, index: number) => { length: number; offset: number; index: number };
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  style?: any;
  contentContainerStyle?: any;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  horizontal?: boolean;
  numColumns?: number;
}

export function VirtualizedList<T>({
  data,
  renderItem,
  keyExtractor,
  itemHeight = 50,
  maxToRenderPerBatch = 10,
  windowSize = 10,
  removeClippedSubviews = true,
  getItemLayout,
  onEndReached,
  onEndReachedThreshold = 0.5,
  refreshing = false,
  onRefresh,
  ListEmptyComponent,
  ListHeaderComponent,
  ListFooterComponent,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = true,
  showsHorizontalScrollIndicator = false,
  horizontal = false,
  numColumns = 1,
}: VirtualizedListProps<T>) {
  // Memoize the item layout function for better performance
  const memoizedGetItemLayout = useMemo(() => {
    if (getItemLayout) {
      return getItemLayout;
    }
    
    return (data: T[] | null | undefined, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    });
  }, [getItemLayout, itemHeight]);

  // Memoize the render item function
  const memoizedRenderItem = useCallback(renderItem, [renderItem]);

  // Memoize the key extractor function
  const memoizedKeyExtractor = useCallback(keyExtractor, [keyExtractor]);

  // Performance monitoring
  const { renderCount } = usePerformance.usePerformanceMonitor('VirtualizedList');

  return (
    <FlatList
      data={data}
      renderItem={memoizedRenderItem}
      keyExtractor={memoizedKeyExtractor}
      getItemLayout={memoizedGetItemLayout}
      maxToRenderPerBatch={maxToRenderPerBatch}
      windowSize={windowSize}
      removeClippedSubviews={removeClippedSubviews}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListEmptyComponent={ListEmptyComponent}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      style={style}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      horizontal={horizontal}
      numColumns={numColumns}
      // Performance optimizations
      initialNumToRender={Math.min(10, data.length)}
      updateCellsBatchingPeriod={50}
      disableVirtualization={false}
    />
  );
}

// Specialized components for common use cases
export function VirtualizedRoutineList({ routines, onRoutineSelect, ...props }: any) {
  const renderItem = useCallback(({ item }: { item: any }) => (
    <View style={styles.routineItem}>
      <Text style={styles.routineName}>{item.name}</Text>
      <Text style={styles.routineDescription}>{item.description}</Text>
    </View>
  ), []);

  const keyExtractor = useCallback((item: any) => item.id.toString(), []);

  return (
    <VirtualizedList
      data={routines}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      itemHeight={80}
      {...props}
    />
  );
}

export function VirtualizedMealList({ meals, onMealSelect, ...props }: any) {
  const renderItem = useCallback(({ item }: { item: any }) => (
    <View style={styles.mealItem}>
      <Text style={styles.mealName}>{item.name}</Text>
      <Text style={styles.mealCalories}>{item.calories} cal</Text>
    </View>
  ), []);

  const keyExtractor = useCallback((item: any) => item.id.toString(), []);

  return (
    <VirtualizedList
      data={meals}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      itemHeight={60}
      {...props}
    />
  );
}

export function VirtualizedWorkoutList({ workouts, onWorkoutSelect, ...props }: any) {
  const renderItem = useCallback(({ item }: { item: any }) => (
    <View style={styles.workoutItem}>
      <Text style={styles.workoutName}>{item.name}</Text>
      <Text style={styles.workoutDuration}>{item.duration} min</Text>
    </View>
  ), []);

  const keyExtractor = useCallback((item: any) => item.id.toString(), []);

  return (
    <VirtualizedList
      data={workouts}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      itemHeight={70}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  routineItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  routineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  routineDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  mealItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealName: {
    fontSize: 16,
    color: '#1f2937',
  },
  mealCalories: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  workoutItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutName: {
    fontSize: 16,
    color: '#1f2937',
  },
  workoutDuration: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});

export default VirtualizedList;
