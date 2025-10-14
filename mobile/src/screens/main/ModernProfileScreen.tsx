import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { OnboardingData } from '../../services/OnboardingService';
import { profileService } from '../../services/api';
import { onboardingService } from '../../services/api';
import EditPreferencesModal from '../../components/profile/EditPreferencesModal';
import { numericalGoalsService, GoalProgress } from '../../services/NumericalGoalsService';
import { hapticFeedback } from '../../utils/haptics';
import { useToast } from '../../contexts/ToastContext';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import { confirmationDialogConfigs } from '../../components/ui/ConfirmationDialog.utils';
import NumericalGoalsModal from '../../components/profile/NumericalGoalsModal';
import MobileOptimizedCard from '../../components/ui/MobileOptimizedCard';

import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '../../theme/constants';

import { DebugUtils } from '../../utils/debugUtils';

const { width: screenWidth } = Dimensions.get('window');

// Modern Health Metrics Card Component
const HealthMetricsCard = ({ userData }: { userData: any }) => {
  const calculateBMI = () => {
    const height = userData?.height;
    const weight = userData?.weight;
    if (!height || !weight) return null;
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    return h > 0 && w > 0 ? (w / (h * h)).toFixed(1) : null;
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: '#3b82f6' };
    if (bmi < 22) return { category: 'Lean', color: '#10b981' };
    if (bmi < 25) return { category: 'Healthy', color: '#10b981' };
    if (bmi < 30) return { category: 'Overweight', color: '#f59e0b' };
    return { category: 'Obese', color: '#ef4444' };
  };

  const bmi = calculateBMI();
  const bmiInfo = bmi ? getBMICategory(parseFloat(bmi)) : null;

  return (
    <MobileOptimizedCard style={styles.healthCard}>
      <View style={styles.cardHeader}>
        <View style={styles.headerIcon}>
          <Ionicons name="fitness-outline" size={24} color="#3b82f6" />
        </View>
        <Text style={styles.cardTitle}>Health Overview</Text>
      </View>
      
      <View style={styles.metricsGrid}>
        {/* BMI Display */}
        <View style={styles.metricItem}>
          <View style={styles.metricIcon}>
            <Ionicons name="speedometer-outline" size={20} color="#3b82f6" />
          </View>
          <View style={styles.metricContent}>
            <Text style={styles.metricValue}>
              {bmi || '--'}
            </Text>
            <Text style={styles.metricLabel}>BMI</Text>
            {bmiInfo && (
              <Text style={[styles.metricCategory, { color: bmiInfo.color }]}>
                {bmiInfo.category}
              </Text>
            )}
          </View>
        </View>

        {/* Height */}
        <View style={styles.metricItem}>
          <View style={styles.metricIcon}>
            <Ionicons name="resize-outline" size={20} color="#10b981" />
          </View>
          <View style={styles.metricContent}>
            <Text style={styles.metricValue}>
              {userData?.height ? `${userData.height} cm` : '--'}
            </Text>
            <Text style={styles.metricLabel}>Height</Text>
          </View>
        </View>

        {/* Weight */}
        <View style={styles.metricItem}>
          <View style={styles.metricIcon}>
            <Ionicons name="scale-outline" size={20} color="#8b5cf6" />
          </View>
          <View style={styles.metricContent}>
            <Text style={styles.metricValue}>
              {userData?.weight ? `${userData.weight} kg` : '--'}
            </Text>
            <Text style={styles.metricLabel}>Weight</Text>
          </View>
        </View>

        {/* Activity Level */}
        <View style={styles.metricItem}>
          <View style={styles.metricIcon}>
            <Ionicons name="flash-outline" size={20} color="#f59e0b" />
          </View>
          <View style={styles.metricContent}>
            <Text style={styles.metricValue}>
              {userData?.activityLevel ? 
                userData.activityLevel.charAt(0).toUpperCase() + 
                userData.activityLevel.slice(1) : '--'}
            </Text>
            <Text style={styles.metricLabel}>Activity</Text>
          </View>
        </View>
      </View>
    </MobileOptimizedCard>
  );
};

// Goal Recommendation Card Component
const GoalRecommendationCard = ({ bodyTypeGoal, onEdit }: { 
  bodyTypeGoal: string; 
  onEdit: () => void;
}) => {
  return (
    <MobileOptimizedCard style={styles.goalCard}>
      <View style={styles.cardHeader}>
        <View style={styles.headerIcon}>
          <Ionicons name="trophy-outline" size={24} color="#f59e0b" />
        </View>
        <Text style={styles.cardTitle}>Your Goal</Text>
        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
          <Ionicons name="create-outline" size={18} color="#3b82f6" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.goalContent}>
        <View style={styles.goalBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={styles.goalBadgeText}>Calculated</Text>
        </View>
        <Text style={styles.goalName}>{bodyTypeGoal || 'Loading...'}</Text>
        <Text style={styles.goalDescription}>
          Personalized based on your health data and goals
        </Text>
      </View>
    </MobileOptimizedCard>
  );
};

// Quick Actions Card Component
const QuickActionsCard = ({ 
  onPreferences, 
  onGoals, 
  onExport, 
  onSupport 
}: {
  onPreferences: () => void;
  onGoals: () => void;
  onExport: () => void;
  onSupport: () => void;
}) => {
  const actions = [
    {
      icon: 'settings-outline',
      title: 'Preferences',
      subtitle: 'Notifications & settings',
      color: '#8b5cf6',
      onPress: onPreferences,
    },
    {
      icon: 'flag-outline',
      title: 'Goals',
      subtitle: 'Set fitness targets',
      color: '#10b981',
      onPress: onGoals,
    },
    {
      icon: 'download-outline',
      title: 'Export Data',
      subtitle: 'Download your data',
      color: '#3b82f6',
      onPress: onExport,
    },
    {
      icon: 'help-circle-outline',
      title: 'Support',
      subtitle: 'Get help & feedback',
      color: '#f59e0b',
      onPress: onSupport,
    },
  ];

  return (
    <MobileOptimizedCard style={styles.actionsCard}>
      <View style={styles.cardHeader}>
        <View style={styles.headerIcon}>
          <Ionicons name="flash-outline" size={24} color="#f59e0b" />
        </View>
        <Text style={styles.cardTitle}>Quick Actions</Text>
      </View>
      
      <View style={styles.actionsGrid}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.actionItem}
            onPress={action.onPress}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
              <Ionicons name={action.icon as any} size={20} color={action.color} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>
    </MobileOptimizedCard>
  );
};

// Account Actions Card Component
const AccountActionsCard = ({ 
  onLogout, 
  onRerunOnboarding, 
  onDeleteAccount 
}: {
  onLogout: () => void;
  onRerunOnboarding: () => void;
  onDeleteAccount: () => void;
}) => {
  return (
    <MobileOptimizedCard style={styles.accountCard}>
      <View style={styles.cardHeader}>
        <View style={styles.headerIcon}>
          <Ionicons name="person-outline" size={24} color="#6b7280" />
        </View>
        <Text style={styles.cardTitle}>Account</Text>
      </View>
      
      <View style={styles.accountActions}>
        <TouchableOpacity style={styles.accountAction} onPress={onRerunOnboarding}>
          <Ionicons name="refresh-outline" size={20} color="#3b82f6" />
          <Text style={styles.accountActionText}>Redo Onboarding</Text>
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.accountAction} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={20} color="#f59e0b" />
          <Text style={styles.accountActionText}>Sign Out</Text>
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.accountAction, styles.dangerAction]} onPress={onDeleteAccount}>
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
          <Text style={[styles.accountActionText, styles.dangerText]}>Delete Account</Text>
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
        </TouchableOpacity>
      </View>
    </MobileOptimizedCard>
  );
};

export default function ModernProfileScreen() {
  const { user, logout, rerunOnboarding, deleteAccount } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showNumericalGoalsModal, setShowNumericalGoalsModal] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);

  const loadOnboardingData = useCallback(async () => {
    try {
      console.log('🔍 [PROFILE] Loading profile data...');
      const profileData = await profileService.getUserProfile();
      console.log('🔍 [PROFILE] Profile data received:', profileData);
      console.log('🔍 [PROFILE] Profile data type:', typeof profileData);
      console.log('🔍 [PROFILE] Profile data keys:', profileData ? Object.keys(profileData) : 'null/undefined');
      
      if (profileData) {
        const onboardingData = profileService.convertToOnboardingData(profileData);
        console.log('🔍 [PROFILE] Converted onboarding data:', onboardingData);
        setOnboardingData(onboardingData);
        await onboardingService.saveOnboardingData(onboardingData);
      } else {
        console.log('🔍 [PROFILE] No profile data, loading from local storage...');
        let data = await onboardingService.loadOnboardingData();
        if (!data) {
          console.log('🔍 [PROFILE] No local data, using defaults...');
          data = {
            healthData: {
              age: '25',
              height: '175',
              weight: '70',
              gender: 'male',
              activityLevel: 'moderate',
            },
            bodyTypeGoal: 'Athletic',
            goals: [],
            timezone: 'UTC',
            preferences: {
              notifications: true,
              reminders: true,
              dataSharing: false,
            },
          };
          await onboardingService.saveOnboardingData(data);
        }
        setOnboardingData(data);
      }
      console.log('🔍 [PROFILE] Profile data loaded successfully');
    } catch (error) {
      console.log('❌ [PROFILE] Error loading profile data:', error);
      // Don't show error toast for profile loading - it's not critical
      // showToast('Failed to load profile data', 'error');
      
      // Try to load from local storage as fallback
      try {
        const localData = await onboardingService.loadOnboardingData();
        if (localData) {
          setOnboardingData(localData);
          console.log('🔍 [PROFILE] Loaded from local storage as fallback');
        } else {
          // Create fallback data from user context
          console.log('🔍 [PROFILE] Creating fallback data from user context');
          const fallbackData = {
            healthData: {
              age: '25',
              height: '175',
              weight: '70',
              gender: 'male',
              activityLevel: 'moderate',
              ffm: '',
              smm: '',
              bodyFat: '',
              workoutDays: '',
            },
            bodyTypeGoal: 'Athletic',
            goals: [],
            timezone: 'UTC',
            preferences: {
              notifications: true,
              reminders: true,
              dataSharing: false,
            },
          };
          setOnboardingData(fallbackData);
          console.log('🔍 [PROFILE] Set fallback data');
        }
      } catch (localError) {
        console.log('❌ [PROFILE] Failed to load from local storage:', localError);
        // Set fallback data even if local storage fails
        const fallbackData = {
          healthData: {
            age: '25',
            height: '175',
            weight: '70',
            gender: 'male',
            activityLevel: 'moderate',
            ffm: '',
            smm: '',
            bodyFat: '',
            workoutDays: '',
          },
          bodyTypeGoal: 'Athletic',
          goals: [],
          timezone: 'UTC',
          preferences: {
            notifications: true,
            reminders: true,
            dataSharing: false,
          },
        };
        setOnboardingData(fallbackData);
        console.log('🔍 [PROFILE] Set fallback data after local storage error');
      }
    } finally {
      setLoading(false);
    }
  }, []); // Remove showToast dependency to prevent infinite loops

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    hapticFeedback.light();
    await loadOnboardingData();
    setRefreshing(false);
  }, []); // Remove loadOnboardingData dependency to prevent infinite loops

  useEffect(() => {
    loadOnboardingData();
  }, []); // Remove loadOnboardingData dependency to prevent infinite loops

  const handleLogout = () => {
    hapticFeedback.medium();
    logout();
  };

  const handleRerunOnboarding = () => {
    hapticFeedback.medium();
    rerunOnboarding();
  };

  const handleDeleteAccount = async () => {
    hapticFeedback.medium();
    setShowDeleteAccountDialog(true);
  };

  const handleConfirmDeleteAccount = async () => {
    try {
      const result = await deleteAccount();
      if (result.success) {
        showToast('Account deleted successfully', 'success', 4000);
      } else {
        showToast(result.message || 'Failed to delete account', 'error');
      }
    } catch (error) {
      showToast('Failed to delete account', 'error');
    }
    setShowDeleteAccountDialog(false);
  };

  const handleExportData = () => {
    hapticFeedback.medium();
    showToast('Data export will be available soon', 'info');
  };

  const handleSupport = () => {
    hapticFeedback.medium();
    showToast('Support feature coming soon', 'info');
  };

  // Memoize component props to prevent unnecessary re-renders
  const healthMetricsProps = useMemo(() => ({
    userData: onboardingData?.healthData
  }), [onboardingData?.healthData]);

  const goalRecommendationProps = useMemo(() => ({
    bodyTypeGoal: onboardingData?.bodyTypeGoal || 'Athletic',
    onEdit: handleRerunOnboarding
  }), [onboardingData?.bodyTypeGoal, handleRerunOnboarding]);

  const quickActionsProps = useMemo(() => ({
    onPreferences: () => setShowPreferencesModal(true),
    onGoals: () => setShowNumericalGoalsModal(true),
    onExport: handleExportData,
    onSupport: handleSupport
  }), [handleExportData, handleSupport]);

  const accountActionsProps = useMemo(() => ({
    onLogout: handleLogout,
    onRerunOnboarding: handleRerunOnboarding,
    onDeleteAccount: handleDeleteAccount
  }), [handleLogout, handleRerunOnboarding, handleDeleteAccount]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color="#ffffff" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.full_name || user?.email || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Health Metrics Card */}
        <HealthMetricsCard {...healthMetricsProps} />

        {/* Goal Recommendation Card */}
        <GoalRecommendationCard {...goalRecommendationProps} />

        {/* Quick Actions Card */}
        <QuickActionsCard {...quickActionsProps} />

        {/* Account Actions Card */}
        <AccountActionsCard {...accountActionsProps} />

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Modals */}
      <EditPreferencesModal
        visible={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        onboardingData={onboardingData}
        onSave={setOnboardingData}
      />

      <NumericalGoalsModal
        visible={showNumericalGoalsModal}
        onClose={() => setShowNumericalGoalsModal(false)}
      />

      <ConfirmationDialog
        visible={showDeleteAccountDialog}
        onClose={() => setShowDeleteAccountDialog(false)}
        onConfirm={handleConfirmDeleteAccount}
        {...confirmationDialogConfigs.deleteAccount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6b7280',
  },
  
  // Card Styles
  healthCard: {
    marginBottom: 16,
  },
  goalCard: {
    marginBottom: 16,
  },
  actionsCard: {
    marginBottom: 16,
  },
  accountCard: {
    marginBottom: 16,
  },
  
  // Card Header
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  editButton: {
    padding: 8,
  },
  
  // Health Metrics
  metricsGrid: {
    gap: 16,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  metricCategory: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Goal Card
  goalContent: {
    gap: 8,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  goalBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10b981',
    marginLeft: 4,
  },
  goalName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  goalDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  
  // Actions Grid
  actionsGrid: {
    gap: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  
  // Account Actions
  accountActions: {
    gap: 8,
  },
  accountAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dangerAction: {
    // Special styling for dangerous actions
  },
  accountActionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
    marginLeft: 12,
  },
  dangerText: {
    color: '#ef4444',
  },
  
  bottomSpacing: {
    height: 32,
  },
});
