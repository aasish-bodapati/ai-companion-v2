import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import MobileOptimizedCard from '../../components/ui/MobileOptimizedCard';
import TouchOptimizedButton from '../../components/ui/TouchOptimizedButton';
import EditPreferencesModal from '../../components/profile/EditPreferencesModal';
import TimezoneSelector from '../../components/profile/TimezoneSelector';
import { onboardingService, OnboardingData, HealthData } from '../../services/onboardingService';
import { profileService, UserProfile } from '../../services/profileService';
import { numericalGoalsService, GoalProgress } from '../../services/numericalGoalsService';
import { hapticFeedback } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import NumericalGoalsModal from '../../components/profile/NumericalGoalsModal';

// Body Type Goals Display Component
const BodyTypeGoalsDisplay = ({ bodyTypeGoal, userData }: { bodyTypeGoal: string; userData: any }) => {
  const [goalData, setGoalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGoalData = async () => {
      try {
        // Import the body type goals service
        const { BODY_TYPE_GOALS } = await import('../../services/bodyTypeGoals');
        const goal = BODY_TYPE_GOALS.find(bt => bt.id === bodyTypeGoal);
        
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
        }
      } catch (error) {
        console.error('Failed to load goal data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGoalData();
  }, [bodyTypeGoal, userData]);

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
      {/* Target Values Section */}
      <View style={styles.goalsSection}>
        <Text style={styles.goalsSectionTitle}>Target Values</Text>
        <View style={styles.goalsGrid}>
          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>Target Weight</Text>
            <Text style={styles.goalValue}>{goalData.calculatedTargetWeight}kg</Text>
          </View>
          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>Goal BMI</Text>
            <Text style={styles.goalValue}>{goalData.targetBMI}</Text>
          </View>
          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>Body Fat %</Text>
            <Text style={styles.goalValue}>{goalData.targetBodyFat}%</Text>
          </View>
        </View>
      </View>

      {/* Target Attributes Section */}
      <View style={styles.goalsSection}>
        <Text style={styles.goalsSectionTitle}>Target Attributes</Text>
        <View style={styles.goalsGrid}>
          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>Protein Target</Text>
            <Text style={styles.goalValue}>{goalData.targetAttributes.proteinTarget}g/kg</Text>
          </View>
          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>Workout Frequency</Text>
            <Text style={styles.goalValue}>{goalData.targetAttributes.workout_frequency} days/week</Text>
          </View>
          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>Cardio Minutes</Text>
            <Text style={styles.goalValue}>{goalData.targetAttributes.cardio_minutes} min/week</Text>
          </View>
          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>Water Goal</Text>
            <Text style={styles.goalValue}>{goalData.calculatedWaterGoal}ml/day</Text>
          </View>
          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>Timeline</Text>
            <Text style={styles.goalValue}>{goalData.targetAttributes.timeline} weeks</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default function EnhancedProfileScreen() {
  const { user, logout, updateUser, rerunOnboarding } = useAuth();
  const navigation = useNavigation();
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showNumericalGoalsModal, setShowNumericalGoalsModal] = useState(false);
  const [numericalGoals, setNumericalGoals] = useState<GoalProgress[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(false);

  const loadNumericalGoals = useCallback(async () => {
    try {
      setGoalsLoading(true);
      const goals = await numericalGoalsService.calculateProgress();
      setNumericalGoals(goals);
      console.log('🎯 Loaded numerical goals:', goals.length);
    } catch (error) {
      console.error('Failed to load numerical goals:', error);
    } finally {
      setGoalsLoading(false);
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
      
      // Load numerical goals after onboarding data is loaded
      await loadNumericalGoals();
    } catch (error) {
      console.error('Failed to load profile data:', error);
      showToast.error('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, []); // Remove loadNumericalGoals dependency to prevent infinite loop

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
    hapticFeedback.warning();
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleEditHealthData = () => {
    hapticFeedback.medium();
    setShowPreferencesModal(true);
  };


  const handleEditPreferences = () => {
    hapticFeedback.medium();
    // Navigate to preferences editing screen
    showToast.info('Coming Soon', 'Preferences editing will be available soon');
  };

  const handleRerunOnboarding = () => {
    hapticFeedback.medium();
    Alert.alert(
      'Rerun Onboarding',
      'This will take you through the setup process again to choose a new body type goal. Your current data will be preserved.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Rerun',
          style: 'default',
          onPress: async () => {
            console.log('🎯 Rerunning onboarding...');
            try {
              await rerunOnboarding();
              showToast.success('Rerun Onboarding', 'Taking you back to setup...');
            } catch (error) {
              console.error('Failed to rerun onboarding:', error);
              showToast.error('Error', 'Failed to restart onboarding');
            }
          },
        },
      ]
    );
  };

  const handleOpenNumericalGoals = () => {
    hapticFeedback.medium();
    setShowNumericalGoalsModal(true);
  };

  const handleSaveNumericalGoals = async (goals: any[]) => {
    try {
      await numericalGoalsService.setGoals(goals);
      await loadNumericalGoals();
      showToast.success('Success', 'Goals updated successfully');
    } catch (error) {
      console.error('Failed to save numerical goals:', error);
      showToast.error('Error', 'Failed to save goals');
    }
  };



  const handlePreferencesSave = async (data: OnboardingData) => {
    try {
      // Save to local storage
      await onboardingService.saveOnboardingData(data);
      setOnboardingData(data);
      
      // Also save to backend
      const profileData = profileService.convertToProfileData(data);
      const updatedProfile = await profileService.updateUserProfile(profileData);
      
      if (updatedProfile) {
        showToast.success('Success', 'Preferences updated successfully');
      } else {
        showToast.info('Info', 'Preferences saved locally (offline)');
      }
      
      setShowPreferencesModal(false);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      showToast.error('Error', 'Failed to save preferences');
    }
  };



  const ProfileItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true,
    variant = 'default' as const,
    color = '#6366f1'
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
    variant?: 'default' | 'elevated' | 'outlined' | 'filled';
    color?: string;
  }) => (
    <MobileOptimizedCard
      onPress={onPress}
      variant={variant}
      hapticFeedback="light"
      style={styles.profileItem}
    >
      <View style={styles.profileItemContent}>
        <View style={[styles.profileItemIcon, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon as any} size={24} color={color} />
        </View>
        <View style={styles.profileItemText}>
          <Text style={styles.profileItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.profileItemSubtitle}>{subtitle}</Text>}
        </View>
        {showArrow && (
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        )}
      </View>
    </MobileOptimizedCard>
  );

  const HealthDataCard = () => {
    if (!onboardingData?.healthData) return null;

    const { age, height, weight, gender, activityLevel } = onboardingData.healthData;
    const hasData = age && height && weight;
    const bodyTypeGoal = onboardingData.bodyTypeGoal || '';
    const hasBodyTypeGoal = bodyTypeGoal.length > 0;
    
    console.log('🎯 HealthDataCard Debug:');
    console.log('  - onboardingData:', onboardingData);
    console.log('  - bodyTypeGoal:', bodyTypeGoal);
    console.log('  - hasBodyTypeGoal:', hasBodyTypeGoal);
    console.log('  - hasData:', hasData);

    return (
      <MobileOptimizedCard
        variant="elevated"
        style={styles.healthDataCard}
        onPress={handleEditHealthData}
        hapticFeedback="medium"
      >
        <View style={styles.healthDataHeader}>
          <Ionicons name="fitness-outline" size={24} color="#10b981" />
          <View style={styles.healthDataTitleContainer}>
            <Text style={styles.healthDataTitle}>Health Information</Text>
            <Text style={styles.healthDataSubtitle}>Tap to edit preferences</Text>
          </View>
          <TouchableOpacity onPress={handleEditHealthData}>
            <Ionicons name="pencil" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
        
        {hasData ? (
          <View style={styles.healthDataContent}>
            <View style={styles.healthDataRow}>
              <Text style={styles.healthDataLabel}>Age</Text>
              <Text style={styles.healthDataValue}>{age} years</Text>
            </View>
            <View style={styles.healthDataRow}>
              <Text style={styles.healthDataLabel}>Height</Text>
              <Text style={styles.healthDataValue}>{height} cm</Text>
            </View>
            <View style={styles.healthDataRow}>
              <Text style={styles.healthDataLabel}>Weight</Text>
              <Text style={styles.healthDataValue}>{weight} kg</Text>
            </View>
            <View style={styles.healthDataRow}>
              <Text style={styles.healthDataLabel}>Gender</Text>
              <Text style={styles.healthDataValue}>{gender.charAt(0).toUpperCase() + gender.slice(1)}</Text>
            </View>
            <View style={styles.healthDataRow}>
              <Text style={styles.healthDataLabel}>Activity Level</Text>
              <Text style={styles.healthDataValue}>
                {activityLevel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            </View>
            
            {/* Goals Section - Redesigned to integrate both body type and numerical goals */}
            <View style={styles.goalsSection}>
              <View style={styles.goalsSectionHeader}>
                <Ionicons name="flag-outline" size={18} color="#3b82f6" />
                <Text style={styles.goalsSectionTitle}>Your Goals</Text>
                <View style={styles.goalsActionButtons}>
                  <TouchableOpacity onPress={handleOpenNumericalGoals} style={styles.editGoalsButton}>
                    <Ionicons name="add-circle-outline" size={16} color="#6b7280" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleRerunOnboarding} style={styles.editGoalsButton}>
                    <Ionicons name="pencil" size={16} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>
              
              {hasBodyTypeGoal ? (
                <View style={styles.goalsContent}>
                  {/* Body Type Goal Card */}
                  <MobileOptimizedCard
                    variant="elevated"
                    style={styles.bodyTypeGoalCard}
                  >
                    <View style={styles.bodyTypeGoalHeader}>
                      <View style={styles.bodyTypeGoalIconContainer}>
                        <Ionicons name="body-outline" size={24} color="#3b82f6" />
                      </View>
                      <View style={styles.bodyTypeGoalInfo}>
                        <Text style={styles.bodyTypeGoalTitle}>{bodyTypeGoal}</Text>
                        <Text style={styles.bodyTypeGoalDescription}>
                          Your personalized body type goal with calculated targets
                        </Text>
                      </View>
                      <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    </View>
                    
                    {/* Target Values Display */}
                    <BodyTypeGoalsDisplay 
                      bodyTypeGoal={bodyTypeGoal}
                      userData={onboardingData.healthData}
                    />
                  </MobileOptimizedCard>
                  
                  {/* Numerical Goals Section */}
                  {numericalGoals.length > 0 && (
                    <View style={styles.numericalGoalsSection}>
                      <View style={styles.numericalGoalsHeader}>
                        <Text style={styles.numericalGoalsTitle}>Trackable Goals</Text>
                        <TouchableOpacity onPress={handleOpenNumericalGoals}>
                          <Text style={styles.manageGoalsText}>Manage</Text>
                        </TouchableOpacity>
                      </View>
                      
                      {goalsLoading ? (
                        <View style={styles.goalsLoading}>
                          <Text style={styles.goalsLoadingText}>Loading goals...</Text>
                        </View>
                      ) : (
                        <View style={styles.numericalGoalsList}>
                          {numericalGoals.slice(0, 3).map((goal) => (
                            <View key={goal.goalId} style={styles.numericalGoalItem}>
                              <View style={styles.goalItemInfo}>
                                <Text style={styles.goalItemName}>{goal.goalName}</Text>
                                <Text style={styles.goalItemProgress}>
                                  {goal.currentValue.toFixed(1)} / {goal.targetValue} {goal.unit}
                                </Text>
                              </View>
                              <View style={styles.goalItemProgressBar}>
                                <View 
                                  style={[
                                    styles.goalItemProgressFill, 
                                    { 
                                      width: `${Math.min(goal.progressPercentage, 100)}%`,
                                      backgroundColor: goal.color 
                                    }
                                  ]} 
                                />
                              </View>
                            </View>
                          ))}
                          
                          {numericalGoals.length > 3 && (
                            <TouchableOpacity 
                              style={styles.viewAllGoalsButton}
                              onPress={handleOpenNumericalGoals}
                            >
                              <Text style={styles.viewAllGoalsText}>
                                View all {numericalGoals.length} goals
                              </Text>
                              <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                  
                  {/* Goal Progress Summary */}
                  <View style={styles.goalProgressSummary}>
                    <Text style={styles.progressSummaryTitle}>Goal Progress</Text>
                    <View style={styles.progressStats}>
                      <View style={styles.progressStat}>
                        <Text style={styles.progressStatValue}>
                          {numericalGoals.length > 0 ? numericalGoals.length : '0'}
                        </Text>
                        <Text style={styles.progressStatLabel}>Active Goals</Text>
                      </View>
                      <View style={styles.progressStat}>
                        <Text style={styles.progressStatValue}>
                          {numericalGoals.length > 0 
                            ? Math.round(numericalGoals.reduce((sum, goal) => sum + goal.progressPercentage, 0) / numericalGoals.length)
                            : 0}%
                        </Text>
                        <Text style={styles.progressStatLabel}>Avg Progress</Text>
                      </View>
                      <View style={styles.progressStat}>
                        <Text style={styles.progressStatValue}>
                          {numericalGoals.filter(goal => goal.progressPercentage >= 100).length}
                        </Text>
                        <Text style={styles.progressStatLabel}>Completed</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.goalsEmpty}>
                  <Ionicons name="flag-outline" size={48} color="#9ca3af" />
                  <Text style={styles.goalsEmptyText}>No goals set yet</Text>
                  <Text style={styles.goalsEmptySubtext}>
                    {onboardingData?.healthData ? 
                      'You have health data but no body type goal. Complete onboarding to set your goals.' :
                      'Complete onboarding to set your body type goal'
                    }
                  </Text>
                  <TouchableOpacity 
                    style={styles.setGoalsButton}
                    onPress={handleRerunOnboarding}
                  >
                    <Text style={styles.setGoalsButtonText}>
                      {onboardingData?.healthData ? 'Complete Goal Setup' : 'Set Your Goals'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.healthDataEmpty}>
            <Text style={styles.healthDataEmptyText}>No health data available</Text>
            <Text style={styles.healthDataEmptySubtext}>Tap to add your information</Text>
          </View>
        )}
      </MobileOptimizedCard>
    );
  };


  const TimezoneCard = () => {
    return (
      <MobileOptimizedCard
        variant="elevated"
        style={styles.preferencesCard}
      >
        <View style={styles.preferencesHeader}>
          <Ionicons name="globe-outline" size={24} color="#8b5cf6" />
          <Text style={styles.preferencesTitle}>Timezone Settings</Text>
        </View>
        
        <View style={styles.preferencesContent}>
          <TimezoneSelector
            currentTimezone={user?.timezone || 'UTC'}
            onTimezoneChange={(timezone) => updateUser({ timezone })}
          />
        </View>
      </MobileOptimizedCard>
    );
  };

  const PreferencesCard = () => {
    if (!onboardingData?.preferences) return null;

    const { notifications, reminders, dataSharing } = onboardingData.preferences;

    return (
      <MobileOptimizedCard
        variant="elevated"
        style={styles.preferencesCard}
        onPress={handleEditPreferences}
        hapticFeedback="medium"
      >
        <View style={styles.preferencesHeader}>
          <Ionicons name="settings-outline" size={24} color="#8b5cf6" />
          <Text style={styles.preferencesTitle}>Preferences</Text>
          <TouchableOpacity onPress={handleEditPreferences}>
            <Ionicons name="pencil" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.preferencesContent}>
          <View style={styles.preferenceRow}>
            <Text style={styles.preferenceLabel}>Notifications</Text>
            <Ionicons 
              name={notifications ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={notifications ? "#10b981" : "#ef4444"} 
            />
          </View>
          <View style={styles.preferenceRow}>
            <Text style={styles.preferenceLabel}>Reminders</Text>
            <Ionicons 
              name={reminders ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={reminders ? "#10b981" : "#ef4444"} 
            />
          </View>
          <View style={styles.preferenceRow}>
            <Text style={styles.preferenceLabel}>Data Sharing</Text>
            <Ionicons 
              name={dataSharing ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={dataSharing ? "#10b981" : "#ef4444"} 
            />
          </View>
        </View>
      </MobileOptimizedCard>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
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
      {/* User Info Header */}
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#6366f1" />
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{user?.full_name || user?.email?.split('@')[0] || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
        </View>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="pencil" size={20} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Rerun Onboarding - Prominent Button */}
      <View style={styles.section}>
        <View style={styles.prominentButton}>
          <ProfileItem
            icon="refresh-outline"
            title="Rerun Onboarding"
            subtitle="Choose a new body type goal"
            onPress={handleRerunOnboarding}
            color="#3b82f6"
          />
        </View>
      </View>

      {/* Onboarding Data Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Health Profile</Text>
        <HealthDataCard />
        <TimezoneCard />
        <PreferencesCard />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <ProfileItem
          icon="download-outline"
          title="Export Data"
          subtitle="Download your health data"
          onPress={() => {
            hapticFeedback.medium();
            showToast.info('Coming Soon', 'Data export will be available soon');
          }}
          color="#10b981"
        />
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        <ProfileItem
          icon="notifications-outline"
          title="Notifications"
          onPress={() => {
            hapticFeedback.light();
            showToast.info('Coming Soon', 'Notification settings will be available soon');
          }}
          color="#f59e0b"
        />
        <ProfileItem
          icon="moon-outline"
          title="Dark Mode"
          onPress={() => {
            hapticFeedback.light();
            showToast.info('Coming Soon', 'Dark mode will be available soon');
          }}
          color="#8b5cf6"
        />
        <ProfileItem
          icon="help-circle-outline"
          title="Help & Support"
          onPress={() => {
            hapticFeedback.light();
            showToast.info('Coming Soon', 'Help & support will be available soon');
          }}
          color="#6b7280"
        />
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <ProfileItem
          icon="log-out-outline"
          title="Logout"
          onPress={handleLogout}
          showArrow={false}
          color="#ef4444"
        />
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  profileItem: {
    marginBottom: 8,
  },
  profileItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  profileItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileItemText: {
    flex: 1,
  },
  profileItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  profileItemSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  healthDataCard: {
    marginBottom: 12,
  },
  healthDataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  healthDataTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  healthDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  healthDataSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  healthDataContent: {
    gap: 12,
  },
  healthDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthDataLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  healthDataValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  healthDataEmpty: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  healthDataEmptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  healthDataEmptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  goalsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  goalsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  goalsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  editGoalsButton: {
    padding: 4,
  },
  goalsActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  goalsContent: {
    gap: 12,
  },
  bodyTypeGoalCard: {
    marginBottom: 0,
  },
  bodyTypeGoalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bodyTypeGoalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bodyTypeGoalInfo: {
    flex: 1,
  },
  bodyTypeGoalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  bodyTypeGoalDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  goalProgressSummary: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  progressSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  progressStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  goalsDisplay: {
    marginTop: 12,
  },
  goalsGrid: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  goalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'right',
  },
  moreGoalsText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  goalsEmpty: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  goalsEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  goalsEmptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 16,
  },
  setGoalsButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  setGoalsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  numericalGoalsSection: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  numericalGoalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  numericalGoalsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  manageGoalsText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  goalsLoading: {
    padding: 20,
    alignItems: 'center',
  },
  goalsLoadingText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  numericalGoalsList: {
    gap: 12,
  },
  numericalGoalItem: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  goalItemInfo: {
    marginBottom: 8,
  },
  goalItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  goalItemProgress: {
    fontSize: 12,
    color: '#6b7280',
  },
  goalItemProgressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  goalItemProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  viewAllGoalsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 4,
  },
  viewAllGoalsText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
    marginRight: 4,
  },
  preferencesCard: {
    marginBottom: 12,
  },
  preferencesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  preferencesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 12,
    flex: 1,
  },
  preferencesContent: {
    gap: 12,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preferenceLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  bottomSpacing: {
    height: 20,
  },
  prominentButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    marginHorizontal: 0,
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
