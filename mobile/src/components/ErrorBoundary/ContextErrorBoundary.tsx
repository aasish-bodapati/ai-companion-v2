/**
 * Context Error Boundary
 * 
 * Specialized error boundary for context-related errors.
 * Handles errors in context providers and consumers.
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ErrorBoundary } from './ErrorBoundary';

// ===== TYPES =====

interface ContextErrorBoundaryProps {
  children: ReactNode;
  contextName: string;
  onRetry?: () => void;
}

// ===== CONTEXT ERROR BOUNDARY =====

export function ContextErrorBoundary({ 
  children, 
  contextName, 
  onRetry 
}: ContextErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log context-specific error
    console.error(`🚨 [CONTEXT ERROR] ${contextName}:`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  };

  const fallback = (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="settings-outline" size={48} color="#f59e0b" />
        </View>
        
        <Text style={styles.title}>Context Error</Text>
        <Text style={styles.subtitle}>
          There was an error in the {contextName} context.
        </Text>
        
        <Text style={styles.description}>
          This usually means there's an issue with data loading or state management.
        </Text>
        
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Ionicons name="refresh" size={20} color="#ffffff" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <ErrorBoundary
      fallback={fallback}
      onError={handleError}
      resetKeys={[contextName]}
    >
      {children}
    </ErrorBoundary>
  );
}

// ===== STYLES =====

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  description: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ContextErrorBoundary;
