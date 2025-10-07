import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  style?: any;
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
                  name={action.icon as any} 
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
                  <Ionicons name={stat.icon as any} size={20} color={stat.color} />
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
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerAction: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  quickStatsContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  quickStats: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  quickStat: {
    alignItems: 'center',
    minWidth: 80,
  },
  quickStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  footer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
});
