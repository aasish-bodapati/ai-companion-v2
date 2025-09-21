'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';

export interface SimpleAutocompleteOption {
  value: string;
  label: string;
  description?: string;
}

interface SimpleAutocompleteProps {
  options: SimpleAutocompleteOption[];
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (option: SimpleAutocompleteOption) => void;
  placeholder?: string;
  disabled?: boolean;
  maxSuggestions?: number;
  className?: string;
}

export function SimpleAutocomplete({
  options,
  value,
  onValueChange,
  onSelect,
  placeholder = "Type to search...",
  disabled = false,
  maxSuggestions = 8,
  className
}: SimpleAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter options based on input value
  const filteredOptions = React.useMemo(() => {
    console.log('🔍 SimpleAutocomplete: Filtering options for value:', value);
    
    if (!value.trim()) {
      console.log('🔍 SimpleAutocomplete: No value, returning empty array');
      return []
    }
    
    const searchTerm = value.toLowerCase()
    const filtered = options
      .filter(option => 
        option.label.toLowerCase().includes(searchTerm) ||
        option.description?.toLowerCase().includes(searchTerm)
      )
      .slice(0, maxSuggestions)
    
    console.log('🔍 SimpleAutocomplete: Filtered options:', filtered.length, filtered);
    return filtered
  }, [options, value, maxSuggestions]);

  // Calculate dropdown position
  const updateDropdownPosition = React.useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      console.log('📍 SimpleAutocomplete: Calculating position', {
        rect: rect,
        scrollY: window.scrollY,
        scrollX: window.scrollX
      });
      setDropdownPosition({
        top: rect.bottom + 4, // Remove window.scrollY for fixed positioning
        left: rect.left, // Remove window.scrollX for fixed positioning
        width: rect.width
      });
    }
  }, []);

  // Handle option selection
  const handleOptionSelect = (option: SimpleAutocompleteOption) => {
    console.log('🎯 SimpleAutocomplete: handleOptionSelect called with:', option);
    onSelect(option);
    onValueChange(option.label);
    setIsOpen(false);
    setHighlightedIndex(-1);
    // Focus back to input to prevent blur issues
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('📝 SimpleAutocomplete: Input changed to:', newValue);
    onValueChange(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  // Handle input focus
  const handleInputFocus = () => {
    console.log('🎯 SimpleAutocomplete: Input focused');
    if (value.trim() && filteredOptions.length > 0) {
      setIsOpen(true);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredOptions.length === 0) return;

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
          handleOptionSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Update position when dropdown opens
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
    }
  }, [isOpen, updateDropdownPosition]);

  // Only close dropdown when option is selected - no blur detection

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          autoComplete="off"
        />
        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>
      
      {isOpen && filteredOptions.length > 0 && typeof window !== 'undefined' && createPortal(
        <div
          ref={listRef}
          className="fixed z-[99999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
          }}
          onMouseDown={(e) => {
            // Prevent the modal from closing when clicking on dropdown
            e.stopPropagation();
          }}
        >
          {filteredOptions.map((option, index) => (
            <div
              key={option.value}
              data-autocomplete-option
              className={cn(
                "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700",
                index === highlightedIndex && "bg-gray-100 dark:bg-gray-700"
              )}
              onMouseDown={(e) => {
                console.log('🖱️ SimpleAutocomplete: MouseDown on option:', option);
                e.preventDefault();
                e.stopPropagation();
                // Handle selection on mousedown for createPortal compatibility
                handleOptionSelect(option);
              }}
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{option.label}</span>
                {option.description && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {option.description}
                  </span>
                )}
              </div>
              <Check className="h-4 w-4 text-gray-400" />
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
