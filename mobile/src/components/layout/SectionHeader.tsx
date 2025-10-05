import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  action?: {
    text: string;
    onPress: () => void;
    icon?: string;
  };
  badge?: {
    text: string;
    color?: string;
    backgroundColor?: string;
  };
  style?: any;
}

export default function SectionHeader({
  title,
  subtitle,
  icon,
  action,
  badge,
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerContent}>
        <View style={styles.titleContainer}>
          {icon && (
            <View style={styles.iconContainer}>
              <Ionicons name={icon as any} size={20} color="#3b82f6" />
            </View>
          )}
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && (
              <Text style={styles.subtitle}>{subtitle}</Text>
            )}
          </View>
        </View>
        
        {badge && (
          <View style={[
            styles.badge,
            {
              backgroundColor: badge.backgroundColor || '#3b82f6',
            }
          ]}>
            <Text style={[
              styles.badgeText,
              { color: badge.color || '#ffffff' }
            ]}>
              {badge.text}
            </Text>
          </View>
        )}
      </View>
      
      {action && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={action.onPress}
          activeOpacity={0.7}
        >
          <Text style={styles.actionText}>{action.text}</Text>
          {action.icon && (
            <Ionicons 
              name={action.icon as any} 
              size={16} 
              color="#3b82f6" 
            />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
});
