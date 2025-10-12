// Utility functions and presets for DataTable component

import { DataTableSize, DataTableVariant, DataTableColumn, SortDirection } from './DataTable';

export const dataTablePresets = {
  // Small data tables
  small: {
    size: 'small' as DataTableSize,
    variant: 'default' as DataTableVariant,
    pagination: false,
    selectable: false,
    sortable: true,
  },

  // Medium data tables
  medium: {
    size: 'medium' as DataTableSize,
    variant: 'default' as DataTableVariant,
    pagination: true,
    selectable: false,
    sortable: true,
  },

  // Large data tables
  large: {
    size: 'large' as DataTableSize,
    variant: 'default' as DataTableVariant,
    pagination: true,
    selectable: true,
    sortable: true,
  },

  // Minimal data tables
  minimal: {
    size: 'medium' as DataTableSize,
    variant: 'minimal' as DataTableVariant,
    pagination: false,
    selectable: false,
    sortable: false,
  },

  // Bordered data tables
  bordered: {
    size: 'medium' as DataTableSize,
    variant: 'bordered' as DataTableVariant,
    pagination: true,
    selectable: false,
    sortable: true,
  },

  // Striped data tables
  striped: {
    size: 'medium' as DataTableSize,
    variant: 'striped' as DataTableVariant,
    pagination: true,
    selectable: false,
    sortable: true,
  },
};

// Common data table configurations
export const dataTableConfigs = {
  // Exercise logs
  exerciseLogs: {
    ...dataTablePresets.medium,
    selectable: true,
    sortable: true,
    pagination: true,
  },

  // Workout history
  workoutHistory: {
    ...dataTablePresets.large,
    selectable: true,
    sortable: true,
    pagination: true,
  },

  // Nutrition logs
  nutritionLogs: {
    ...dataTablePresets.medium,
    selectable: false,
    sortable: true,
    pagination: true,
  },

  // User list
  userList: {
    ...dataTablePresets.large,
    selectable: true,
    sortable: true,
    pagination: true,
  },

  // Settings list
  settingsList: {
    ...dataTablePresets.minimal,
    selectable: false,
    sortable: false,
    pagination: false,
  },

  // Statistics table
  statisticsTable: {
    ...dataTablePresets.bordered,
    selectable: false,
    sortable: true,
    pagination: false,
  },

  // Quick reference
  quickReference: {
    ...dataTablePresets.small,
    selectable: false,
    sortable: false,
    pagination: false,
  },

  // Data export
  dataExport: {
    ...dataTablePresets.large,
    selectable: true,
    sortable: true,
    pagination: true,
  },

  // Mobile optimized
  mobileOptimized: {
    ...dataTablePresets.medium,
    selectable: false,
    sortable: true,
    pagination: true,
  },
};

// Helper function to get data table configuration
export const getDataTableConfig = (type: keyof typeof dataTableConfigs) => {
  return dataTableConfigs[type];
};

// Helper function to create custom data table configuration
export const createDataTableConfig = (
  baseType: keyof typeof dataTablePresets,
  overrides: Partial<typeof dataTablePresets[keyof typeof dataTablePresets]> = {}
) => {
  return {
    ...dataTablePresets[baseType],
    ...overrides,
  };
};

// Data table utilities
export const dataTableUtils = {
  // Get appropriate size based on context
  getSizeForContext: (context: 'mobile' | 'tablet' | 'desktop' | 'modal' | 'card') => {
    const sizeMap: Record<string, DataTableSize> = {
      'mobile': 'small',
      'tablet': 'medium',
      'desktop': 'large',
      'modal': 'small',
      'card': 'small',
    };

    return sizeMap[context] || 'medium';
  },

  // Get appropriate variant based on design system
  getVariantForDesign: (design: 'minimal' | 'material' | 'ios' | 'custom') => {
    const variantMap: Record<string, DataTableVariant> = {
      'minimal': 'minimal',
      'material': 'bordered',
      'ios': 'default',
      'custom': 'striped',
    };

    return variantMap[design] || 'default';
  },

  // Create columns from data
  createColumnsFromData: <T>(
    data: T[],
    excludeKeys: string[] = []
  ): DataTableColumn<T>[] => {
    if (data.length === 0) return [];

    const sample = data[0];
    const keys = Object.keys(sample as object);
    
    return keys
      .filter(key => !excludeKeys.includes(key))
      .map(key => ({
        key,
        title: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        dataIndex: key,
        sortable: true,
        filterable: true,
      }));
  },

  // Create columns with custom configuration
  createColumns: <T>(
    config: Array<{
      key: string;
      title: string;
      dataIndex: string;
      width?: number | string;
      align?: 'left' | 'center' | 'right';
      sortable?: boolean;
      filterable?: boolean;
      render?: (value: any, record: T, index: number) => React.ReactNode;
    }>
  ): DataTableColumn<T>[] => {
    return config.map(col => ({
      key: col.key,
      title: col.title,
      dataIndex: col.dataIndex,
      width: col.width,
      align: col.align || 'left',
      sortable: col.sortable !== false,
      filterable: col.filterable !== false,
      render: col.render,
    }));
  },

  // Sort data by column
  sortData: <T>(
    data: T[],
    column: DataTableColumn<T>,
    direction: SortDirection
  ): T[] => {
    if (direction === 'none' || !column.sortable) return data;

    return [...data].sort((a, b) => {
      const aValue = (a as any)[column.dataIndex];
      const bValue = (b as any)[column.dataIndex];

      if (column.sorter) {
        return column.sorter(a, b);
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return direction === 'asc' 
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      return 0;
    });
  },

  // Filter data by multiple criteria
  filterData: <T>(
    data: T[],
    filters: Record<string, any>
  ): T[] => {
    if (Object.keys(filters).length === 0) return data;

    return data.filter(record => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === null || value === undefined || value === '') return true;
        
        const recordValue = (record as any)[key];
        
        if (typeof recordValue === 'string' && typeof value === 'string') {
          return recordValue.toLowerCase().includes(value.toLowerCase());
        }
        
        return recordValue === value;
      });
    });
  },

  // Paginate data
  paginateData: <T>(
    data: T[],
    currentPage: number,
    pageSize: number
  ): T[] => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  },

  // Get total pages
  getTotalPages: (totalItems: number, pageSize: number): number => {
    return Math.ceil(totalItems / pageSize);
  },

  // Validate data table props
  validateDataTableProps: (props: any) => {
    const errors: string[] = [];

    if (!props.data || !Array.isArray(props.data)) {
      errors.push('Data must be an array');
    }

    if (!props.columns || !Array.isArray(props.columns)) {
      errors.push('Columns must be an array');
    }

    if (props.columns && props.columns.length === 0) {
      errors.push('At least one column is required');
    }

    if (props.currentPage && props.currentPage < 1) {
      errors.push('Current page must be greater than 0');
    }

    if (props.pageSize && props.pageSize < 1) {
      errors.push('Page size must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // Export data to CSV
  exportToCSV: <T>(
    data: T[],
    columns: DataTableColumn<T>[],
    filename: string = 'data.csv'
  ): string => {
    const headers = columns.map(col => col.title).join(',');
    const rows = data.map(record => 
      columns.map(col => {
        const value = (record as any)[col.dataIndex];
        return `"${value?.toString().replace(/"/g, '""') || ''}"`;
      }).join(',')
    );

    const csvContent = [headers, ...rows].join('\n');
    
    // In a real implementation, you would trigger a download here
    return csvContent;
  },

  // Get column statistics
  getColumnStatistics: <T>(
    data: T[],
    column: DataTableColumn<T>
  ) => {
    const values = data.map(record => (record as any)[column.dataIndex]);
    
    if (values.length === 0) {
      return { count: 0, unique: 0, null: 0 };
    }

    const unique = new Set(values).size;
    const nullCount = values.filter(v => v === null || v === undefined).length;

    return {
      count: values.length,
      unique,
      null: nullCount,
      hasDuplicates: unique < values.length,
    };
  },
};

// Common column configurations
export const commonColumns = {
  // ID column
  id: <T>(): DataTableColumn<T> => ({
    key: 'id',
    title: 'ID',
    dataIndex: 'id',
    width: 60,
    align: 'center',
    sortable: true,
    filterable: true,
  }),

  // Name column
  name: <T>(): DataTableColumn<T> => ({
    key: 'name',
    title: 'Name',
    dataIndex: 'name',
    sortable: true,
    filterable: true,
  }),

  // Date column
  date: <T>(): DataTableColumn<T> => ({
    key: 'date',
    title: 'Date',
    dataIndex: 'date',
    width: 100,
    align: 'center',
    sortable: true,
    filterable: true,
    render: (value: any) => {
      if (!value) return '';
      const date = new Date(value);
      return date.toLocaleDateString();
    },
  }),

  // Status column
  status: <T>(): DataTableColumn<T> => ({
    key: 'status',
    title: 'Status',
    dataIndex: 'status',
    width: 80,
    align: 'center',
    sortable: true,
    filterable: true,
    render: (value: any) => {
      // Return a simple text representation for now
      // The actual JSX rendering should be done in the component using this column
      return value?.toString().toUpperCase() || '';
    },
  }),

  // Actions column
  actions: <T>(onEdit?: (record: T) => void, onDelete?: (record: T) => void): DataTableColumn<T> => ({
    key: 'actions',
    title: 'Actions',
    dataIndex: 'actions',
    width: 100,
    align: 'center',
    sortable: false,
    filterable: false,
    render: (value: any, record: T) => {
      // Return a simple text representation for now
      // The actual JSX rendering should be done in the component using this column
      return 'Actions';
    },
  }),
};

// Data table animations
export const dataTableAnimations = {
  // Row selection animation
  select: {
    scale: 0.98,
    duration: 150,
  },

  // Row press animation
  press: {
    scale: 0.95,
    duration: 100,
  },

  // Sort animation
  sort: {
    opacity: 0.7,
    duration: 200,
  },

  // Pagination animation
  pagination: {
    opacity: 0.8,
    duration: 150,
  },
};

// Data table colors
export const dataTableColors = {
  primary: '#6366f1',
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  muted: '#9ca3af',
  disabled: '#d1d5db',
};
