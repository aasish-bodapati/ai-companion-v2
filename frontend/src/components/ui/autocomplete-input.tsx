"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface AutocompleteOption {
  value: string
  label: string
  description?: string
}

interface AutocompleteInputProps {
  options: AutocompleteOption[]
  value: string
  onValueChange: (value: string) => void
  onSelect: (option: AutocompleteOption) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  maxSuggestions?: number
}

export function AutocompleteInput({
  options,
  value,
  onValueChange,
  onSelect,
  placeholder = "Type to search...",
  className,
  disabled = false,
  maxSuggestions = 10,
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
  const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 })
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  // Filter options based on input value
  const filteredOptions = React.useMemo(() => {
    console.log('🔍 AutocompleteInput: Filtering options for value:', value);
    console.log('🔍 AutocompleteInput: Available options:', options.length);
    
    if (!value.trim()) {
      console.log('🔍 AutocompleteInput: No value, returning empty array');
      return []
    }
    
    const searchTerm = value.toLowerCase()
    const filtered = options
      .filter(option => 
        option.label.toLowerCase().includes(searchTerm) ||
        option.description?.toLowerCase().includes(searchTerm)
      )
      .slice(0, maxSuggestions)
    
    console.log('🔍 AutocompleteInput: Filtered options:', filtered.length, filtered);
    return filtered
  }, [options, value, maxSuggestions])

  // Calculate dropdown position
  const updateDropdownPosition = React.useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }, [])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onValueChange(newValue)
    setIsOpen(newValue.length > 0)
    setHighlightedIndex(-1)
    if (newValue.length > 0) {
      updateDropdownPosition()
    }
  }

  // Handle option selection
  const handleOptionSelect = (option: AutocompleteOption) => {
    console.log('🎯 AutocompleteInput: handleOptionSelect called with:', option);
    onSelect(option)
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredOptions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleOptionSelect(filteredOptions[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
    }
  }

  // Handle input focus
  const handleFocus = () => {
    if (value.length > 0) {
      setIsOpen(true)
      updateDropdownPosition()
    }
  }

  // Handle click outside and scroll
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInputClick = inputRef.current?.contains(target);
      const isListClick = listRef.current?.contains(target);
      
      console.log('🖱️ AutocompleteInput: Click outside detected', {
        target: event.target,
        listRef: listRef.current,
        inputRef: inputRef.current,
        isListClick,
        isInputClick
      });
      
      // Only close if clicking outside both input and dropdown
      if (!isInputClick && !isListClick) {
        console.log('🖱️ AutocompleteInput: Closing dropdown due to click outside');
        setIsOpen(false)
        setHighlightedIndex(-1)
      } else {
        console.log('🖱️ AutocompleteInput: Click is on input or dropdown, keeping open');
      }
    }

    const handleScroll = () => {
      if (isOpen) {
        updateDropdownPosition()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleScroll)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll)
    }
  }, [isOpen, updateDropdownPosition])

  // Scroll highlighted option into view
  React.useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        })
      }
    }
  }, [highlightedIndex])

  return (
    <div className="relative z-50">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={cn("w-full", className)}
        disabled={disabled}
        autoComplete="off"
      />
      
      {(() => {
        console.log('🎨 AutocompleteInput: Rendering check - isOpen:', isOpen, 'filteredOptions.length:', filteredOptions.length, 'window:', typeof window !== 'undefined');
        return isOpen && filteredOptions.length > 0 && typeof window !== 'undefined' ? createPortal(
        <div
          ref={listRef}
          className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
          }}
        >
          {filteredOptions.map((option, index) => (
            <div
              key={option.value}
              className={cn(
                "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700",
                index === highlightedIndex && "bg-gray-100 dark:bg-gray-700"
              )}
              onMouseDown={(e) => {
                console.log('🖱️ AutocompleteInput: MouseDown on option:', option);
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                console.log('🖱️ AutocompleteInput: Clicked on option:', option);
                e.preventDefault();
                e.stopPropagation();
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
      ) : null
      })()}
    </div>
  )
}
