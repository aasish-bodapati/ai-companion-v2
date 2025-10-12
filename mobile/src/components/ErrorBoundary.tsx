import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../theme/constants';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: (string | number)[];
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to crash reporting service in production
    if (!__DEV__) {
      // TODO: Integrate with crash reporting service (e.g., Sentry, Bugsnag)
      console.error('Production error:', error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetOnPropsChange && this.shouldResetErrorBoundary(prevProps, this.props)) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  shouldResetErrorBoundary = (prevProps: Props, nextProps: Props) => {
    const { resetKeys } = nextProps;
    if (!resetKeys || !prevProps.resetKeys) return false;

    return resetKeys.some((key, index) => key !== prevProps.resetKeys?.[index]);
  };

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleRetry = () => {
    this.resetErrorBoundary();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="warning-outline" size={48} color={COLORS.error.main} />
            </View>
            
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              We're sorry, but something unexpected happened. Please try again.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details (Development):</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Ionicons name="refresh" size={20} color={COLORS.white} />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  iconContainer: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  errorDetails: {
    backgroundColor: COLORS.error.light,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.lg,
    width: '100%',
  },
  errorTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.error.dark,
    marginBottom: SPACING.xs,
  },
  errorText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.error.dark,
    fontFamily: 'monospace',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary.main,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
});

export default ErrorBoundary;