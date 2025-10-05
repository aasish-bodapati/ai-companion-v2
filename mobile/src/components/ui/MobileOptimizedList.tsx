import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  ListRenderItem,
  FlatListProps,
} from 'react-native';
import { performanceUtils, componentOptimization } from '../../utils/performance';
import { UnifiedLoadingState } from './UnifiedLoadingState';

interface MobileOptimizedListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  data: T[];
  renderItem: ListRenderItem<T>;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  emptyMessage?: string;
  emptyIcon?: string;
  error?: string;
  onRetry?: () => void;
  itemHeight?: number;
  estimatedItemSize?: number;
  enableVirtualization?: boolean;
  hapticFeedback?: boolean;
  testID?: string;
}

export default function MobileOptimizedList<T>({
  data,
  renderItem,
  loading = false,
  refreshing = false,
  onRefresh,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
  emptyMessage = 'No items found',
  emptyIcon = 'list-outline',
  error,
  onRetry,
  itemHeight,
  estimatedItemSize,
  enableVirtualization = true,
  hapticFeedback = true,
  testID,
  ...props
}: MobileOptimizedListProps<T>) {
  // Optimize render item with memoization
  const optimizedRenderItem = useCallback<ListRenderItem<T>>(
    (itemInfo) => {
      const { item, index } = itemInfo;
      
      // Only render if item is visible (basic optimization)
      if (enableVirtualization && !componentOptimization.optimizeListItem(item, index, data)) {
        return null;
      }

      return renderItem(itemInfo);
    },
    [renderItem, data, enableVirtualization]
  );

  // Optimize key extractor
  const keyExtractor = useCallback(
    (item: T, index: number) => {
      if (typeof item === 'object' && item !== null && 'id' in item) {
        return String((item as any).id);
      }
      return `item-${index}`;
    },
    []
  );

  // Optimize get item layout if item height is provided
  const getItemLayout = useMemo(() => {
    if (itemHeight) {
      return (data: ArrayLike<T> | null | undefined, index: number) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      });
    }
    return undefined;
  }, [itemHeight]);

  // Handle end reached with debouncing
  const handleEndReached = useCallback(() => {
    if (hasMore && !loadingMore && onLoadMore) {
      performanceUtils.runAfterInteractions(() => {
        onLoadMore();
      });
    }
  }, [hasMore, loadingMore, onLoadMore]);

  // Handle refresh with haptic feedback
  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      if (hapticFeedback) {
        // Import haptic feedback here to avoid circular dependency
        import('../../utils/haptics').then(({ hapticFeedback: hf }) => {
          hf.light();
        });
      }
      onRefresh();
    }
  }, [onRefresh, hapticFeedback]);

  // Render loading state
  const renderLoadingState = () => (
    <UnifiedLoadingState
      message="Loading items..."
      variant="default"
      size="medium"
      animated={true}
    />
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>{emptyMessage}</Text>
      {onRetry && (
        <Text style={styles.emptySubtext}>
          Pull down to refresh or tap to retry
        </Text>
      )}
    </View>
  );

  // Render error state
  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorText}>{error}</Text>
      {onRetry && (
        <Text style={styles.retryText}>
          Pull down to refresh or tap to retry
        </Text>
      )}
    </View>
  );

  // Render footer with load more indicator
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color="#3b82f6" />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  };

  // Get optimized props based on device performance
  const optimizedProps = useMemo(() => {
    const isLowEnd = performanceUtils.isLowEndDevice();
    
    return {
      // Performance optimizations
      removeClippedSubviews: isLowEnd,
      maxToRenderPerBatch: performanceUtils.list.getBatchSize(),
      windowSize: performanceUtils.list.getWindowSize(),
      initialNumToRender: isLowEnd ? 5 : 10,
      updateCellsBatchingPeriod: isLowEnd ? 100 : 50,
      
      // Memory optimizations
      getItemLayout: getItemLayout,
      keyExtractor,
      
      // Interaction optimizations
      onEndReached: handleEndReached,
      onEndReachedThreshold: 0.5,
      onRefresh: handleRefresh,
      refreshing: refreshing,
      
      // Accessibility
      testID,
      
      // Visual optimizations
      showsVerticalScrollIndicator: !isLowEnd,
      showsHorizontalScrollIndicator: false,
    };
  }, [getItemLayout, keyExtractor, handleEndReached, handleRefresh, refreshing, testID]);

  // Show loading state
  if (loading) {
    return renderLoadingState();
  }

  // Show error state
  if (error) {
    return renderErrorState();
  }

  return (
    <FlatList
      data={data}
      renderItem={optimizedRenderItem}
      ListEmptyComponent={renderEmptyState}
      ListFooterComponent={renderFooter}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        ) : undefined
      }
      {...optimizedProps}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  retryText: {
    fontSize: 14,
    color: '#3b82f6',
    textAlign: 'center',
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
});
