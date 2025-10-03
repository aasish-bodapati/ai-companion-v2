import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FormModal from './FormModal';
import SearchInput, { SearchResult } from './SearchInput';
import LoggingItem, { LoggingItemData } from './LoggingItem';
import { hapticFeedback } from '../../utils/haptics';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme/constants';
import { BaseLog, LogParams, SearchParams } from '../../types/BaseLog';

// Generic search service interface
export interface SearchService<T> {
  search: (query: string, params?: SearchParams) => Promise<T[]>;
  create: (data: any) => Promise<any>;
}

// Generic logging modal props
export interface GenericLoggingModalProps<T extends BaseLog, S> {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  title: string;
  subtitle?: string;
  
  // Form configuration
  formType: 'workout' | 'meal' | 'water' | 'mood' | 'custom';
  initialData?: any;
  
  // Search configuration
  searchService: SearchService<S>;
  searchPlaceholder: string;
  searchResults: S[];
  onSearch: (query: string) => void;
  onSelectItem: (item: S) => void;
  onClearSearch?: () => void;
  searchLoading?: boolean;
  
  // Items management
  items: LoggingItemData[];
  onAddItem: (item: LoggingItemData) => void;
  onRemoveItem: (id: number | string) => void;
  onUpdateItem: (id: number | string, updates: Partial<LoggingItemData>) => void;
  renderItem: (item: LoggingItemData, index: number) => React.ReactNode;
  
  // Form validation
  isFormValid: () => boolean;
  getFormData: () => any;
  
  // Additional form fields (for custom forms)
  additionalFields?: React.ReactNode;
  
  // Modal configuration
  variant?: 'default' | 'bottomSheet' | 'fullScreen' | 'centered';
  size?: 'small' | 'medium' | 'large' | 'full';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  
  // Loading state
  saving?: boolean;
  
  // Custom styling
  contentStyle?: any;
  headerStyle?: any;
  footerStyle?: any;
  
  testID?: string;
}

export default function GenericLoggingModal<T extends BaseLog, S>({
  visible,
  onClose,
  onSave,
  title,
  subtitle,
  formType,
  initialData,
  searchService,
  searchPlaceholder,
  searchResults,
  onSearch,
  onSelectItem,
  onClearSearch,
  searchLoading = false,
  items,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  renderItem,
  isFormValid,
  getFormData,
  additionalFields,
  variant = 'bottomSheet',
  size = 'large',
  showCloseButton = true,
  closeOnBackdrop = true,
  saving = false,
  contentStyle,
  headerStyle,
  footerStyle,
  testID,
}: GenericLoggingModalProps<T, S>) {
  
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible && initialData) {
      // Reset form with initial data if provided
      // This will be handled by the parent component
    }
  }, [visible, initialData]);

  const handleSave = async () => {
    if (!isFormValid || !isFormValid()) {
      hapticFeedback.error();
      return;
    }

    try {
      hapticFeedback.success();
      const formData = getFormData ? getFormData() : {};
      await onSave(formData);
    } catch (error) {
      hapticFeedback.error();
      // Silent error handling - no console logging to prevent Expo Go notifications
    }
  };

  const handleClose = () => {
    hapticFeedback.light();
    onClose();
  };

  const renderSearchSection = () => (
    <View style={styles.searchSection}>
      <SearchInput
        placeholder={searchPlaceholder}
        value=""
        onChangeText={onSearch}
        onClear={onClearSearch}
        loading={searchLoading}
        results={searchResults.map((item: any) => ({
          id: item.id || item.food_code || item.name,
          title: item.name || item.food_name || item.title,
          subtitle: item.description || item.category || item.brand,
          icon: item.icon || 'search',
        }))}
        onSelectResult={(result) => {
          const selectedItem = searchResults.find((item: any) => 
            (item.id || item.food_code || item.name) === result.id
          );
          if (selectedItem) {
            onSelectItem(selectedItem);
          }
        }}
        testID="search-input"
      />
    </View>
  );

  const renderItemsList = () => (
    <View style={styles.itemsList}>
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="add-circle-outline" size={48} color={COLORS.gray[400]} />
          <Text style={styles.emptyStateText}>
            No {formType === 'meal' ? 'food items' : formType === 'workout' ? 'exercises' : 'entries'} added yet
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Search and add {formType === 'meal' ? 'food items' : formType === 'workout' ? 'exercises' : 'entries'} to get started
          </Text>
        </View>
      ) : (
        items.map((item, index) => (
          <View key={item.id}>
            {renderItem(item, index)}
          </View>
        ))
      )}
    </View>
  );

  const renderFormContent = () => (
    <View style={[styles.content, contentStyle]}>
      {renderSearchSection()}
      {renderItemsList()}
      {additionalFields}
      <View style={styles.emptySpace} />
    </View>
  );

  return (
    <FormModal
      visible={visible}
      onClose={handleClose}
      title={title}
      subtitle={subtitle}
      variant={variant}
      size={size}
      showCloseButton={showCloseButton}
      closeOnBackdrop={closeOnBackdrop}
      loading={saving}
      isFormValid={isFormValid ? isFormValid() : false}
      scrollEnabled={true}
      primaryAction={{
        label: saving ? 'Saving...' : `Log ${formType === 'meal' ? 'Meal' : 
                                           formType === 'workout' ? 'Workout' : 
                                           formType === 'water' ? 'Water' : 
                                           formType === 'mood' ? 'Mood' : 'Entry'}`,
        onPress: handleSave,
        disabled: !(isFormValid ? isFormValid() : false) || saving,
        variant: 'primary',
      }}
      secondaryAction={{
        label: 'Cancel',
        onPress: handleClose,
        variant: 'outline',
      }}
      contentStyle={contentStyle}
      headerStyle={headerStyle}
      footerStyle={footerStyle}
      testID={testID}
    >
      {renderFormContent()}
    </FormModal>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  searchSection: {
    marginBottom: SPACING.lg,
  },
  itemsList: {
    flex: 1,
    marginBottom: SPACING.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyStateText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  emptyStateSubtext: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  emptySpace: {
    height: 100, // Space for keyboard
  },
});
