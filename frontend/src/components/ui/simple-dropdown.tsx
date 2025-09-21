'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';

export interface SimpleDropdownOption {
  value: string;
  label: string;
  description?: string;
}

interface SimpleDropdownProps {
  options: SimpleDropdownOption[];
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (option: SimpleDropdownOption) => void;
  placeholder?: string;
  disabled?: boolean;
  maxSuggestions?: number;
  className?: string;
}

export function SimpleDropdown({
  options,
  value,
  onValueChange,
  onSelect,
  placeholder = "Type to search...",
  disabled = false,
  maxSuggestions = 8,
  className
}: SimpleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on input value
  const filteredOptions = React.useMemo(() => {
    if (!value.trim()) return []
    
    const searchTerm = value.toLowerCase()
    return options
      .filter(option => 
        option.label.toLowerCase().includes(searchTerm) ||
        option.description?.toLowerCase().includes(searchTerm)
      )
      .slice(0, maxSuggestions)
  }, [options, value, maxSuggestions]);

  // Handle option selection
  const handleOptionSelect = (option: SimpleDropdownOption) => {
    console.log('🎯 SimpleDropdown: Option selected:', option);
    onSelect(option);
    onValueChange(option.label);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('📝 SimpleDropdown: Input changed to:', newValue);
    onValueChange(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
    updateDropdownPosition();
    console.log('📝 SimpleDropdown: Dropdown should be open now, filteredOptions:', filteredOptions.length);
  };

  // Calculate dropdown position
  const updateDropdownPosition = React.useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
  }, []);

  // Handle input focus
  const handleInputFocus = () => {
    if (value.trim() && filteredOptions.length > 0) {
      setIsOpen(true);
      updateDropdownPosition();
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

  // Close dropdown when clicking outside - more robust approach
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Simple approach: check if click is inside the dropdown portal
      const isClickOnInput = inputRef.current?.contains(target as Node);
      const isClickOnDropdown = dropdownRef.current?.contains(target as Node);
      
      console.log('🖱️ SimpleDropdown: Click detected', {
        target: target,
        isClickOnInput: !!isClickOnInput,
        isClickOnDropdown: !!isClickOnDropdown,
        targetTagName: target?.tagName,
        targetClassName: target?.className,
        dropdownRefExists: !!dropdownRef.current
      });
      
      // Only close if click is outside both input and dropdown
      if (!isClickOnInput && !isClickOnDropdown) {
        console.log('🖱️ SimpleDropdown: Click outside detected, closing dropdown');
        setIsOpen(false);
        setHighlightedIndex(-1);
      } else {
        console.log('🖱️ SimpleDropdown: Click inside dropdown, keeping open');
      }
    };

    // Add listener with a delay to prevent immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 500);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
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
          ref={dropdownRef}
          data-dropdown="true"
          className="fixed z-[99999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
          }}
          onMouseDown={(e) => {
            // Prevent modal from closing when clicking on dropdown
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ SimpleDropdown: Click on dropdown portal, preventing propagation');
          }}
          onClick={(e) => {
            // Also prevent click propagation
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ SimpleDropdown: Click on dropdown portal, preventing click propagation');
          }}
        >
          {filteredOptions.map((option, index) => (
            <div
              key={option.value}
              data-dropdown-option="true"
              className={cn(
                "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700",
                index === highlightedIndex && "bg-gray-100 dark:bg-gray-700"
              )}
              onMouseDown={(e) => {
                // Handle selection on mousedown for createPortal compatibility
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ SimpleDropdown: MouseDown on option:', option);
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
