
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { COLORS, FONT_SIZE } from '../../theme/constants';
import useResponsive from '../../hooks/useResponsive';

interface DashboardHeaderCardProps {
  title?: string;
  subtitle?: string;
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
}

export default function DashboardHeaderCard({
  title,
  subtitle,
  quickStats = [],
  headerActions = [],
}: DashboardHeaderCardProps) {
  const responsive = useResponsive();

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: '#ffffff',
      borderRadius: responsive.getResponsiveSpacing(16),
      marginHorizontal: responsive.getResponsiveMargin(16),
      marginBottom: responsive.getResponsiveMargin(16),
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: responsive.getResponsivePadding(16),
      paddingTop: responsive.getResponsivePadding(16),
      paddingBottom: responsive.getResponsiveSpacing(12),
    },
    headerContent: {
      flex: 1,
    },
    title: {
      fontSize: responsive.getResponsiveFontSize(FONT_SIZE.xl),
      fontWeight: '700',
      color: COLORS.text.primary,
    },
    subtitle: {
      fontSize: responsive.getResponsiveFontSize(FONT_SIZE.sm),
      color: COLORS.text.secondary,
      marginTop: responsive.getResponsiveSpacing(2),
    },
    headerActions: {
      flexDirection: 'row',
      gap: responsive.getResponsiveSpacing(8),
    },
    headerAction: {
      padding: responsive.getResponsiveSpacing(8),
      borderRadius: responsive.getResponsiveSpacing(8),
      backgroundColor: COLORS.gray[100],
    },
    quickStatsSection: {
      borderTopWidth: 1,
      borderTopColor: COLORS.gray[200],
      paddingVertical: responsive.getResponsiveSpacing(12),
    },
    quickStats: {
      paddingHorizontal: responsive.getResponsivePadding(16),
      gap: responsive.getResponsiveSpacing(16),
    },
    quickStat: {
      alignItems: 'center',
      minWidth: responsive.breakpoints.isTablet ? 90 : 70,
    },
    quickStatIcon: {
      width: responsive.breakpoints.isTablet ? 44 : 36,
      height: responsive.breakpoints.isTablet ? 44 : 36,
      borderRadius: responsive.breakpoints.isTablet ? 22 : 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: responsive.getResponsiveSpacing(6),
    },
    quickStatValue: {
      fontSize: responsive.getResponsiveFontSize(FONT_SIZE.lg),
      fontWeight: '700',
      color: COLORS.text.primary,
      marginBottom: responsive.getResponsiveSpacing(2),
    },
    quickStatLabel: {
      fontSize: responsive.getResponsiveFontSize(FONT_SIZE.xs),
      color: COLORS.text.secondary,
      textAlign: 'center',
    },
  });

  return (
    <View style={dynamicStyles.container}>
      {/* Header Section */}
      {(title || headerActions.length > 0) && (
        <View style={dynamicStyles.header}>
          <View style={dynamicStyles.headerContent}>
            {title && <Text style={dynamicStyles.title}>{title}</Text>}
            {subtitle && (
              <Text style={dynamicStyles.subtitle}>{subtitle}</Text>
            )}
          </View>

          {headerActions.length > 0 && (
            <View style={dynamicStyles.headerActions}>
              {headerActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={dynamicStyles.headerAction}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={action.icon as keyof typeof Ionicons.glyphMap}
                    size={responsive.breakpoints.isTablet ? 24 : 20}
                    color={action.color || COLORS.text.secondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Quick Stats Section */}
      {quickStats.length > 0 && (
        <View style={dynamicStyles.quickStatsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={dynamicStyles.quickStats}
          >
            {quickStats.map((stat, index) => (
              <View key={index} style={dynamicStyles.quickStat}>
                <View style={[dynamicStyles.quickStatIcon, { backgroundColor: stat.color + '20' }]}>
                  <Ionicons
                    name={stat.icon as keyof typeof Ionicons.glyphMap}
                    size={responsive.breakpoints.isTablet ? 22 : 18}
                    color={stat.color}
                  />
                </View>
                <Text style={dynamicStyles.quickStatValue}>{stat.value}</Text>
                <Text style={dynamicStyles.quickStatLabel}>{stat.label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

