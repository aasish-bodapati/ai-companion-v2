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
import { useAuth } from '../../contexts/AuthContext';
import MobileOptimizedCard from '../../components/ui/MobileOptimizedCard';
import TouchOptimizedButton from '../../components/ui/TouchOptimizedButton';
import EditGoalsModal from '../../components/profile/EditGoalsModal';
import EditPreferencesModal from '../../components/profile/EditPreferencesModal';
import TimezoneSelector from '../../components/profile/TimezoneSelector';
import { onboardingService, OnboardingData, HealthData } from '../../services/onboardingService';
import { profileService, UserProfile } from '../../services/profileService';
import { hapticFeedback } from '../../utils/haptics';
import { showToast } from '../../utils/toast';

export default function EnhancedProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  const loadOnboardingData = useCallback(async () => {
    try {
      console.log('📝 ProfileScreen: Loading profile data from backend...');
      
      // First try to get data from backend
      const profileData = await profileService.getUserProfile();
      
      if (profileData) {
        console.log('📝 ProfileScreen: Got profile data from backend:', profileData);
        const onboardingData = profileService.convertToOnboardingData(profileData);
        setOnboardingData(onboardingData);
        
        // Also save to local storage for offline access
        await onboardingService.saveOnboardingData(onboardingData);
      } else {
        // Fallback to local data
        console.log('📝 ProfileScreen: No backend data, trying local storage...');
        let data = await onboardingService.loadOnboardingData();
        
        if (!data) {
          console.log('📝 ProfileScreen: No local data either, creating sample data...');
          data = {
            healthData: {
              age: '25',
              height: '175',
              weight: '70',
              gender: 'male',
              activityLevel: 'moderate',
            },
            goals: ['Weight Loss', 'Better Health', 'Improved Fitness'],
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
    } catch (error) {
      console.error('Failed to load profile data:', error);
      showToast.error('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    hapticFeedback.light();
    await loadOnboardingData();
    setRefreshing(false);
  }, [loadOnboardingData]);

  useEffect(() => {
    loadOnboardingData();
  }, [loadOnboardingData]);

  useEffect(() => {
    console.log('🔍 ProfileScreen user data:', user);
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
    console.log('📝 ProfileScreen: Opening preferences modal with data:', onboardingData);
    setShowPreferencesModal(true);
  };

  const handleEditGoals = () => {
    hapticFeedback.medium();
    setShowGoalsModal(true);
  };

  const handleEditPreferences = () => {
    hapticFeedback.medium();
    // Navigate to preferences editing screen
    showToast.info('Coming Soon', 'Preferences editing will be available soon');
  };


  const handleGoalsSave = (goals: string[]) => {
    setOnboardingData(prev => prev ? { ...prev, goals } : null);
    setShowGoalsModal(false);
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
        console.log('📝 ProfileScreen: Successfully updated backend profile');
        showToast.success('Success', 'Preferences updated successfully');
      } else {
        console.log('📝 ProfileScreen: Failed to update backend, but local data saved');
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

  const GoalsCard = () => {
    if (!onboardingData?.goals) return null;

    const goals = onboardingData.goals;
    const hasGoals = goals.length > 0;

    return (
      <MobileOptimizedCard
        variant="elevated"
        style={styles.goalsCard}
        onPress={handleEditGoals}
        hapticFeedback="medium"
      >
        <View style={styles.goalsHeader}>
          <Ionicons name="flag-outline" size={24} color="#f59e0b" />
          <Text style={styles.goalsTitle}>Health Goals</Text>
          <TouchableOpacity onPress={handleEditGoals}>
            <Ionicons name="pencil" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
        
        {hasGoals ? (
          <View style={styles.goalsContent}>
            <Text style={styles.goalsCount}>{goals.length} goal{goals.length !== 1 ? 's' : ''} selected</Text>
            <View style={styles.goalsList}>
              {goals.slice(0, 3).map((goal, index) => (
                <View key={index} style={styles.goalItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.goalText}>{goal.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
                </View>
              ))}
              {goals.length > 3 && (
                <Text style={styles.moreGoalsText}>+{goals.length - 3} more</Text>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.goalsEmpty}>
            <Text style={styles.goalsEmptyText}>No goals set</Text>
            <Text style={styles.goalsEmptySubtext}>Tap to set your health goals</Text>
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

      {/* Onboarding Data Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Health Profile</Text>
        <HealthDataCard />
        <GoalsCard />
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
      <EditGoalsModal
        visible={showGoalsModal}
        onClose={() => setShowGoalsModal(false)}
        onSave={handleGoalsSave}
        initialGoals={onboardingData?.goals}
      />

      <EditPreferencesModal
        visible={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        onSave={handlePreferencesSave}
        initialData={onboardingData}
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
  goalsCard: {
    marginBottom: 12,
  },
  goalsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 12,
    flex: 1,
  },
  goalsContent: {
    gap: 12,
  },
  goalsCount: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  goalsList: {
    gap: 8,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalText: {
    fontSize: 14,
    color: '#1f2937',
    marginLeft: 8,
  },
  moreGoalsText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  goalsEmpty: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  goalsEmptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  goalsEmptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
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
});
