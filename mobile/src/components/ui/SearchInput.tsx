import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hapticFeedback } from '../../utils/haptics';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../theme/constants';

export interface SearchResult {
  id: number | string;
  name: string;
  [key: string]: any; // Allow additional properties
}

interface SearchInputProps {
  placeholder: string;
  searchResults: SearchResult[];
  onSearch: (query: string) => void;
  onSelect: (item: SearchResult) => void;
  onClear?: () => void;
  loading?: boolean;
  error?: string;
  disabled?: boolean;
  showResults?: boolean;
  maxResults?: number;
  value?: string;
  onChangeText?: (text: string) => void;
  results?: SearchResult[];
  renderResultItem?: (item: SearchResult, index: number) => React.ReactNode;
  searchDelay?: number;
  containerStyle?: any;
  inputStyle?: any;
  resultsStyle?: any;
  testID?: string;
  onDropdownToggle?: (isOpen: boolean) => void;
}

export default function SearchInput({
  placeholder,
  searchResults,
  onSearch,
  onSelect,
  onClear,
  loading = false,
  error,
  disabled = false,
  showResults = true,
  maxResults = 10,
  renderResultItem,
  searchDelay = 300,
  containerStyle,
  inputStyle,
  resultsStyle,
  testID,
  onDropdownToggle,
}: SearchInputProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length > 0) {
      searchTimeoutRef.current = setTimeout(() => {
        onSearch(query.trim());
        // Don't set showDropdown here - let the useEffect handle it
      }, searchDelay);
    } else {
      setShowDropdown(false);
      onClear?.();
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, onSearch, onClear, searchDelay]);

  // Show dropdown when results are available
  useEffect(() => {
    if (searchResults.length > 0 && query.trim().length > 0) {
      setShowDropdown(true);
      onDropdownToggle?.(true); // Notify parent to disable modal scrolling
    } else {
      setShowDropdown(false);
      onDropdownToggle?.(false); // Notify parent to enable modal scrolling
    }
  }, [searchResults, query, onDropdownToggle]);

  // Don't automatically hide dropdown when keyboard is dismissed
  // Let the user control when to close the dropdown

  const handleFocus = () => {
    setIsFocused(true);
    hapticFeedback.light();
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Only close dropdown if there are no search results or query is empty
    // This prevents closing when user taps elsewhere to dismiss keyboard
    if (!query.trim() || searchResults.length === 0) {
      setTimeout(() => setShowDropdown(false), 150);
    }
  };

  const handleChangeText = (text: string) => {
    setQuery(text);
  };

  const handleSelectItem = (item: SearchResult) => {
    setQuery(''); // Clear the search query
    setShowDropdown(false);
    onDropdownToggle?.(false);
    onSelect(item);
    hapticFeedback.selection();
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setQuery('');
    setShowDropdown(false);
    onDropdownToggle?.(false);
    onClear?.();
    hapticFeedback.light();
    inputRef.current?.focus();
  };

  const handleCloseDropdown = () => {
    setShowDropdown(false);
    onDropdownToggle?.(false);
    inputRef.current?.blur();
  };

  // Sort results by relevance (exact matches first, then partial matches)
  const sortedResults = (searchResults || []).sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // Calculate relevance scores
    const getRelevanceScore = (name: string, query: string) => {
      let score = 0;
      
      // Exact match gets highest score
      if (name === query) return 1000;
      
      // Starts with query gets high score
      if (name.startsWith(query)) score += 100;
      
      // Word boundary matches get medium-high score
      const words = name.split(/\s+/);
      const wordMatches = words.filter(word => word.startsWith(query)).length;
      score += wordMatches * 50;
      
      // Contains query gets lower score
      if (name.includes(query)) score += 10;
      
      // Shorter names get slight bonus (more specific)
      score += Math.max(0, 20 - name.length);
      
      return score;
    };
    
    const aScore = getRelevanceScore(aName, queryLower);
    const bScore = getRelevanceScore(bName, queryLower);
    
    
    // Higher score first
    if (aScore !== bScore) return bScore - aScore;
    
    // Alphabetical order for ties
    return aName.localeCompare(bName);
  });
  
  const displayResults = sortedResults.slice(0, 5); // Limit to 5 results

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError,
        disabled && styles.inputContainerDisabled,
      ]}>
        <Ionicons 
          name="search" 
          size={20} 
          color={isFocused ? COLORS.primary.main : COLORS.text.secondary} 
          style={styles.searchIcon}
        />
        
        <TextInput
          ref={inputRef}
          style={[styles.input, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.text.secondary}
          value={query}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          testID={testID}
        />

        {loading && (
          <ActivityIndicator 
            size="small" 
            color={COLORS.primary.main} 
            style={styles.loadingIndicator}
          />
        )}

        {query.length > 0 && !loading && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearButton}
            testID={`${testID}-clear`}
          >
            <Ionicons name="close-circle" size={20} color={COLORS.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Simple dropdown - no complex components */}
      {showResults && showDropdown && displayResults.length > 0 && (
        <View style={styles.dropdownContainer}>
          <View style={styles.dropdown}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>
                {displayResults.length} result{displayResults.length !== 1 ? 's' : ''}
              </Text>
              <TouchableOpacity
                onPress={handleCloseDropdown}
                style={styles.dropdownCloseButton}
              >
                <Ionicons name="close" size={16} color={COLORS.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.dropdownList}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              {displayResults.map((item, index) => (
                <TouchableOpacity
                  key={item.id.toString()}
                  style={styles.dropdownItem}
                  onPress={() => handleSelectItem(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownItemText} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.text.tertiary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 999,
    backgroundColor: 'transparent',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
    minHeight: 48,
  },
  inputContainerFocused: {
    borderColor: COLORS.primary.main,
    backgroundColor: COLORS.background.primary,
  },
  inputContainerError: {
    borderColor: COLORS.error.main,
  },
  inputContainerDisabled: {
    backgroundColor: COLORS.background.disabled,
    borderColor: COLORS.border.disabled,
  },
  searchIcon: {
    marginRight: SPACING.small,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.medium,
    color: COLORS.text.primary,
    paddingVertical: 0,
  },
  loadingIndicator: {
    marginLeft: SPACING.small,
  },
  clearButton: {
    marginLeft: SPACING.small,
    padding: 2,
  },
  errorText: {
    fontSize: FONT_SIZE.small,
    color: COLORS.error.main,
    marginTop: SPACING.xs,
    marginLeft: SPACING.small,
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 10, // For Android
    maxHeight: 200, // Limit height to prevent keyboard overlap
  },
  dropdown: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    marginTop: SPACING.xs,
    ...SHADOWS.medium,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  dropdownTitle: {
    fontSize: FONT_SIZE.small,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  dropdownCloseButton: {
    padding: 2,
  },
  dropdownList: {
    // No height restrictions - shows all 5 items
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
    backgroundColor: COLORS.background.primary,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: FONT_SIZE.medium,
    color: COLORS.text.primary,
    marginRight: SPACING.small,
  },
});
