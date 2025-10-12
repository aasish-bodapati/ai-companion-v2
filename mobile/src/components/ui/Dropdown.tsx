
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../theme/constants';

export interface DropdownItem {
  id: string | number;
  name: string;
  [key: string]: unknown;
}

interface DropdownProps {
  visible: boolean;
  onClose: () => void;
  items: DropdownItem[];
  onSelect: (item: DropdownItem) => void;
  title?: string;
  maxHeight?: number;
  renderItem?: (item: DropdownItem, index: number) => React.ReactNode;
  testID?: string;
}

export default function Dropdown({
  visible,
  onClose,
  items,
  onSelect,
  title,
  maxHeight = 200,
  renderItem,
  testID,
}: DropdownProps) {
  const handleSelectItem = (item: DropdownItem) => {
    onSelect(item);
    onClose();
  };

  const defaultRenderItem = (item: DropdownItem, index: number) => (
    <TouchableOpacity
      key={item.id}
      style={styles.resultItem}
      onPress={() => handleSelectItem(item)}
      testID={`${testID}-item-${index}`}
    >
      <View style={styles.resultItemContent}>
        <Text style={styles.resultItemName} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.text.tertiary} />
    </TouchableOpacity>
  );

  if (!visible || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.dropdownContainer}>
      <View style={[styles.dropdown, { maxHeight }]}>
        {title && (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              testID={`${testID}-close`}
            >
              <Ionicons name="close" size={20} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {items.map((item, index) => (
            <View key={item.id.toString()}>
              {renderItem ? renderItem(item, index) : defaultRenderItem(item, index)}
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  dropdown: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    marginTop: SPACING.xs,
    ...SHADOWS.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  title: {
    fontSize: FONT_SIZE.medium,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  scrollView: {
    maxHeight: 200,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  resultItemContent: {
    flex: 1,
    marginRight: SPACING.small,
  },
  resultItemName: {
    fontSize: FONT_SIZE.medium,
    color: COLORS.text.primary,
  },
});
