
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';

import { Ionicons } from '@expo/vector-icons';
import { useErrorContext, AppError } from '../contexts/ErrorContext';

import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '../../theme/constants';

interface ErrorDisplayProps {
  maxErrors?: number;
  showRetryButtons?: boolean;
}

export function ErrorDisplay({ maxErrors = 5, showRetryButtons = true }: ErrorDisplayProps) {
  const { errors, removeError, retryError } = useErrorContext();

  if (errors.length === 0) {
    return null;
  }

  const displayErrors = errors.slice(0, maxErrors);

  const getErrorIcon = (type: AppError['type']) => {
    switch (type) {
      case 'network':
        return 'wifi-outline';
      case 'validation':
        return 'alert-circle-outline';
      case 'permission':
        return 'lock-closed-outline';
      default:
        return 'warning-outline';
    }
  };

  const getErrorColor = (type: AppError['type']) => {
    switch (type) {
      case 'network':
        return '#f59e0b';
      case 'validation':
        return '#ef4444';
      case 'permission':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {displayErrors.map((error) => (
          <View key={error.id} style={styles.errorCard}>
            <View style={styles.errorHeader}>
              <Ionicons
                name={getErrorIcon(error.type)}
                size={20}
                color={getErrorColor(error.type)}
              />
              <Text style={styles.errorType}>{error.type.toUpperCase()}</Text>
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={() => removeError(error.id)}
              >
                <Ionicons name="close" size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.errorMessage}>{error.message}</Text>

            {error.context && (
              <Text style={styles.errorContext}>{error.context}</Text>
            )}

            {showRetryButtons && error.retryable && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => retryError(error.id)}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: SPACING.md,
  },
  errorCard: {
    backgroundColor: 'white',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginRight: 8,
    minWidth: 200,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorType: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginLeft: 6,
    flex: 1,
  },
  dismissButton: {
    padding: SPACING.xxs,
  },
  errorMessage: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  errorContext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: COLORS.primary.main,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.xs,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: 'white',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
});

export default ErrorDisplay;
