import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hapticFeedback } from '../../utils/haptics';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme/constants';

interface ScreenLayoutProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  showRefreshButton?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  variant?: 'default' | 'modal' | 'fullscreen';
  scrollable?: boolean;
  keyboardAvoidingView?: boolean;
  backgroundColor?: string;
  statusBarStyle?: 'default' | 'light-content' | 'dark-content';
  testID?: string;
}

export default function ScreenLayout({
  title,
  subtitle,
  showBackButton = false,
  onBack,
  showRefreshButton = false,
  onRefresh,
  refreshing = false,
  children,
  headerRight,
  variant = 'default',
  scrollable = true,
  keyboardAvoidingView = true,
  backgroundColor = COLORS.background.primary,
  statusBarStyle = 'dark-content',
  testID,
}: ScreenLayoutProps) {
  const handleBack = () => {
    hapticFeedback.light();
    onBack?.();
  };

  const handleRefresh = () => {
    hapticFeedback.light();
    onRefresh?.();
  };

  const renderHeader = () => {
    if (!title && !subtitle && !showBackButton && !showRefreshButton && !headerRight) {
      return null;
    }

    return (
      <View style={styles.header}>
        <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
        
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            {showBackButton && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                testID={`${testID}-back-button`}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
            )}
            
            <View style={styles.titleContainer}>
              {title && <Text style={styles.title}>{title}</Text>}
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          </View>
          
          <View style={styles.headerRight}>
            {showRefreshButton && (
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefresh}
                testID={`${testID}-refresh-button`}
              >
                <Ionicons 
                  name="refresh" 
                  size={20} 
                  color={COLORS.text.primary}
                  style={refreshing ? styles.refreshingIcon : undefined}
                />
              </TouchableOpacity>
            )}
            {headerRight}
          </View>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    const content = (
      <View style={[styles.content, { backgroundColor }]}>
        {children}
      </View>
    );

    if (scrollable) {
      return (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={COLORS.primary}
                colors={[COLORS.primary]}
              />
            ) : undefined
          }
        >
          {content}
        </ScrollView>
      );
    }

    return content;
  };

  const containerStyle = [
    styles.container,
    variant === 'modal' && styles.modalVariant,
    variant === 'fullscreen' && styles.fullscreenVariant,
    { backgroundColor },
  ];

  if (keyboardAvoidingView) {
    return (
      <SafeAreaView style={containerStyle} testID={testID}>
        {renderHeader()}
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {renderContent()}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={containerStyle} testID={testID}>
      {renderHeader()}
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalVariant: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.large,
    margin: SPACING.medium,
    maxHeight: '90%',
  },
  fullscreenVariant: {
    backgroundColor: COLORS.background.primary,
  },
  header: {
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
    paddingBottom: SPACING.small,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.medium,
    paddingTop: SPACING.small,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: SPACING.medium,
    padding: SPACING.xs,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: FONT_SIZE.medium,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.small,
  },
  refreshButton: {
    padding: SPACING.xs,
  },
  refreshingIcon: {
    // Add rotation animation if needed
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.medium,
  },
});
