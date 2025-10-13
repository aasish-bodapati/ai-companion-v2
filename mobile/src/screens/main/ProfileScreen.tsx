import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import { confirmationDialogConfigs } from '../../components/ui/ConfirmationDialog.utils';
import { profileService, UserProfile, HealthProfile } from '../../services/ProfileService';

import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '../../theme/constants';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showHealthEditModal, setShowHealthEditModal] = useState(false);
  const [editingHealthData, setEditingHealthData] = useState<HealthProfile>({
    age: '',
    height: '',
    weight: '',
    gender: '',
    activity_level: '',
    smm: '',
    body_fat_percentage: '',
    ffm: '',
    workout_days_per_week: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await profileService.getUserProfile();
      setProfile(profileData);
      if (profileData?.health_data) {
        setEditingHealthData(profileData.health_data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHealthData = async () => {
    try {
      setLoading(true);
      const updatedProfile = await profileService.updateUserProfile({
        ...profile,
        health_data: editingHealthData,
      });
      
      if (updatedProfile) {
        setProfile(updatedProfile);
        setShowHealthEditModal(false);
        Alert.alert('Success', 'Health data updated successfully!');
      }
    } catch (error) {
      console.error('Error updating health data:', error);
      Alert.alert('Error', 'Failed to update health data');
    } finally {
      setLoading(false);
    }
  };

  const ProfileItem = ({ icon, title, onPress, showArrow = true, subtitle }: {
    icon: string;
    title: string;
    onPress: () => void;
    showArrow?: boolean;
    subtitle?: string;
  }) => (
    <TouchableOpacity style={styles.profileItem} onPress={onPress}>
      <View style={styles.profileItemContent}>
        <View style={styles.profileItemIcon}>
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={24} color="#6366f1" />
        </View>
        <View style={styles.profileItemText}>
          <Text style={styles.profileItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.profileItemSubtitle}>{subtitle}</Text>}
        </View>
        {showArrow && (
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        )}
      </View>
    </TouchableOpacity>
  );

  const HealthDataItem = ({ label, value, unit }: {
    label: string;
    value: string | undefined;
    unit?: string;
  }) => (
    <View style={styles.healthDataItem}>
      <Text style={styles.healthDataLabel}>{label}</Text>
      <Text style={styles.healthDataValue}>
        {value ? `${value}${unit || ''}` : 'Not set'}
      </Text>
    </View>
  );

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const handleConfirmLogout = () => {
    logout();
    setShowLogoutDialog(false);
  };

  return (
    <ScrollView style={styles.container}>
      {/* User Info */}
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#6366f1" />
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{profile?.full_name || user?.full_name || 'User'}</Text>
          <Text style={styles.userEmail}>{profile?.email || user?.email || 'user@example.com'}</Text>
          {profile?.bodyTypeGoal && (
            <Text style={styles.userBodyTypeGoal}>
              Goal: {profile.bodyTypeGoal}
            </Text>
          )}
        </View>
      </View>

      {/* Health Data Section */}
      {profile?.health_data && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Health Data</Text>
            <TouchableOpacity 
              onPress={() => setShowHealthEditModal(true)}
              style={styles.editButton}
            >
              <Ionicons name="create-outline" size={20} color="#6366f1" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.healthDataContainer}>
            <HealthDataItem 
              label="Age" 
              value={profile.health_data.age} 
              unit=" years" 
            />
            <HealthDataItem 
              label="Height" 
              value={profile.health_data.height} 
              unit=" cm" 
            />
            <HealthDataItem 
              label="Weight" 
              value={profile.health_data.weight} 
              unit=" kg" 
            />
            <HealthDataItem 
              label="Gender" 
              value={profile.health_data.gender} 
            />
            <HealthDataItem 
              label="Activity Level" 
              value={profile.health_data.activity_level} 
            />
            <HealthDataItem 
              label="SMM" 
              value={profile.health_data.smm} 
              unit=" kg" 
            />
            <HealthDataItem 
              label="Body Fat %" 
              value={profile.health_data.body_fat_percentage} 
              unit="%" 
            />
            <HealthDataItem 
              label="FFM" 
              value={profile.health_data.ffm} 
              unit=" kg" 
            />
            <HealthDataItem 
              label="Workout Days/Week" 
              value={profile.health_data.workout_days_per_week} 
            />
          </View>
        </View>
      )}

      {/* Goals Section */}
      {profile?.goals && profile.goals.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goals</Text>
          {profile.goals.map((goal, index) => (
            <ProfileItem
              key={index}
              icon="flag-outline"
              title={goal}
              onPress={() => {}}
              showArrow={false}
            />
          ))}
        </View>
      )}

      {/* Profile Sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <ProfileItem
          icon="person-outline"
          title="Personal Information"
          onPress={() => {}}
        />
        <ProfileItem
          icon="lock-closed-outline"
          title="Change Password"
          onPress={() => {}}
        />
        <ProfileItem
          icon="notifications-outline"
          title="Notifications"
          onPress={() => {}}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        <ProfileItem
          icon="moon-outline"
          title="Dark Mode"
          onPress={() => {}}
        />
        <ProfileItem
          icon="language-outline"
          title="Language"
          onPress={() => {}}
        />
        <ProfileItem
          icon="help-circle-outline"
          title="Help & Support"
          onPress={() => {}}
        />
        <ProfileItem
          icon="information-circle-outline"
          title="About"
          onPress={() => {}}
        />
      </View>

      <View style={styles.section}>
        <ProfileItem
          icon="log-out-outline"
          title="Logout"
          onPress={handleLogout}
          showArrow={false}
        />
      </View>

      {/* Health Data Edit Modal */}
      <Modal
        visible={showHealthEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowHealthEditModal(false)}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Health Data</Text>
            <TouchableOpacity onPress={handleSaveHealthData} disabled={loading}>
              <Text style={[styles.modalSaveButton, loading && styles.modalSaveButtonDisabled]}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.textInput}
                value={editingHealthData.age}
                onChangeText={(text) => setEditingHealthData({...editingHealthData, age: text})}
                placeholder="Enter age"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Height (cm)</Text>
              <TextInput
                style={styles.textInput}
                value={editingHealthData.height}
                onChangeText={(text) => setEditingHealthData({...editingHealthData, height: text})}
                placeholder="Enter height in cm"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.textInput}
                value={editingHealthData.weight}
                onChangeText={(text) => setEditingHealthData({...editingHealthData, weight: text})}
                placeholder="Enter weight in kg"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gender</Text>
              <TextInput
                style={styles.textInput}
                value={editingHealthData.gender}
                onChangeText={(text) => setEditingHealthData({...editingHealthData, gender: text})}
                placeholder="Enter gender"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Activity Level</Text>
              <TextInput
                style={styles.textInput}
                value={editingHealthData.activity_level}
                onChangeText={(text) => setEditingHealthData({...editingHealthData, activity_level: text})}
                placeholder="Enter activity level"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>SMM (kg)</Text>
              <TextInput
                style={styles.textInput}
                value={editingHealthData.smm}
                onChangeText={(text) => setEditingHealthData({...editingHealthData, smm: text})}
                placeholder="Enter SMM in kg"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Body Fat %</Text>
              <TextInput
                style={styles.textInput}
                value={editingHealthData.body_fat_percentage}
                onChangeText={(text) => setEditingHealthData({...editingHealthData, body_fat_percentage: text})}
                placeholder="Enter body fat percentage"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FFM (kg)</Text>
              <TextInput
                style={styles.textInput}
                value={editingHealthData.ffm}
                onChangeText={(text) => setEditingHealthData({...editingHealthData, ffm: text})}
                placeholder="Enter FFM in kg"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Workout Days/Week</Text>
              <TextInput
                style={styles.textInput}
                value={editingHealthData.workout_days_per_week}
                onChangeText={(text) => setEditingHealthData({...editingHealthData, workout_days_per_week: text})}
                placeholder="Enter workout days per week"
                keyboardType="numeric"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      <ConfirmationDialog
        visible={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleConfirmLogout}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        variant="warning"
        confirmIcon="log-out-outline"
        cancelIcon="close-outline"
        {...confirmationDialogConfigs.logoutConfirmation}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e9d5ff', // More vibrant purple background for profile theme
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background.primary,
    marginBottom: 20,
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
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginHorizontal: 20,
  },
  profileItem: {
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  profileItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  profileItemIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.xxl,
    backgroundColor: COLORS.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileItemTitle: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text.primary,
  },
  profileItemText: {
    flex: 1,
  },
  profileItemSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  userBodyTypeGoal: {
    fontSize: FONT_SIZE.sm,
    color: '#6366f1',
    marginTop: 4,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginHorizontal: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: BORDER_RADIUS.md,
  },
  editButtonText: {
    fontSize: FONT_SIZE.sm,
    color: '#6366f1',
    marginLeft: 4,
    fontWeight: '500',
  },
  healthDataContainer: {
    backgroundColor: COLORS.background.primary,
    marginHorizontal: 20,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  healthDataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  healthDataLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  healthDataValue: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  modalCancelButton: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.text.secondary,
  },
  modalSaveButton: {
    fontSize: FONT_SIZE.lg,
    color: '#6366f1',
    fontWeight: '600',
  },
  modalSaveButtonDisabled: {
    color: COLORS.text.secondary,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background.primary,
  },
});
