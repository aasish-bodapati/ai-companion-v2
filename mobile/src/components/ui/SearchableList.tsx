import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, MIXINS } from '../../theme/constants';
import { hapticFeedback } from '../../utils/haptics';

interface SearchableItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  iconColor?: string;
  metadata?: Record<string, any>;
}

interface SearchableListProps {
  items: SearchableItem[];
  onItemSelect: (item: SearchableItem) => void;
  onItemPress?: (item: SearchableItem) => void;
  
  // Search configuration
  searchPlaceholder?: string;
  searchDebounceMs?: number;
  minSearchLength?: number;
  showSearchIcon?: boolean;
  
  // Display configuration
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  emptyIcon?: string;
  
  // Item rendering
  renderItem?: (item: SearchableItem, index: number) => React.ReactNode;
  itemHeight?: number;
  
  // Styling
  containerStyle?: any;
  searchContainerStyle?: any;
  listStyle?: any;
  itemStyle?: any;
  
  // Loading state
  loading?: boolean;
  loadingText?: string;
  
  // Filtering
  filterItems?: (items: SearchableItem[], query: string) => SearchableItem[];
  
  // Selection
  selectedItemId?: string;
  multiSelect?: boolean;
  selectedItemIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export default function SearchableList({
  items,
  onItemSelect,
  onItemPress,
  searchPlaceholder = 'Search...',
  searchDebounceMs = 300,
  minSearchLength = 0,
  showSearchIcon = true,
  title,
  subtitle,
  emptyMessage = 'No items found',
  emptyIcon = 'search-outline',
  renderItem,
  itemHeight = 60,
  containerStyle,
  searchContainerStyle,
  listStyle,
  itemStyle,
  loading = false,
  loadingText = 'Loading...',
  filterItems,
  selectedItemId,
  multiSelect = false,
  selectedItemIds = [],
  onSelectionChange,
}: SearchableListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<SearchableItem[]>(items);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update filtered items when items or search query changes
  useEffect(() => {
    if (searchQuery.length < minSearchLength) {
      setFilteredItems(items);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      const filtered = filterItems 
        ? filterItems(items, searchQuery)
        : items.filter(item => 
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.subtitle && item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
          );
      
      setFilteredItems(filtered);
      setIsSearching(false);
    }, searchDebounceMs);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, items, filterItems, minSearchLength, searchDebounceMs]);

  const handleItemPress = (item: SearchableItem) => {
    hapticFeedback.light();
    
    if (onItemPress) {
      onItemPress(item);
    } else {
      onItemSelect(item);
    }
  };

  const handleItemSelect = (item: SearchableItem) => {
    hapticFeedback.selection();
    onItemSelect(item);
  };

  const isItemSelected = (itemId: string) => {
    if (multiSelect) {
      return selectedItemIds.includes(itemId);
    }
    return selectedItemId === itemId;
  };

  const handleSelectionToggle = (itemId: string) => {
    if (!multiSelect || !onSelectionChange) return;
    
    hapticFeedback.selection();
    
    const newSelection = selectedItemIds.includes(itemId)
      ? selectedItemIds.filter(id => id !== itemId)
      : [...selectedItemIds, itemId];
    
    onSelectionChange(newSelection);
  };

  const renderDefaultItem = (item: SearchableItem, index: number) => {
    const isSelected = isItemSelected(item.id);
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.item,
          isSelected && styles.selectedItem,
          itemStyle,
        ]}
        onPress={() => handleItemPress(item)}
        onLongPress={() => multiSelect && handleSelectionToggle(item.id)}
      >
        <View style={styles.itemContent}>
          {item.icon && (
            <View style={styles.itemIconContainer}>
              <Ionicons 
                name={item.icon as any} 
                size={20} 
                color={item.iconColor || COLORS.primary}
              />
            </View>
          )}
          
          <View style={styles.itemTextContainer}>
            <Text style={[styles.itemTitle, isSelected && styles.selectedItemText]}>
              {item.title}
            </Text>
            {item.subtitle && (
              <Text style={[styles.itemSubtitle, isSelected && styles.selectedItemSubtext]}>
                {item.subtitle}
              </Text>
            )}
            {item.description && (
              <Text style={[styles.itemDescription, isSelected && styles.selectedItemSubtext]}>
                {item.description}
              </Text>
            )}
          </View>
          
          {multiSelect && (
            <TouchableOpacity
              style={styles.selectionButton}
              onPress={() => handleSelectionToggle(item.id)}
            >
              <Ionicons 
                name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} 
                size={24} 
                color={isSelected ? COLORS.primary : COLORS.text.tertiary}
              />
            </TouchableOpacity>
          )}
          
          {!multiSelect && (
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={COLORS.text.tertiary}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.emptyText}>{loadingText}</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons 
          name={emptyIcon as any} 
          size={48} 
          color={COLORS.text.tertiary}
        />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
        {searchQuery.length > 0 && (
          <Text style={styles.emptySubtext}>
            Try adjusting your search terms
          </Text>
        )}
      </View>
    );
  };

  const renderHeader = () => {
    if (!title && !subtitle) return null;
    
    return (
      <View style={styles.header}>
        {title && <Text style={styles.title}>{title}</Text>}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    );
  };

  const renderSearchBar = () => (
    <View style={[styles.searchContainer, searchContainerStyle]}>
      <View style={styles.searchInputContainer}>
        {showSearchIcon && (
          <Ionicons 
            name="search-outline" 
            size={20} 
            color={COLORS.text.secondary}
            style={styles.searchIcon}
          />
        )}
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={searchPlaceholder}
          placeholderTextColor={COLORS.text.tertiary}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {isSearching && (
          <ActivityIndicator 
            size="small" 
            color={COLORS.primary}
            style={styles.searchLoader}
          />
        )}
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Ionicons 
              name="close-circle" 
              size={20} 
              color={COLORS.text.tertiary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {renderHeader()}
      {renderSearchBar()}
      
      <FlatList
        data={filteredItems}
        renderItem={({ item, index }) => 
          renderItem ? renderItem(item, index) : renderDefaultItem(item, index)
        }
        keyExtractor={(item) => item.id}
        style={[styles.list, listStyle]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        getItemLayout={itemHeight > 0 ? (_, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        }) : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  header: {
    marginBottom: SPACING.lg,
  },
  
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
  },
  
  searchContainer: {
    marginBottom: SPACING.lg,
  },
  
  searchInputContainer: {
    ...MIXINS.row,
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  
  searchIcon: {
    marginRight: SPACING.sm,
  },
  
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.text.primary,
  },
  
  searchLoader: {
    marginLeft: SPACING.sm,
  },
  
  clearButton: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs,
  },
  
  list: {
    flex: 1,
  },
  
  item: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  
  selectedItem: {
    backgroundColor: COLORS.primary + '10',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  
  itemContent: {
    ...MIXINS.row,
    padding: SPACING.md,
    alignItems: 'center',
  },
  
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  
  itemTextContainer: {
    flex: 1,
  },
  
  itemTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  
  itemSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  
  itemDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.tertiary,
    lineHeight: 16,
  },
  
  selectedItemText: {
    color: COLORS.primary,
  },
  
  selectedItemSubtext: {
    color: COLORS.primary + '80',
  },
  
  selectionButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
  },
  
  emptyText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  
  emptySubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.tertiary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
});
