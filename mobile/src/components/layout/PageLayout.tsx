
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';


import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '../../theme/constants';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
  showQuickStats?: boolean;
  quickStats?: {
    label: string;
    value: string | number;
    icon: string;
    color: string;
  }[];
  headerActions?: {
    icon: string;
    onPress: () => void;
    color?: string;
  }[];
  footer?: React.ReactNode;
  style?: ViewStyle;
}

export default function PageLayout({
  title,
  subtitle,
  children,
  onRefresh,
  refreshing = false,
  showQuickStats = false,
  quickStats = [],
  headerActions = [],
  footer,
  style,
}: PageLayoutProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
        </View>

        {headerActions.length > 0 && (
          <View style={styles.headerActions}>
            {headerActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.headerAction}
                onPress={action.onPress}
              >
                <Ionicons
                  name={action.icon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={action.color || '#6b7280'}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Quick Stats */}
      {showQuickStats && quickStats.length > 0 && (
        <View style={styles.quickStatsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickStats}
          >
            {quickStats.map((stat, index) => (
              <View key={index} style={styles.quickStat}>
                <View style={[styles.quickStatIcon, { backgroundColor: stat.color + '20' }]}>
                  <Ionicons name={stat.icon as keyof typeof Ionicons.glyphMap} size={20} color={stat.color} />
                </View>
                <Text style={styles.quickStatValue}>{stat.value}</Text>
                <Text style={styles.quickStatLabel}>{stat.label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>

      {/* Footer */}
      {footer && (
        <View style={styles.footer}>
          {footer}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerAction: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.background.secondary,
  },
  quickStatsContainer: {
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  quickStats: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: 16,
  },
  quickStat: {
    alignItems: 'center',
    minWidth: 80,
  },
  quickStatIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickStatValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  quickStatLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  footer: {
    backgroundColor: COLORS.background.primary,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
});
