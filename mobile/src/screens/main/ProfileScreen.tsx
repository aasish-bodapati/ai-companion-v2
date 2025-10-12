import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import { confirmationDialogConfigs } from '../../components/ui/ConfirmationDialog.utils';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const ProfileItem = ({ icon, title, onPress, showArrow = true }: {
    icon: string;
    title: string;
    onPress: () => void;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity style={styles.profileItem} onPress={onPress}>
      <View style={styles.profileItemContent}>
        <View style={styles.profileItemIcon}>
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={24} color="#6366f1" />
        </View>
        <Text style={styles.profileItemTitle}>{title}</Text>
        {showArrow && (
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        )}
      </View>
    </TouchableOpacity>
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
          <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
        </View>
      </View>

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
        <Text style={styles.sectionTitle}>Health & Wellness</Text>
        <ProfileItem
          icon="fitness-outline"
          title="Fitness Goals"
          onPress={() => {}}
        />
        <ProfileItem
          icon="nutrition-outline"
          title="Nutrition Preferences"
          onPress={() => {}}
        />
        <ProfileItem
          icon="analytics-outline"
          title="Health Analytics"
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
    padding: 20,
    backgroundColor: '#ffffff',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginHorizontal: 20,
  },
  profileItem: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  profileItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  profileItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileItemTitle: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
});
