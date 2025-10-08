import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Keyboard,
  // KeyboardAvoidingView,
  // Platform,
  // ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { BlurView } from 'expo-blur';
import FormModal from './FormModal';
import DateSelector from './DateSelector';
import SearchInput, { SearchResult } from './SearchInput';
import { hapticFeedback } from '../../utils/haptics';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme/constants';

export interface LoggingItem {
  id: number | string;
  name: string;
  quantity?: number;
  quantity_unit?: string;
  [key: string]: unknown; // Allow additional properties
}

interface LoggingModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: unknown) => Promise<void>;
  title: string;
  subtitle?: string;
  
  // Form configuration
  formType: 'meal' | 'workout' | 'water' | 'mood' | 'custom';
  initialData?: unknown;
  
  // Search configuration
  searchPlaceholder: string;
  searchResults: SearchResult[];
  onSearch: (query: string) => void;
  onSelectItem: (item: SearchResult) => void;
  onClearSearch?: () => void;
  searchLoading?: boolean;
  
  // Items management
  items: LoggingItem[];
  onAddItem: (item: LoggingItem) => void;
  onRemoveItem: (id: number | string) => void;
  onUpdateItem: (id: number | string, updates: Partial<LoggingItem>) => void;
  renderItem: (item: LoggingItem, index: number) => React.ReactNode;
  
  // Form validation
  isFormValid: () => boolean;
  getFormData: () => unknown;
  
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
  contentStyle?: Record<string, unknown>;
  headerStyle?: Record<string, unknown>;
  footerStyle?: Record<string, unknown>;
  
  testID?: string;
}

export default function LoggingModal({
  visible,
  onClose,
  onSave,
  title,
  subtitle,
  formType,
  initialData,
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
}: LoggingModalProps) {
  // const [keyboardVisible, setKeyboardVisible] = useState(false);
  // const [keyboardHeight, setKeyboardHeight] = useState(0);
  // const [dropdownOpen, setDropdownOpen] = useState(false);

  // Keyboard handling
  // useEffect(() => {
  //   const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
  //     setKeyboardVisible(true);
  //     setKeyboardHeight(e.endCoordinates.height);
  //   });

  //   const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
  //     setKeyboardVisible(false);
  //     setKeyboardHeight(0);
  //   });

  //   return () => {
  //     keyboardDidShowListener?.remove();
  //     keyboardDidHideListener?.remove();
  //   };
  // }, []);

  // Dismiss keyboard when modal closes
  useEffect(() => {
    if (!visible) {
      Keyboard.dismiss();
    }
  }, [visible]);

  // Reset form when modal opens
  useEffect(() => {
    if (visible && initialData) {
      // Reset form with initial data if provided
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
    } catch {
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
      <Text style={styles.sectionTitle}>Add Items</Text>
        <SearchInput
          placeholder={searchPlaceholder}
          searchResults={searchResults}
          onSearch={onSearch}
          onSelect={onSelectItem}
          onClear={onClearSearch}
          loading={searchLoading}
          onDropdownToggle={() => {}}
          testID={`${testID}-search`}
        />
    </View>
  );

  const renderItemsSection = () => (
    <View style={styles.itemsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {formType === 'meal' ? 'Food Items' : 
           formType === 'workout' ? 'Exercises' : 
           formType === 'water' ? 'Water Intake' : 
           formType === 'mood' ? 'Mood Entry' : 'Items'}
        </Text>
        <Text style={styles.itemsCount}>
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </Text>
      </View>
      
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons 
            name={formType === 'meal' ? 'restaurant-outline' : 
                  formType === 'workout' ? 'fitness-outline' : 
                  formType === 'water' ? 'water-outline' : 
                  formType === 'mood' ? 'happy-outline' : 'add-outline'} 
            size={48} 
            color={COLORS.text.secondary} 
          />
          <Text style={styles.emptyStateText}>
            {formType === 'meal' ? 'No food items added yet' : 
             formType === 'workout' ? 'No exercises added yet' : 
             formType === 'water' ? 'No water logged yet' : 
             formType === 'mood' ? 'No mood entry yet' : 'No items added yet'}
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Use the search above to add items
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.itemsList}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          decelerationRate="normal"
        >
          {items.map((item, index) => (
            <View key={item.id} style={styles.itemContainer}>
              {renderItem(item, index)}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderFormContent = () => (
    <View style={styles.content}>
      {/* Date Selection */}
      <View style={styles.dateSection}>
        <DateSelector
          selectedDate={new Date()}
          onDateSelect={() => {}} // This should be handled by parent
          label={`${formType === 'meal' ? 'Meal' : 
                  formType === 'workout' ? 'Workout' : 
                  formType === 'water' ? 'Water' : 
                  formType === 'mood' ? 'Mood' : 'Entry'} Date`}
          calendarModalTitle={`Select ${formType === 'meal' ? 'Meal' : 
                                      formType === 'workout' ? 'Workout' : 
                                      formType === 'water' ? 'Water' : 
                                      formType === 'mood' ? 'Mood' : 'Entry'} Date`}
          showLogsIndicator={false}
        />
      </View>

      {/* Additional Fields (e.g., Meal Type) */}
      {additionalFields && (
        <View style={styles.additionalFieldsSection}>
          {additionalFields}
        </View>
      )}

      {/* Search Section */}
      {renderSearchSection()}

      {/* Items Section */}
      {renderItemsSection()}

      {/* Empty Space Section */}
      <View style={styles.emptySpaceSection}>
        <View style={styles.emptySpace} />
      </View>
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
    padding: SPACING.medium,
    paddingBottom: SPACING.medium, // Reduced since we have dedicated empty space
    minHeight: 600, // Fixed height to ensure content is scrollable
  },
  dateSection: {
    marginBottom: SPACING.xl * 2,
  },
  searchSection: {
    marginBottom: SPACING.xl * 2,
  },
  itemsSection: {
    marginBottom: SPACING.xl * 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.medium,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.large,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  itemsCount: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text.secondary,
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: SPACING.small,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.small,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.large,
  },
  emptyStateText: {
    fontSize: FONT_SIZE.medium,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: SPACING.medium,
    marginBottom: SPACING.small,
  },
  emptyStateSubtext: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
  itemsList: {
    maxHeight: 400, // Increased height for better scrolling with more items
  },
  itemContainer: {
    marginBottom: SPACING.small,
  },
  additionalFieldsSection: {
    marginBottom: SPACING.medium,
  },
  emptySpaceSection: {
    marginTop: SPACING.large,
  },
  emptySpace: {
    height: 200, // Fixed height for empty space
    backgroundColor: 'transparent',
  },
});
