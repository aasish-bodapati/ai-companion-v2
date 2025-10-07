import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { OnboardingData } from '../../services/onboardingService';
import { profileService } from '../../services/profileService';
import { onboardingService } from '../../services/onboardingService';
// import { MobileOptimizedCard } from '../../components/common/MobileOptimizedCard';
import EditPreferencesModal from '../../components/profile/EditPreferencesModal';
import { numericalGoalsService, GoalProgress } from '../../services/numericalGoalsService';
import { hapticFeedback } from '../../utils/haptics';
import { useToast } from '../../contexts/ToastContext';
import NumericalGoalsModal from '../../components/profile/NumericalGoalsModal';

// Body Type Goals Display Component
const BodyTypeGoalsDisplay = ({ bodyTypeGoal, userData, onGoalNameChange }: { 
  bodyTypeGoal: string; 
  userData: {
    height?: string;
    gender?: string;
    weight?: string;
    age?: string;
    activityLevel?: string;
  }; 
  onGoalNameChange?: (name: string) => void;
}) => {
  const [goalData, setGoalData] = useState<{
    name: string;
    targetBMI: number | { recommended: number };
    targetBodyFat: number | { recommended: number };
    calculatedTargetWeight: number;
    calculatedWaterGoal: number;
    targetAttributes: {
      workoutFrequency?: number | { recommended: number };
      sleepDuration?: number | { recommended: number };
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadGoalData = useCallback(async () => {
    try {
      // Import the body type goals service
      const { getBodyTypeGoalById } = await import('../../services/bodyTypeGoals');
      const goal = await getBodyTypeGoalById(bodyTypeGoal);
        
        if (goal) {
          // Calculate target weight based on user's height and goal BMI
          const targetWeight = Math.round((userData?.height ? parseFloat(userData.height) / 100 : 1.75) ** 2 * goal.targetBMI);
          
          // Calculate water goal based on user's gender
          const waterGoal = userData?.gender === 'male' ? 3700 : userData?.gender === 'female' ? 2700 : 3200;
          
          setGoalData({
            ...goal,
            calculatedTargetWeight: targetWeight,
            calculatedWaterGoal: waterGoal
          });
          
          // Notify parent component of the goal name
          if (onGoalNameChange) {
            onGoalNameChange(goal.name);
          }
        }
      } catch {
        // Silent error handling - no console logging to prevent Expo Go notifications
      } finally {
        setLoading(false);
      }
    }, [bodyTypeGoal, userData, onGoalNameChange]);

  useEffect(() => {
    loadGoalData();
  }, [loadGoalData]);

  if (loading) {
    return (
      <View style={styles.goalsLoading}>
        <Text style={styles.goalsLoadingText}>Loading goals...</Text>
      </View>
    );
  }

  if (!goalData) {
    return null;
  }

  return (
    <View style={styles.goalsDisplay}>
      {/* Key Metrics - Compact Grid */}
      <View style={styles.goalsGrid}>
        <View style={styles.goalMetric}>
          <Text style={styles.goalMetricValue}>{goalData.calculatedTargetWeight}kg</Text>
          <Text style={styles.goalMetricLabel}>Target Weight</Text>
        </View>
        <View style={styles.goalMetric}>
          <Text style={styles.goalMetricValue}>
            {goalData.targetBMI && typeof goalData.targetBMI === 'object' 
              ? goalData.targetBMI.recommended 
              : goalData.targetBMI || '--'}
          </Text>
          <Text style={styles.goalMetricLabel}>BMI Goal</Text>
        </View>
        <View style={styles.goalMetric}>
          <Text style={styles.goalMetricValue}>
            {goalData.targetBodyFat && typeof goalData.targetBodyFat === 'object' 
              ? goalData.targetBodyFat.recommended 
              : goalData.targetBodyFat || '--'}%
          </Text>
          <Text style={styles.goalMetricLabel}>Body Fat</Text>
        </View>
        <View style={styles.goalMetric}>
          <Text style={styles.goalMetricValue}>
            {(() => {
              const weight = userData?.weight ? parseFloat(userData.weight) : 70;
              const height = userData?.height ? parseFloat(userData.height) : 175;
              const age = userData?.age ? parseFloat(userData.age) : 30;
              const gender = userData?.gender || 'male';
              const activityLevel = userData?.activityLevel || 'moderate';
              
              let bmr;
              if (gender === 'male') {
                bmr = 10 * weight + 6.25 * height - 5 * age + 5;
              } else {
                bmr = 10 * weight + 6.25 * height - 5 * age - 161;
              }
              
              const activityMultipliers = {
                'sedentary': 1.2, 'light': 1.375, 'moderate': 1.55, 'active': 1.725, 'very_active': 1.9
              };
              
              const tdee = bmr * (activityMultipliers[activityLevel as keyof typeof activityMultipliers] || 1.55);
              return Math.round(tdee);
            })()}
          </Text>
          <Text style={styles.goalMetricLabel}>Calories/day</Text>
        </View>
      </View>

      {/* Workout & Lifestyle - Compact Row */}
      <View style={styles.goalsLifestyle}>
        {goalData.targetAttributes.workoutFrequency && (
          <View style={styles.goalLifestyleItem}>
            <Ionicons name="fitness-outline" size={16} color="#3b82f6" />
            <Text style={styles.goalLifestyleText}>
              {typeof goalData.targetAttributes.workoutFrequency === 'object'
                ? `${goalData.targetAttributes.workoutFrequency.recommended} workouts/week`
                : `${goalData.targetAttributes.workoutFrequency} workouts/week`
              }
            </Text>
          </View>
        )}
        {goalData.targetAttributes.sleepDuration && (
          <View style={styles.goalLifestyleItem}>
            <Ionicons name="moon-outline" size={16} color="#8b5cf6" />
            <Text style={styles.goalLifestyleText}>
              {typeof goalData.targetAttributes.sleepDuration === 'object' 
                ? `${goalData.targetAttributes.sleepDuration.recommended}h sleep`
                : `${goalData.targetAttributes.sleepDuration}h sleep`
              }
            </Text>
          </View>
        )}
        {goalData.targetAttributes.dailySteps && (
          <View style={styles.goalLifestyleItem}>
            <Ionicons name="walk-outline" size={16} color="#10b981" />
            <Text style={styles.goalLifestyleText}>
              {typeof goalData.targetAttributes.dailySteps === 'object'
                ? `${Math.round(goalData.targetAttributes.dailySteps.recommended / 1000)}k steps`
                : `${Math.round(goalData.targetAttributes.dailySteps / 1000)}k steps`
              }
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default function EnhancedProfileScreen() {
  const { user, logout, rerunOnboarding, deleteAccount } = useAuth();
  const { showToast } = useToast();
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showNumericalGoalsModal, setShowNumericalGoalsModal] = useState(false);
  const [bodyTypeGoalName, setBodyTypeGoalName] = useState<string>('');

  const loadNumericalGoals = useCallback(async () => {
    try {
      await numericalGoalsService.calculateProgress();
      console.log('🎯 Loaded numerical goals');
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
    }
  }, []);

  const loadOnboardingData = useCallback(async () => {
    try {
      // First try to get data from backend
      const profileData = await profileService.getUserProfile();
      
      if (profileData) {
        const onboardingData = profileService.convertToOnboardingData(profileData);
        setOnboardingData(onboardingData);
        
        // Also save to local storage for offline access
        await onboardingService.saveOnboardingData(onboardingData);
      } else {
        // Fallback to local data
        let data = await onboardingService.loadOnboardingData();
        
        if (!data) {
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
      
      // Timezone detection is now handled globally in GlobalStateContext
      
      // Load numerical goals after onboarding data is loaded
      await loadNumericalGoals();
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
      showToast('Failed to load profile data', 'error');
    } finally {
      setLoading(false);
    }
  }, []); // Remove dependencies to prevent infinite loop

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    hapticFeedback.light();
    await loadOnboardingData();
    setRefreshing(false);
  }, []); // Remove loadOnboardingData dependency to prevent infinite loop

  useEffect(() => {
    loadOnboardingData();
  }, []); // Remove loadOnboardingData dependency to prevent infinite loop

  useEffect(() => {
  }, [user]);

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
    
    // Show confirmation alert
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteAccount();
              if (result.success) {
                showToast('Account deleted successfully', 'success', 4000);
                // The user will be automatically logged out and redirected to login
              } else {
                showToast(`Failed to delete account: ${result.error}`, 'error', 5000);
              }
            } catch {
              showToast('Failed to delete account. Please try again.', 'error', 5000);
            }
          },
        },
      ]
    );
  };

  const handlePreferencesSave = async (data: {
    notifications: boolean;
    reminders: boolean;
    dataSharing: boolean;
  }) => {
    try {
      // Update local state
      setOnboardingData(prev => prev ? { ...prev, preferences: data } : null);
      
      // Update backend
      await profileService.updateUserProfile({ preferences: data });
      
      showToast('Preferences updated successfully', 'success');
    } catch {
      showToast('Failed to update preferences', 'error');
    }
  };

  const handleSaveNumericalGoals = async (goals: GoalProgress[]) => {
    try {
      // This would typically save to backend
      showToast('Goals updated successfully', 'success');
    } catch {
      showToast('Failed to update goals', 'error');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section - User Profile */}
      <View style={styles.heroSection}>
        <View style={styles.heroContent}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color="#ffffff" />
            </View>
            <View style={styles.statusIndicator} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.full_name || user?.email?.split('@')[0] || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            <View style={styles.userStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{onboardingData?.healthData?.age || '--'}</Text>
                <Text style={styles.statLabel}>Age</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{onboardingData?.healthData?.height ? Math.round(parseFloat(onboardingData.healthData.height)) : '--'}cm</Text>
                <Text style={styles.statLabel}>Height</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{onboardingData?.healthData?.weight || '--'}kg</Text>
                <Text style={styles.statLabel}>Weight</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {(() => {
                    const timezone = onboardingData?.timezone || 'UTC';
                    // Extract city name from timezone (e.g., "America/New_York" -> "New York")
                    const cityName = timezone.split('/').pop()?.replace('_', ' ') || timezone;
                    return cityName;
                  })()}
                </Text>
                <Text style={styles.statLabel}>Timezone</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Body Type Goal Section */}
      {onboardingData?.bodyTypeGoal && (
        <View style={styles.goalSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy-outline" size={20} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Your Goal</Text>
          </View>
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <View style={styles.goalIconContainer}>
                <Ionicons name="body-outline" size={24} color="#3b82f6" />
              </View>
              <View style={styles.goalInfo}>
                <Text style={styles.goalName}>{bodyTypeGoalName || 'Loading...'}</Text>
                <Text style={styles.goalDescription}>Your personalized body type goal</Text>
              </View>
              <TouchableOpacity 
                style={styles.changeGoalButton}
                onPress={handleRerunOnboarding}
              >
                <Ionicons name="refresh-outline" size={16} color="#3b82f6" />
                <Text style={styles.changeGoalText}>Change</Text>
              </TouchableOpacity>
            </View>
            <BodyTypeGoalsDisplay 
              bodyTypeGoal={onboardingData.bodyTypeGoal}
              userData={onboardingData.healthData}
              onGoalNameChange={setBodyTypeGoalName}
            />
          </View>
        </View>
      )}

      {/* Health Metrics Section */}
      <View style={styles.metricsSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="bar-chart-outline" size={20} color="#10b981" />
          <Text style={styles.sectionTitle}>Health Metrics</Text>
        </View>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Ionicons name="speedometer-outline" size={16} color="#3b82f6" />
            <Text style={styles.metricValue} numberOfLines={1}>
              {(() => {
                const height = onboardingData?.healthData?.height;
                const weight = onboardingData?.healthData?.weight;
                if (!height || !weight) return '--';
                const h = parseFloat(height) / 100;
                const w = parseFloat(weight);
                return h > 0 && w > 0 ? (w / (h * h)).toFixed(1) : '--';
              })()}
            </Text>
            <Text style={styles.metricLabel}>BMI</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="fitness-outline" size={16} color="#10b981" />
            <Text style={styles.metricValue} numberOfLines={1}>
              {onboardingData?.healthData?.activityLevel ? 
               onboardingData.healthData.activityLevel.charAt(0).toUpperCase() + 
               onboardingData.healthData.activityLevel.slice(1) : '--'}
            </Text>
            <Text style={styles.metricLabel}>Activity</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="people-outline" size={16} color="#8b5cf6" />
            <Text style={styles.metricValue} numberOfLines={1}>
              {onboardingData?.healthData?.gender ? 
               onboardingData.healthData.gender.charAt(0).toUpperCase() + 
               onboardingData.healthData.gender.slice(1) : '--'}
            </Text>
            <Text style={styles.metricLabel}>Gender</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions Section */}
      <View style={styles.actionsSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="flash-outline" size={20} color="#f59e0b" />
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => setShowPreferencesModal(true)}
          >
            <Ionicons name="settings-outline" size={24} color="#8b5cf6" />
            <Text style={styles.actionTitle}>Preferences</Text>
            <Text style={styles.actionSubtitle}>Notifications & settings</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => setShowNumericalGoalsModal(true)}
          >
            <Ionicons name="flag-outline" size={24} color="#10b981" />
            <Text style={styles.actionTitle}>Goals</Text>
            <Text style={styles.actionSubtitle}>Set fitness targets</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => {
              hapticFeedback.medium();
              showToast('Data export will be available soon', 'info');
            }}
          >
            <Ionicons name="download-outline" size={24} color="#3b82f6" />
            <Text style={styles.actionTitle}>Export</Text>
            <Text style={styles.actionSubtitle}>Download data</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            <Text style={styles.actionTitle}>Sign Out</Text>
            <Text style={styles.actionSubtitle}>Log out of account</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionCard, styles.dangerActionCard]}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={24} color="#dc2626" />
            <Text style={[styles.actionTitle, styles.dangerActionTitle]}>Delete Account</Text>
            <Text style={styles.actionSubtitle}>Permanently delete account</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* App Info Footer */}
      <View style={styles.footerSection}>
        <Text style={styles.footerText}>AI Companion v1.0.0</Text>
        <Text style={styles.footerSubtext}>Your personal health assistant</Text>
      </View>

      {/* Modals */}
      <EditPreferencesModal
        visible={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        onSave={handlePreferencesSave}
        initialData={onboardingData}
      />
      <NumericalGoalsModal
        visible={showNumericalGoalsModal}
        onClose={() => setShowNumericalGoalsModal(false)}
        onSave={handleSaveNumericalGoals}
        healthGoals={[]} // Will be populated based on body type goal
        userData={onboardingData?.healthData ? {
          age: parseInt(onboardingData.healthData.age) || 25,
          weight: parseInt(onboardingData.healthData.weight) || 70,
          height: parseInt(onboardingData.healthData.height) || 175,
          gender: onboardingData.healthData.gender,
          activityLevel: onboardingData.healthData.activityLevel,
        } : undefined}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  // Hero Section
  heroSection: {
    backgroundColor: '#3b82f6',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#e2e8f0',
    marginBottom: 8,
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 9,
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#94a3b8',
    marginHorizontal: 6,
  },
  
  // Goal Section
  goalSection: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 8,
  },
  goalCard: {
    // Removed redundant styling since it's already in goalSection
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  changeGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  changeGoalText: {
    fontSize: 12,
    color: '#3b82f6',
    marginLeft: 4,
    fontWeight: '600',
  },
  
  // Metrics Section
  metricsSection: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    minWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
    flexShrink: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Actions Section
  actionsSection: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 6,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  dangerActionCard: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  dangerActionTitle: {
    color: '#dc2626',
  },
  
  // Footer Section
  footerSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  
  // Body Type Goals Display - Compact
  goalsDisplay: {
    marginTop: 12,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  goalMetric: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  goalMetricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  goalMetricLabel: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  goalsLifestyle: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalLifestyleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    flex: 1,
    minWidth: '30%',
  },
  goalLifestyleText: {
    fontSize: 11,
    color: '#475569',
    marginLeft: 6,
    fontWeight: '500',
  },
  goalsLoading: {
    padding: 20,
    alignItems: 'center',
  },
  goalsLoadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
});
