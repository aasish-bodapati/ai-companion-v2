'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

export interface SearchableDropdownOption {
  value: string;
  label: string;
  description?: string;
}

interface SearchableDropdownProps {
  options: SearchableDropdownOption[];
  value?: string;
  onChange: (option: SearchableDropdownOption | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = "Type to search...",
  disabled = false,
  className
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  console.log('🔧 SearchableDropdown: Rendering with', { 
    optionsCount: options.length, 
    value, 
    disabled,
    searchTerm,
    isOpen
  });

  // Find selected option
  const selectedOption = options.find(option => option.value === value) || null;

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    
    const term = searchTerm.toLowerCase();
    return options.filter(option => 
      option.label.toLowerCase().includes(term) ||
      option.description?.toLowerCase().includes(term)
    );
  }, [options, searchTerm]);

  console.log('🔍 SearchableDropdown: Filtered options:', filteredOptions.length);

  // Handle option selection
  const handleSelect = (option: SearchableDropdownOption) => {
    console.log('🎯 SearchableDropdown: Option selected:', option);
    onChange(option);
    setSearchTerm(''); // Clear search term so input shows empty
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('📝 SearchableDropdown: Input changed to:', newValue);
    console.log('📝 SearchableDropdown: Options available:', options.length);
    setSearchTerm(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
    
    // If user starts typing and there's a selected option, clear it
    if (newValue && selectedOption) {
      console.log('🔄 SearchableDropdown: User typing, clearing selected option');
      onChange(null);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    console.log('🎯 SearchableDropdown: Input focused');
    setIsOpen(true);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        console.log('🖱️ SearchableDropdown: Click outside, closing');
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Display value - show selected option when not typing, show search term when typing
  const displayValue = searchTerm || (selectedOption ? selectedOption.label : '');

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          autoComplete="off"
        />
        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-[999999] w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-xl max-h-60 overflow-auto"
        >
          {filteredOptions.map((option, index) => (
            <div
              key={option.value}
              className={cn(
                "flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                index === highlightedIndex && "bg-gray-100 dark:bg-gray-800",
                selectedOption?.value === option.value && "bg-indigo-50 dark:bg-indigo-900/50"
              )}
              onClick={() => handleSelect(option)}
            >
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{option.label}</span>
                {option.description && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{option.description}</span>
                )}
              </div>
              {selectedOption?.value === option.value && (
                <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              )}
            </div>
          ))}
        </div>
      )}

      {isOpen && filteredOptions.length === 0 && searchTerm && (
        <div className="absolute z-[999999] w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-xl p-4">
          <p className="text-sm text-gray-500 dark:text-gray-300">No exercises found for "{searchTerm}"</p>
        </div>
      )}
      
    </div>
  );
}
