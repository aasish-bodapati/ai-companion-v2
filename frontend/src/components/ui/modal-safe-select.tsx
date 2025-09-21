'use client';

import React from 'react';
import Select, { components, SingleValue } from 'react-select';
import { cn } from '@/lib/utils';

export interface ModalSafeSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface ModalSafeSelectProps {
  options: ModalSafeSelectOption[];
  value?: string;
  onChange: (option: ModalSafeSelectOption | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// Custom components to ensure proper styling
const CustomOption = (props: any) => {
  return (
    <components.Option {...props}>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">{props.data.label}</span>
        {props.data.description && (
          <span className="text-xs text-gray-600 mt-1">{props.data.description}</span>
        )}
      </div>
    </components.Option>
  );
};

const CustomSingleValue = (props: any) => {
  return (
    <components.SingleValue {...props}>
      <span className="text-sm text-gray-900">{props.data.label}</span>
    </components.SingleValue>
  );
};

export function ModalSafeSelect({
  options,
  value,
  onChange,
  placeholder = "Type to search...",
  disabled = false,
  className
}: ModalSafeSelectProps) {
  console.log('🔧 ModalSafeSelect: Rendering with', { 
    optionsCount: options.length, 
    value, 
    selectedOption: options.find(option => option.value === value),
    disabled 
  });

  // Find current option
  const selectedOption = options.find(option => option.value === value) || null;

  const handleChange = (newValue: SingleValue<ModalSafeSelectOption>) => {
    console.log('🎯 ModalSafeSelect: handleChange called with:', newValue);
    onChange(newValue);
  };

  // Custom styles that work reliably in modals
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
      color: '#6b7280',
    }),
    input: (provided: any) => ({
      ...provided,
      color: '#111827',
    }),
    // KEY: Use fixed positioning and very high z-index
    menu: (provided: any) => ({
      ...provided,
      position: 'fixed',
      zIndex: 999999,
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      borderRadius: '8px',
      maxHeight: '300px'
    }),
    // CRITICAL: Use menuPortal to render outside modal
    menuPortal: (provided: any) => ({
      ...provided,
      zIndex: 999999
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? '#6366f1' 
        : state.isFocused 
          ? '#f3f4f6' 
          : 'white',
      color: state.isSelected ? 'white' : '#111827',
      padding: '12px 16px',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: state.isSelected ? '#6366f1' : '#f3f4f6'
      }
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: '#111827'
    }),
    // Ensure proper scrolling
    menuList: (provided: any) => ({
      ...provided,
      maxHeight: '250px',
      overflowY: 'auto'
    })
  };

  return (
    <div className={cn("w-full", className)}>
      <Select
        options={options}
        value={selectedOption}
        onChange={handleChange}
        placeholder={placeholder}
        isDisabled={disabled}
        isSearchable={true}
        isClearable={false}
        // CRITICAL: Render menu outside modal DOM tree
        menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
        menuPosition="fixed"
        styles={customStyles}
        components={{
          Option: CustomOption,
          SingleValue: CustomSingleValue,
        }}
        className="react-select-container"
        classNamePrefix="react-select"
        // Improve performance for large lists
        filterOption={(option, inputValue) => {
          if (!inputValue) return true;
          const searchTerm = inputValue.toLowerCase();
          return (
            option.label.toLowerCase().includes(searchTerm) ||
            (option.data.description && option.data.description.toLowerCase().includes(searchTerm))
          );
        }}
        // Prevent menu from closing on scroll
        closeMenuOnScroll={false}
        // Better keyboard navigation
        escapeClearsValue={false}
        // Prevent issues with React 18
        menuShouldBlockScroll={false}
      />
    </div>
  );
}
