import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  MagnifyingGlassIcon as SearchIcon, 
  FunnelIcon as FilterIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon as EditIcon
} from '@heroicons/react/24/outline';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  paginated?: boolean;
  selectable?: boolean;
  bulkActions?: boolean;
  onSearch?: (query: string) => void;
  onFilter?: (filter: string) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onPageChange?: (page: number) => void;
  onSelect?: (item: T, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  onBulkAction?: (action: string, items: T[]) => void;
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  searchPlaceholder?: string;
  filterOptions?: Array<{ value: string; label: string }>;
  currentPage?: number;
  totalPages?: number;
  selectedItems?: T[];
  className?: string;
  emptyMessage?: string;
  getItemId?: (item: T) => string;
}

export function DataTable<T>({
  data,
  columns,
  loading = false,
  searchable = true,
  filterable = true,
  paginated = true,
  selectable = false,
  bulkActions = false,
  onSearch,
  onFilter,
  onSort,
  onPageChange,
  onSelect,
  onSelectAll,
  onBulkAction,
  onAdd,
  onEdit,
  onDelete,
  searchPlaceholder = 'Search...',
  filterOptions = [],
  currentPage = 1,
  totalPages = 1,
  selectedItems = [],
  className = '',
  emptyMessage = 'No data available',
  getItemId = (item: T) => (item as any).id || (item as any).key
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterValue, setFilterValue] = React.useState('');
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleFilter = (filter: string) => {
    setFilterValue(filter);
    onFilter?.(filter);
  };

  const handleSort = (column: string) => {
    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(newDirection);
    onSort?.(column, newDirection);
  };

  const handleSelectAll = (checked: boolean) => {
    onSelectAll?.(checked);
  };

  const isItemSelected = (item: T) => {
    return selectedItems.some(selected => getItemId(selected) === getItemId(item));
  };

  const allSelected = data.length > 0 && data.every(item => isItemSelected(item));
  const someSelected = selectedItems.length > 0 && !allSelected;

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {/* Header with search and filters */}
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <CardTitle>Data Table</CardTitle>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {searchable && (
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
            )}
            
            {filterable && filterOptions.length > 0 && (
              <Select value={filterValue} onValueChange={handleFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <FilterIcon className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {onAdd && (
              <Button onClick={onAdd} className="w-full sm:w-auto">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add
              </Button>
            )}
          </div>
        </div>

        {/* Bulk actions */}
        {bulkActions && selectedItems.length > 0 && (
          <div className="flex items-center gap-2 pt-4 border-t">
            <Badge variant="outline">
              {selectedItems.length} selected
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAction?.('delete', selectedItems)}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    {selectable && (
                      <th className="text-left p-2">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(input) => {
                            if (input) input.indeterminate = someSelected;
                          }}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded"
                        />
                      </th>
                    )}
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className={`text-left p-2 ${column.sortable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}`}
                        onClick={() => column.sortable && handleSort(column.key)}
                        style={{ width: column.width }}
                      >
                        <div className="flex items-center gap-1">
                          {column.label}
                          {column.sortable && sortColumn === column.key && (
                            <span className="text-xs">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                    {(onEdit || onDelete) && (
                      <th className="text-left p-2">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={getItemId(item)} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      {selectable && (
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={isItemSelected(item)}
                            onChange={(e) => onSelect?.(item, e.target.checked)}
                            className="rounded"
                          />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td key={column.key} className="p-2">
                          {column.render ? column.render(item) : (item as any)[column.key]}
                        </td>
                      ))}
                      {(onEdit || onDelete) && (
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            {onEdit && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit(item)}
                              >
                                <EditIcon className="h-4 w-4" />
                              </Button>
                            )}
                            {onDelete && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDelete(item)}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {paginated && totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange?.(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange?.(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
