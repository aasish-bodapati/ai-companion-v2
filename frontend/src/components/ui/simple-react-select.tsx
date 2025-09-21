'use client';

import React from 'react';
import Select from 'react-select';
import { cn } from '@/lib/utils';

export interface SimpleReactSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SimpleReactSelectProps {
  options: SimpleReactSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (option: SimpleReactSelectOption) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SimpleReactSelect({
  options,
  value,
  onValueChange,
  onSelect,
  placeholder = "Type to search...",
  disabled = false,
  className
}: SimpleReactSelectProps) {
  // Convert to react-select format
  const selectOptions = options.map(option => ({
    value: option.value,
    label: option.label,
    description: option.description
  }));

  // Find current value
  const currentOption = selectOptions.find(option => option.value === value) || null;

  const handleChange = (newValue: any) => {
    if (newValue) {
      console.log('🎯 SimpleReactSelect: Option selected:', newValue);
      onSelect({
        value: newValue.value,
        label: newValue.label,
        description: newValue.description
      });
      onValueChange(newValue.label);
    }
  };

  const handleInputChange = (inputValue: string) => {
    console.log('📝 SimpleReactSelect: Input changed to:', inputValue);
    onValueChange(inputValue);
  };

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: '40px',
      borderColor: state.isFocused ? '#6366f1' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 1px #6366f1' : 'none',
      backgroundColor: 'white',
      '&:hover': {
        borderColor: '#6366f1'
      }
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: '#6b7280', // Better contrast for placeholder
    }),
    input: (provided: any) => ({
      ...provided,
      color: '#111827', // Dark text for input
    }),
    menu: (provided: any) => ({
      ...provided,
      zIndex: 999999, // Much higher z-index
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      borderRadius: '8px',
      position: 'fixed' // Force fixed positioning
    }),
    menuPortal: (provided: any) => ({
      ...provided,
      zIndex: 999999 // Much higher z-index
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? '#6366f1' 
        : state.isFocused 
          ? '#f3f4f6' 
          : 'white',
      color: state.isSelected ? 'white' : '#111827', // Dark text for better contrast
      padding: '12px 16px',
      cursor: 'pointer',
      borderBottom: '1px solid #f3f4f6',
      '&:hover': {
        backgroundColor: state.isSelected ? '#6366f1' : '#f3f4f6'
      },
      '&:last-child': {
        borderBottom: 'none'
      }
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: '#111827' // Dark text for selected value
    })
  };

  return (
    <div className={cn("w-full", className)}>
      <Select
        options={selectOptions}
        value={currentOption}
        onChange={handleChange}
        onInputChange={handleInputChange}
        placeholder={placeholder}
        isDisabled={disabled}
        isSearchable={true}
        isClearable={false}
        menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
        styles={customStyles}
        formatOptionLabel={(option) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">{option.label}</span>
            {option.description && (
              <span className="text-xs text-gray-600 mt-1">{option.description}</span>
            )}
          </div>
        )}
        className="react-select-container"
        classNamePrefix="react-select"
        inputValue={value}
        filterOption={(option, inputValue) => {
          return option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
                 option.data.description?.toLowerCase().includes(inputValue.toLowerCase());
        }}
      />
    </div>
  );
}
