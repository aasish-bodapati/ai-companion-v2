'use client';

import React from 'react';
import Select, { SingleValue, ActionMeta } from 'react-select';
import { cn } from '@/lib/utils';

export interface IndustrySelectOption {
  value: string;
  label: string;
  description?: string;
}

interface IndustrySelectProps {
  options: IndustrySelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (option: IndustrySelectOption) => void;
  placeholder?: string;
  disabled?: boolean;
  maxSuggestions?: number;
  className?: string;
}

export function IndustrySelect({
  options,
  value,
  onValueChange,
  onSelect,
  placeholder = "Type to search...",
  disabled = false,
  className
}: IndustrySelectProps) {
  // Convert our format to react-select format
  const selectOptions = options.map(option => ({
    value: option.value,
    label: option.label,
    description: option.description
  }));

  // Find current value - only if it matches an option
  const currentOption = selectOptions.find(option => option.value === value) || null;

  const handleChange = (
    newValue: SingleValue<{ value: string; label: string; description?: string }>,
    actionMeta: ActionMeta<{ value: string; label: string; description?: string }>
  ) => {
    if (newValue) {
      console.log('🎯 IndustrySelect: Option selected:', newValue);
      onSelect({
        value: newValue.value,
        label: newValue.label,
        description: newValue.description
      });
      onValueChange(newValue.label);
    }
  };

  const handleInputChange = (inputValue: string) => {
    console.log('📝 IndustrySelect: Input changed to:', inputValue);
    onValueChange(inputValue);
  };

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: '40px',
      borderColor: state.isFocused ? '#6366f1' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 1px #6366f1' : 'none',
      '&:hover': {
        borderColor: '#6366f1'
      }
    }),
    menu: (provided: any) => ({
      ...provided,
      zIndex: 99999, // Ensure it's above everything
      position: 'fixed' as const
    }),
    menuPortal: (provided: any) => ({
      ...provided,
      zIndex: 99999
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? '#6366f1' 
        : state.isFocused 
          ? '#f3f4f6' 
          : 'white',
      color: state.isSelected ? 'white' : '#374151',
      '&:hover': {
        backgroundColor: state.isSelected ? '#6366f1' : '#f3f4f6'
      }
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
            <span className="text-sm font-medium">{option.label}</span>
            {option.description && (
              <span className="text-xs text-gray-500">{option.description}</span>
            )}
          </div>
        )}
        className="react-select-container"
        classNamePrefix="react-select"
        inputValue={value}
        filterOption={(option, inputValue) => {
          return option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
                 (option.data.description?.toLowerCase().includes(inputValue.toLowerCase()) ?? false);
        }}
      />
    </div>
  );
}
