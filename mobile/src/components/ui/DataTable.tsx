import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
  TextStyle,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../../theme/constants';

export type DataTableSize = 'small' | 'medium' | 'large';
export type DataTableVariant = 'default' | 'minimal' | 'bordered' | 'striped';
export type SortDirection = 'asc' | 'desc' | 'none';
export type Alignment = 'left' | 'center' | 'right';

export interface DataTableColumn<T = any> {
  key: string;
  title: string;
  dataIndex: string;
  width?: number | string;
  align?: Alignment;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sorter?: (a: T, b: T) => number;
  filterOptions?: Array<{ label: string; value: any }>;
}

export interface DataTableProps<T = any> {
  // Core props
  data: T[];
  columns: DataTableColumn<T>[];
  
  // Configuration
  size?: DataTableSize;
  variant?: DataTableVariant;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  
  // Selection
  selectable?: boolean;
  selectedRowKeys?: string[];
  onSelectionChange?: (selectedKeys: string[], selectedRows: T[]) => void;
  rowKey?: string | ((record: T) => string);
  
  // Sorting
  sortable?: boolean;
  defaultSortKey?: string;
  defaultSortDirection?: SortDirection;
  onSortChange?: (key: string, direction: SortDirection) => void;
  
  // Filtering
  filterable?: boolean;
  onFilterChange?: (filters: Record<string, any>) => void;
  
  // Pagination
  pagination?: boolean;
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  
  // Styling
  containerStyle?: ViewStyle;
  headerStyle?: ViewStyle;
  rowStyle?: ViewStyle;
  cellStyle?: ViewStyle;
  headerCellStyle?: ViewStyle;
  
  // Behavior
  onRowPress?: (record: T, index: number) => void;
  onRowLongPress?: (record: T, index: number) => void;
  
  // Accessibility
  accessibilityLabel?: string;
  testID?: string;
}

export default function DataTable<T = any>({
  data,
  columns,
  size = 'medium',
  variant = 'default',
  loading = false,
  refreshing = false,
  onRefresh,
  selectable = false,
  selectedRowKeys = [],
  onSelectionChange,
  rowKey = 'id',
  sortable = true,
  defaultSortKey,
  defaultSortDirection = 'none',
  onSortChange,
  filterable = false,
  onFilterChange,
  pagination = false,
  pageSize = 10,
  currentPage = 1,
  onPageChange,
  containerStyle,
  headerStyle,
  rowStyle,
  cellStyle,
  headerCellStyle,
  onRowPress,
  onRowLongPress,
  accessibilityLabel,
  testID,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey || null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Get row key
  const getRowKey = useCallback((record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return (record as any)[rowKey] || index.toString();
  }, [rowKey]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey || sortDirection === 'none') return data;

    const column = columns.find(col => col.key === sortKey);
    if (!column || !column.sortable) return data;

    const sorted = [...data].sort((a, b) => {
      const aValue = (a as any)[column.dataIndex];
      const bValue = (b as any)[column.dataIndex];
      
      if (column.sorter) {
        return column.sorter(a, b);
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    return sorted;
  }, [data, sortKey, sortDirection, columns]);

  // Filter data
  const filteredData = useMemo(() => {
    if (Object.keys(filters).length === 0) return sortedData;

    return sortedData.filter(record => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === null || value === undefined || value === '') return true;
        const recordValue = (record as any)[key];
        return recordValue === value || 
               (typeof recordValue === 'string' && recordValue.toLowerCase().includes(value.toLowerCase()));
      });
    });
  }, [sortedData, filters]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, pagination, currentPage, pageSize]);

  // Handle sort
  const handleSort = useCallback((key: string) => {
    const column = columns.find(col => col.key === key);
    if (!column || !column.sortable) return;

    let newDirection: SortDirection = 'asc';
    
    if (sortKey === key) {
      if (sortDirection === 'asc') newDirection = 'desc';
      else if (sortDirection === 'desc') newDirection = 'none';
    }

    setSortKey(newDirection === 'none' ? null : key);
    setSortDirection(newDirection);
    onSortChange?.(key, newDirection);
  }, [sortKey, sortDirection, columns, onSortChange]);

  // Handle selection
  const handleRowSelection = useCallback((record: T, index: number) => {
    if (!selectable) return;

    const key = getRowKey(record, index);
    const isSelected = selectedRowKeys.includes(key);
    
    let newSelectedKeys: string[];
    if (isSelected) {
      newSelectedKeys = selectedRowKeys.filter(k => k !== key);
    } else {
      newSelectedKeys = [...selectedRowKeys, key];
    }

    const newSelectedRows = data.filter((_, i) => newSelectedKeys.includes(getRowKey(_, i)));
    onSelectionChange?.(newSelectedKeys, newSelectedRows);
  }, [selectable, selectedRowKeys, data, getRowKey, onSelectionChange]);

  // Handle row press
  const handleRowPress = useCallback((record: T, index: number) => {
    if (selectable) {
      handleRowSelection(record, index);
    }
    onRowPress?.(record, index);
  }, [selectable, handleRowSelection, onRowPress]);

  // Render cell content
  const renderCellContent = useCallback((column: DataTableColumn<T>, record: T, index: number) => {
    const value = (record as any)[column.dataIndex];
    
    if (column.render) {
      return column.render(value, record, index);
    }
    
    return (
      <Text style={[styles.cellText, getCellTextStyle()]}>
        {value?.toString() || ''}
      </Text>
    );
  }, []);

  // Get styles based on size and variant
  const getContainerStyles = (): ViewStyle[] => {
    const baseStyles = [styles.container];
    
    switch (size) {
      case 'small':
        baseStyles.push(styles.containerSmall);
        break;
      case 'medium':
        baseStyles.push(styles.containerMedium);
        break;
      case 'large':
        baseStyles.push(styles.containerLarge);
        break;
    }
    
    switch (variant) {
      case 'minimal':
        baseStyles.push(styles.containerMinimal);
        break;
      case 'bordered':
        baseStyles.push(styles.containerBordered);
        break;
      case 'striped':
        baseStyles.push(styles.containerStriped);
        break;
      default:
        baseStyles.push(styles.containerDefault);
        break;
    }
    
    if (containerStyle) baseStyles.push(containerStyle);
    return baseStyles;
  };

  const getHeaderStyles = (): ViewStyle[] => {
    const baseStyles = [styles.header];
    if (headerStyle) baseStyles.push(headerStyle);
    return baseStyles;
  };

  const getRowStyles = (index: number, isSelected: boolean): ViewStyle[] => {
    const baseStyles = [styles.row];
    
    if (variant === 'striped' && index % 2 === 1) {
      baseStyles.push(styles.rowStriped);
    }
    
    if (isSelected) {
      baseStyles.push(styles.rowSelected);
    }
    
    if (rowStyle) baseStyles.push(rowStyle);
    return baseStyles;
  };

  const getCellStyles = (column: DataTableColumn<T>): ViewStyle[] => {
    const baseStyles = [styles.cell];
    
    if (column.width) {
      baseStyles.push({ width: column.width });
    }
    
    if (column.align) {
      baseStyles.push(styles[`cellAlign_${column.align}`]);
    }
    
    if (cellStyle) baseStyles.push(cellStyle);
    return baseStyles;
  };

  const getHeaderCellStyles = (column: DataTableColumn<T>): ViewStyle[] => {
    const baseStyles = [styles.headerCell];
    
    if (column.width) {
      baseStyles.push({ width: column.width });
    }
    
    if (column.align) {
      baseStyles.push(styles[`cellAlign_${column.align}`]);
    }
    
    if (headerCellStyle) baseStyles.push(headerCellStyle);
    return baseStyles;
  };

  const getCellTextStyle = (): TextStyle => {
    switch (size) {
      case 'small':
        return styles.cellTextSmall;
      case 'medium':
        return styles.cellTextMedium;
      case 'large':
        return styles.cellTextLarge;
      default:
        return styles.cellTextMedium;
    }
  };

  const getSortIcon = (column: DataTableColumn<T>) => {
    if (!column.sortable) return null;
    
    if (sortKey !== column.key) {
      return <Ionicons name="swap-vertical" size={16} color={COLORS.text.disabled} />;
    }
    
    if (sortDirection === 'asc') {
      return <Ionicons name="chevron-up" size={16} color={COLORS.primary.main} />;
    }
    
    if (sortDirection === 'desc') {
      return <Ionicons name="chevron-down" size={16} color={COLORS.primary.main} />;
    }
    
    return <Ionicons name="swap-vertical" size={16} color={COLORS.text.disabled} />;
  };

  const isRowSelected = (record: T, index: number): boolean => {
    if (!selectable) return false;
    const key = getRowKey(record, index);
    return selectedRowKeys.includes(key);
  };

  return (
    <View style={getContainerStyles()} testID={testID}>
      {/* Header */}
      <View style={getHeaderStyles()}>
        {columns.map((column) => (
          <TouchableOpacity
            key={column.key}
            style={getHeaderCellStyles(column)}
            onPress={() => handleSort(column.key)}
            disabled={!column.sortable}
            accessibilityLabel={`Sort by ${column.title}`}
            accessibilityHint={column.sortable ? 'Tap to sort' : 'Not sortable'}
          >
            <Text style={[styles.headerText, getCellTextStyle()]}>
              {column.title}
            </Text>
            {getSortIcon(column)}
          </TouchableOpacity>
        ))}
      </View>

      {/* Body */}
      <ScrollView
        style={styles.body}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary.main]}
              tintColor={COLORS.primary.main}
            />
          ) : undefined
        }
        accessibilityLabel={accessibilityLabel}
      >
        {paginatedData.map((record, index) => {
          const isSelected = isRowSelected(record, index);
          
          return (
            <TouchableOpacity
              key={getRowKey(record, index)}
              style={getRowStyles(index, isSelected)}
              onPress={() => handleRowPress(record, index)}
              onLongPress={() => onRowLongPress?.(record, index)}
              accessibilityLabel={`Row ${index + 1}`}
              accessibilityState={{ selected: isSelected }}
              testID={`${testID}-row-${index}`}
            >
              {columns.map((column) => (
                <View
                  key={column.key}
                  style={getCellStyles(column)}
                >
                  {renderCellContent(column, record, index)}
                </View>
              ))}
              
              {selectable && (
                <View style={styles.selectionIndicator}>
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={isSelected ? COLORS.primary.main : COLORS.text.disabled}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  containerDefault: {
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  containerMinimal: {
    borderWidth: 0,
  },
  containerBordered: {
    borderWidth: 2,
    borderColor: COLORS.border.primary,
  },
  containerStriped: {
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  containerSmall: {
    minHeight: 200,
  },
  containerMedium: {
    minHeight: 300,
  },
  containerLarge: {
    minHeight: 400,
  },
  header: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  headerCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
    minHeight: 44,
  },
  headerText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text.primary,
    flex: 1,
  },
  body: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
    minHeight: 44,
  },
  rowStriped: {
    backgroundColor: COLORS.background.secondary,
  },
  rowSelected: {
    backgroundColor: COLORS.primary.light,
  },
  cell: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    justifyContent: 'center',
  },
  cellAlign_left: {
    alignItems: 'flex-start',
  },
  cellAlign_center: {
    alignItems: 'center',
  },
  cellAlign_right: {
    alignItems: 'flex-end',
  },
  cellText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.primary,
  },
  cellTextSmall: {
    fontSize: FONT_SIZE.xs,
  },
  cellTextMedium: {
    fontSize: FONT_SIZE.sm,
  },
  cellTextLarge: {
    fontSize: FONT_SIZE.md,
  },
  selectionIndicator: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
});
