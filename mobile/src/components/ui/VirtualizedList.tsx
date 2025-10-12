import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  Dimensions,
  ListRenderItem,
  FlatListProps,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { performanceUtils } from '../../utils/performance';
import { COLORS } from '../../theme/constants';

interface VirtualizedListProps<T> extends Omit<FlatListProps<T>, 'renderItem' | 'data'> {
  data: T[];
  renderItem: ListRenderItem<T>;
  itemHeight: number;
  overscan?: number;
  enableVirtualization?: boolean;
  onScrollToIndex?: (index: number) => void;
  onVisibleRangeChange?: (startIndex: number, endIndex: number) => void;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  testID?: string;
}

interface VirtualizationState {
  visibleStartIndex: number;
  visibleEndIndex: number;
  totalHeight: number;
  offsetY: number;
}

const VirtualizedList = React.memo(function VirtualizedList<T>({
  data,
  renderItem,
  itemHeight,
  overscan = 5,
  enableVirtualization = true,
  onScrollToIndex,
  onVisibleRangeChange,
  loadingComponent,
  emptyComponent,
  errorComponent,
  testID,
  ...props
}: VirtualizedListProps<T>) {
  const [virtualizationState, setVirtualizationState] = useState<VirtualizationState>({
    visibleStartIndex: 0,
    visibleEndIndex: 0,
    totalHeight: 0,
    offsetY: 0,
  });

  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  
  const flatListRef = useRef<FlatList<T>>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollY = useRef(0);

  // Calculate total height
  const totalHeight = useMemo(() => {
    return data.length * itemHeight;
  }, [data.length, itemHeight]);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    if (!enableVirtualization) {
      return { start: 0, end: data.length - 1 };
    }

    const { offsetY } = virtualizationState;
    const screenHeight = Dimensions.get('window').height;
    const startIndex = Math.max(0, Math.floor(offsetY / itemHeight) - overscan);
    const endIndex = Math.min(
      data.length - 1,
      Math.ceil((offsetY + screenHeight) / itemHeight) + overscan
    );

    return { start: startIndex, end: endIndex };
  }, [enableVirtualization, virtualizationState.offsetY, itemHeight, data.length, overscan]);

  // Get visible data
  const visibleData = useMemo(() => {
    if (!enableVirtualization) {
      return data;
    }

    const { start, end } = visibleRange;
    return data.slice(start, end + 1).map((item, index) => ({
      item,
      originalIndex: start + index,
    }));
  }, [data, visibleRange, enableVirtualization]);

  // Calculate item layout
  const getItemLayout = useCallback(
    (data: ArrayLike<T> | null | undefined, index: number) => {
      if (!enableVirtualization) {
        return { length: itemHeight, offset: itemHeight * index, index };
      }

      const { start } = visibleRange;
      const actualIndex = start + index;
      return {
        length: itemHeight,
        offset: itemHeight * actualIndex,
        index: actualIndex,
      };
    },
    [itemHeight, enableVirtualization, visibleRange]
  );

  // Handle scroll events
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset } = event.nativeEvent;
      const currentScrollY = contentOffset.y;
      
      // Determine scroll direction
      if (currentScrollY > lastScrollY.current) {
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY.current) {
        setScrollDirection('up');
      }
      lastScrollY.current = currentScrollY;

      // Update virtualization state
      setVirtualizationState(prev => ({
        ...prev,
        offsetY: currentScrollY,
        visibleStartIndex: visibleRange.start,
        visibleEndIndex: visibleRange.end,
      }));

      // Notify visible range change
      if (onVisibleRangeChange) {
        onVisibleRangeChange(visibleRange.start, visibleRange.end);
      }

      // Handle scroll to index
      if (onScrollToIndex) {
        const currentIndex = Math.floor(currentScrollY / itemHeight);
        onScrollToIndex(currentIndex);
      }
    },
    [visibleRange, onVisibleRangeChange, onScrollToIndex, itemHeight]
  );

  // Handle scroll begin
  const handleScrollBeginDrag = useCallback(() => {
    setIsScrolling(true);
  }, []);

  // Handle scroll end
  const handleScrollEndDrag = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      setScrollDirection(null);
    }, 150);
  }, []);

  // Scroll to specific index
  const scrollToIndex = useCallback(
    (index: number, animated = true) => {
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index,
          animated,
          viewPosition: 0.5,
        });
      }
    },
    []
  );

  // Scroll to offset
  const scrollToOffset = useCallback(
    (offset: number, animated = true) => {
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({
          offset,
          animated,
        });
      }
    },
    []
  );

  // Render item with virtualization
  const renderVirtualizedItem = useCallback<ListRenderItem<T>>(
    ({ item, index }) => {
      if (!enableVirtualization) {
        return renderItem({ item, index });
      }

      const { start } = visibleRange;
      const originalIndex = start + index;
      
      return (
        <View style={{ height: itemHeight }}>
          {renderItem({ item, index: originalIndex })}
        </View>
      );
    },
    [renderItem, itemHeight, enableVirtualization, visibleRange]
  );

  // Key extractor
  const keyExtractor = useCallback(
    (item: T, index: number) => {
      if (typeof item === 'object' && item !== null && 'id' in item) {
        return String((item as Record<string, unknown>).id);
      }
      return `item-${index}`;
    },
    []
  );

  // Performance optimizations
  const performanceProps = useMemo(() => {
    const isLowEnd = performanceUtils.isLowEndDevice();
    
    return {
      removeClippedSubviews: enableVirtualization && isLowEnd,
      maxToRenderPerBatch: enableVirtualization ? overscan * 2 : 10,
      windowSize: enableVirtualization ? overscan * 4 : 10,
      initialNumToRender: enableVirtualization ? overscan : 10,
      updateCellsBatchingPeriod: isLowEnd ? 100 : 50,
      getItemLayout: enableVirtualization ? getItemLayout : undefined,
    };
  }, [enableVirtualization, overscan, getItemLayout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Render loading state
  if (data.length === 0 && loadingComponent) {
    return <View testID={testID}>{loadingComponent}</View>;
  }

  // Render empty state
  if (data.length === 0 && emptyComponent) {
    return <View testID={testID}>{emptyComponent}</View>;
  }

  // Render error state
  if (errorComponent) {
    return <View testID={testID}>{errorComponent}</View>;
  }

  return (
    <FlatList
      ref={flatListRef}
      data={enableVirtualization ? visibleData.map(v => v.item) : data}
      renderItem={renderVirtualizedItem}
      keyExtractor={keyExtractor}
      onScroll={handleScroll}
      onScrollBeginDrag={handleScrollBeginDrag}
      onScrollEndDrag={handleScrollEndDrag}
      scrollEventThrottle={16}
      {...performanceProps}
      {...props}
      testID={testID}
    />
  );
});

// Export utility functions
export const VirtualizedListUtils = {
  /**
   * Calculate optimal item height based on content
   */
  calculateItemHeight: (contentHeight: number, padding: number = 0): number => {
    return contentHeight + padding;
  },

  /**
   * Calculate overscan based on screen size and performance
   */
  calculateOverscan: (itemHeight: number, screenHeight: number = Dimensions.get('window').height): number => {
    const visibleItems = Math.ceil(screenHeight / itemHeight);
    return Math.max(5, Math.floor(visibleItems * 0.5));
  },

  /**
   * Get scroll position for specific index
   */
  getScrollPosition: (index: number, itemHeight: number, containerHeight: number): number => {
    return Math.max(0, index * itemHeight - containerHeight / 2);
  },

  /**
   * Check if item is visible
   */
  isItemVisible: (index: number, startIndex: number, endIndex: number): boolean => {
    return index >= startIndex && index <= endIndex;
  },
};

export default VirtualizedList;
