import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hapticFeedback } from '../../utils/haptics';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme/constants';

interface TabItem {
  id: string;
  label: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
  disabled?: boolean;
}

interface TabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'small' | 'medium' | 'large';
  scrollable?: boolean;
  showLabels?: boolean;
  style?: any;
  testID?: string;
}

export default function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  variant = 'default',
  size = 'medium',
  scrollable = false,
  showLabels = true,
  style,
  testID,
}: TabNavigationProps) {
  const handleTabPress = (tabId: string) => {
    hapticFeedback.selection();
    onTabChange(tabId);
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: SPACING.small,
          paddingHorizontal: SPACING.medium,
          iconSize: 20,
          fontSize: FONT_SIZE.small,
        };
      case 'large':
        return {
          paddingVertical: SPACING.large,
          paddingHorizontal: SPACING.large,
          iconSize: 28,
          fontSize: FONT_SIZE.medium,
        };
      default:
        return {
          paddingVertical: SPACING.medium,
          paddingHorizontal: SPACING.medium,
          iconSize: 24,
          fontSize: FONT_SIZE.small,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const renderTab = (tab: TabItem) => {
    const isActive = activeTab === tab.id;
    const isDisabled = tab.disabled;

    const tabStyle = [
      styles.tab,
      variant === 'pills' && styles.pillsTab,
      variant === 'underline' && styles.underlineTab,
      isActive && styles.activeTab,
      isActive && variant === 'pills' && styles.activePillsTab,
      isActive && variant === 'underline' && styles.activeUnderlineTab,
      isDisabled && styles.disabledTab,
      { paddingVertical: sizeStyles.paddingVertical },
    ];

    const textStyle = [
      styles.tabText,
      { fontSize: sizeStyles.fontSize },
      isActive && styles.activeTabText,
      isActive && variant === 'pills' && styles.activePillsTabText,
      isDisabled && styles.disabledTabText,
    ];

    return (
      <TouchableOpacity
        key={tab.id}
        style={tabStyle}
        onPress={() => !isDisabled && handleTabPress(tab.id)}
        disabled={isDisabled}
        testID={`${testID}-tab-${tab.id}`}
      >
        <View style={styles.tabContent}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={tab.icon as any}
              size={sizeStyles.iconSize}
              color={
                isDisabled
                  ? COLORS.text.disabled
                  : isActive
                  ? COLORS.primary.main
                  : COLORS.text.secondary
              }
            />
            {tab.badge && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: tab.badgeColor || COLORS.error.main },
                ]}
              >
                <Text style={styles.badgeText}>{tab.badge}</Text>
              </View>
            )}
          </View>
          {showLabels && (
            <Text style={textStyle} numberOfLines={1}>
              {tab.label}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const containerStyle = [
    styles.container,
    variant === 'pills' && styles.pillsContainer,
    variant === 'underline' && styles.underlineContainer,
    style,
  ];

  const content = (
    <View style={styles.tabsContainer}>
      {tabs.map(renderTab)}
    </View>
  );

  if (scrollable) {
    return (
      <View style={containerStyle} testID={testID}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {content}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={containerStyle} testID={testID}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  pillsContainer: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.medium,
    margin: SPACING.medium,
    padding: SPACING.xs,
  },
  underlineContainer: {
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  tabsContainer: {
    flexDirection: 'row',
  },
  scrollContent: {
    paddingHorizontal: SPACING.small,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.small,
  },
  pillsTab: {
    flex: 1,
    borderRadius: BORDER_RADIUS.small,
    marginHorizontal: SPACING.xs,
  },
  underlineTab: {
    flex: 1,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    // Active tab styles
  },
  activePillsTab: {
    backgroundColor: COLORS.primary.main,
  },
  activeUnderlineTab: {
    borderBottomColor: COLORS.primary.main,
  },
  disabledTab: {
    opacity: 0.5,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: SPACING.xs,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.background.primary,
    fontWeight: '600',
  },
  tabText: {
    color: COLORS.text.secondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeTabText: {
    color: COLORS.primary.main,
    fontWeight: '600',
  },
  activePillsTabText: {
    color: COLORS.background.primary,
    fontWeight: '600',
  },
  disabledTabText: {
    color: COLORS.text.disabled,
  },
});
