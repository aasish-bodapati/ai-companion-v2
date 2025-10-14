import React, { useState, useEffect, useCallback } from 'react';
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
import { useUser } from '../../contexts/UserContext';
import { hapticFeedback } from '../../utils/haptics';
import { useToast } from '../../contexts/ToastContext';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import { confirmationDialogConfigs } from '../../components/ui/ConfirmationDialog.utils';
import MobileOptimizedCard from '../../components/ui/MobileOptimizedCard';

import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '../../theme/constants';

const { width: screenWidth } = Dimensions.get('window');

// Simple Health Overview Component
interface HealthData {
  height?: number;
  weight?: number;
  activity_level?: string;
}

const HealthOverview = ({ userData }: { userData: HealthData | undefined }) => {
  const calculateBMI = () => {
    const height = userData?.height;
    const weight = userData?.weight;
    if (!height || !weight) return null;
    const h = height / 100; // height is already a number
    const w = weight; // weight is already a number
    return h > 0 && w > 0 ? (w / (h * h)).toFixed(1) : null;
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: '#3b82f6', bgColor: '#eff6ff' };
    if (bmi < 22) return { category: 'Lean', color: '#10b981', bgColor: '#f0fdf4' };
    if (bmi < 25) return { category: 'Healthy', color: '#10b981', bgColor: '#f0fdf4' };
    if (bmi < 30) return { category: 'Overweight', color: '#f59e0b', bgColor: '#fffbeb' };
    return { category: 'Obese', color: '#ef4444', bgColor: '#fef2f2' };
  };

  const bmi = calculateBMI();
  const bmiInfo = bmi ? getBMICategory(parseFloat(bmi)) : null;

  return (
    <MobileOptimizedCard style={styles.healthCard}>
      <View style={styles.cardHeader}>
        <View style={styles.headerIconContainer}>
          <Ionicons name="fitness-outline" size={24} color="#3b82f6" />
        </View>
        <Text style={styles.cardTitle}>Health Overview</Text>
      </View>
      
      <View style={styles.healthGrid}>
        {/* BMI */}
        <View style={[styles.healthItem, bmiInfo && { backgroundColor: bmiInfo.bgColor }]}>
          <Text style={styles.healthValue}>{bmi || '--'}</Text>
          <Text style={styles.healthLabel}>BMI</Text>
          {bmiInfo && (
            <View style={[styles.categoryBadge, { backgroundColor: bmiInfo.color }]}>
              <Text style={styles.categoryBadgeText}>
                {bmiInfo.category}
              </Text>
            </View>
          )}
        </View>

        {/* Height */}
        <View style={styles.healthItem}>
          <Text style={styles.healthValue}>{userData?.height ? `${userData.height}cm` : '--'}</Text>
          <Text style={styles.healthLabel}>Height</Text>
        </View>

        {/* Weight */}
        <View style={styles.healthItem}>
          <Text style={styles.healthValue}>{userData?.weight ? `${userData.weight}kg` : '--'}</Text>
          <Text style={styles.healthLabel}>Weight</Text>
        </View>

        {/* Activity */}
        <View style={styles.healthItem}>
          <Text style={styles.healthValue}>
            {userData?.activity_level ? 
              userData.activity_level.charAt(0).toUpperCase() + 
              userData.activity_level.slice(1) : '--'}
          </Text>
          <Text style={styles.healthLabel}>Activity</Text>
        </View>
      </View>
    </MobileOptimizedCard>
  );
};

// Simple Goal Display Component
const GoalDisplay = ({ bodyTypeGoal, onEdit }: { 
  bodyTypeGoal: string; 
  onEdit: () => void;
}) => {
  return (
    <MobileOptimizedCard style={styles.goalCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.headerIconContainer, { backgroundColor: '#fef3c7' }]}>
          <Ionicons name="trophy-outline" size={24} color="#f59e0b" />
        </View>
        <Text style={styles.cardTitle}>Your Goal</Text>
        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
          <Ionicons name="create-outline" size={18} color="#3b82f6" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.goalContent}>
        <View style={styles.goalBadge}>
          <Text style={styles.goalName}>{bodyTypeGoal || 'Athletic'}</Text>
        </View>
        <Text style={styles.goalDescription}>
          Personalized based on your health data and activity level
        </Text>
      </View>
    </MobileOptimizedCard>
  );
};

// Simple Account Actions Component
const AccountActions = ({ 
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
        <View style={[styles.headerIconContainer, { backgroundColor: '#f1f5f9' }]}>
          <Ionicons name="person-outline" size={24} color="#6b7280" />
        </View>
        <Text style={styles.cardTitle}>Account</Text>
      </View>
      
      <View style={styles.accountActions}>
        <TouchableOpacity style={styles.accountAction} onPress={onRerunOnboarding}>
          <View style={[styles.actionIconContainer, { backgroundColor: '#eff6ff' }]}>
            <Ionicons name="refresh-outline" size={20} color="#3b82f6" />
          </View>
          <Text style={styles.accountActionText}>Redo Onboarding</Text>
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.accountAction} onPress={onLogout}>
          <View style={[styles.actionIconContainer, { backgroundColor: '#fffbeb' }]}>
            <Ionicons name="log-out-outline" size={20} color="#f59e0b" />
          </View>
          <Text style={styles.accountActionText}>Sign Out</Text>
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.accountAction, styles.dangerAction]} onPress={onDeleteAccount}>
          <View style={[styles.actionIconContainer, { backgroundColor: '#fef2f2' }]}>
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </View>
          <Text style={[styles.accountActionText, styles.dangerText]}>Delete Account</Text>
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
        </TouchableOpacity>
      </View>
    </MobileOptimizedCard>
  );
};

export default function SimpleProfileScreen() {
  const { user, logout, deleteAccount } = useAuth();
  const { profile, profileLoading, onboarding, rerunOnboarding, refreshProfile } = useUser();
  const { showToast } = useToast();
  
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);

  // Profile data is now managed by UserContext

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    hapticFeedback.light();
    await refreshProfile();
    setRefreshing(false);
  }, [refreshProfile]);

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

  if (profileLoading) {
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

        {/* Health Overview */}
        <HealthOverview userData={profile?.health_data} />

        {/* Goal Display */}
        <GoalDisplay 
          bodyTypeGoal={profile?.bodyTypeGoal || 'Athletic'}
          onEdit={handleRerunOnboarding}
        />

        {/* Account Actions */}
        <AccountActions
          onLogout={handleLogout}
          onRerunOnboarding={handleRerunOnboarding}
          onDeleteAccount={handleDeleteAccount}
        />

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Delete Account Dialog */}
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
    backgroundColor: '#f1f5f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 32,
    paddingVertical: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  userEmail: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  
  // Card Styles
  healthCard: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  goalCard: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  accountCard: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  
  // Card Header
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginLeft: 12,
    letterSpacing: -0.3,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  
  // Health Overview
  healthGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  healthItem: {
    width: (screenWidth - 60) / 4, // Fixed width for 4 items
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    minHeight: 70,
  },
  healthValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  healthLabel: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 1,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  healthCategory: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryBadge: {
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 1,
  },
  categoryBadgeText: {
    fontSize: 7,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.1,
  },
  
  // Goal Display
  goalContent: {
    gap: 16,
  },
  goalBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbbf24',
    alignSelf: 'flex-start',
  },
  goalName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#92400e',
    letterSpacing: -0.3,
  },
  goalDescription: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
    fontWeight: '500',
  },
  
  // Account Actions
  accountActions: {
    gap: 4,
  },
  accountAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerAction: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  accountActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
    marginLeft: 16,
  },
  dangerText: {
    color: '#dc2626',
  },
  
  bottomSpacing: {
    height: 32,
  },
});
