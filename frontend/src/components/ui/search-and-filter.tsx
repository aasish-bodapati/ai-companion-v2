import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  MagnifyingGlassIcon as SearchIcon, 
  FunnelIcon as FilterIcon, 
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

export interface FilterOption {
  value: string;
  label: string;
}

export interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  filters?: Array<{
    key: string;
    label: string;
    value: string;
    options: FilterOption[];
    onValueChange: (value: string) => void;
  }>;
  onClearFilters?: () => void;
  onAdd?: () => void;
  addLabel?: string;
  className?: string;
  showClearButton?: boolean;
}

export function SearchAndFilter({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  onClearFilters,
  onAdd,
  addLabel = 'Add',
  className = '',
  showClearButton = true
}: SearchAndFilterProps) {
  const hasActiveFilters = filters.some(filter => filter.value !== '' && filter.value !== 'all');

  return (
    <div className={`flex flex-col sm:flex-row gap-4 items-start sm:items-center ${className}`}>
      {/* Search Input */}
      <div className="relative flex-1">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 w-full sm:w-64"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Select key={filter.key} value={filter.value} onValueChange={filter.onValueChange}>
            <SelectTrigger className="w-full sm:w-48">
              <FilterIcon className="h-4 w-4 mr-2" />
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {filter.label}</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {/* Clear Filters Button */}
        {showClearButton && hasActiveFilters && onClearFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="flex items-center gap-1"
          >
            <XMarkIcon className="h-4 w-4" />
            Clear
          </Button>
        )}

        {/* Add Button */}
        {onAdd && (
          <Button onClick={onAdd} className="flex items-center gap-1">
            <PlusIcon className="h-4 w-4" />
            {addLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
