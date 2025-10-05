/**
 * Real-World Migration Example
 * Shows how to migrate an actual component from the codebase
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isFeatureEnabled } from '../config/featureFlags';
import { createLoadingState } from '../utils/duplicateCodeUtils';
import { DUPLICATE_STYLES } from '../theme/duplicateStyles';
import { MigrationHelpers } from '../utils/migrationHelpers';
import { DebugUtils } from '../utils/debugUtils';

// ORIGINAL COMPONENT (Before Migration)
const OriginalWaterLoggingCard = () => {
  const [loading, setLoading] = useState(false);
  const [waterIntake, setWaterIntake] = useState(0);
  const [waterGoal, setWaterGoal] = useState(2000);

  const handleAddWater = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setWaterIntake(prev => prev + 250);
      console.log('Water added successfully');
    } catch (error) {
      console.error('Error adding water:', error);
    } finally {
      setLoading(false);
    }
  };

  const progress = (waterIntake / waterGoal) * 100;

  return (
    <View style={styles.originalContainer}>
      <Text style={styles.originalTitle}>Water Intake</Text>
      <View style={styles.originalProgressContainer}>
        <View style={styles.originalProgressBar}>
          <View 
            style={[
              styles.originalProgressFill, 
              { width: `${Math.min(progress, 100)}%` }
            ]} 
          />
        </View>
        <Text style={styles.originalProgressText}>
          {waterIntake}ml / {waterGoal}ml ({Math.round(progress)}%)
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.originalButton} 
        onPress={handleAddWater}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.originalButtonText}>Add 250ml</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

// MIGRATED COMPONENT (After Migration)
const MigratedWaterLoggingCard = () => {
  const { loading, withLoading } = createLoadingState();
  const [waterIntake, setWaterIntake] = useState(0);
  const [waterGoal, setWaterGoal] = useState(2000);

  const handleAddWater = () => withLoading(async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setWaterIntake(prev => prev + 250);
    DebugUtils.log('Water added successfully');
  });

  const progress = (waterIntake / waterGoal) * 100;

  return (
    <View style={styles.migratedContainer}>
      <Text style={styles.migratedTitle}>Water Intake</Text>
      <View style={styles.migratedProgressContainer}>
        <View style={styles.migratedProgressBar}>
          <View 
            style={[
              styles.migratedProgressFill, 
              { width: `${Math.min(progress, 100)}%` }
            ]} 
          />
        </View>
        <Text style={styles.migratedProgressText}>
          {waterIntake}ml / {waterGoal}ml ({Math.round(progress)}%)
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.migratedButton} 
        onPress={handleAddWater}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.migratedButtonText}>Add 250ml</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

// GRADUAL MIGRATION COMPONENT (Using Migration Helpers)
const GradualMigrationWaterLoggingCard = () => {
  const [loading, setLoading] = useState(false);
  const [waterIntake, setWaterIntake] = useState(0);
  const [waterGoal, setWaterGoal] = useState(2000);

  const handleAddWater = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setWaterIntake(prev => prev + 250);
      
      // Use migration helper for console.log
      MigrationHelpers.replaceConsoleLog('Water added successfully');
    } catch (error) {
      // Use migration helper for error handling
      MigrationHelpers.replaceErrorHandling(error, 'GradualMigrationWaterLoggingCard');
    } finally {
      setLoading(false);
    }
  };

  const progress = (waterIntake / waterGoal) * 100;

  return (
    <View style={MigrationHelpers.replaceStyle(styles.originalContainer, styles.migratedContainer)}>
      <Text style={MigrationHelpers.replaceStyle(styles.originalTitle, styles.migratedTitle)}>
        Water Intake (Gradual Migration)
      </Text>
      <View style={MigrationHelpers.replaceStyle(styles.originalProgressContainer, styles.migratedProgressContainer)}>
        <View style={MigrationHelpers.replaceStyle(styles.originalProgressBar, styles.migratedProgressBar)}>
          <View 
            style={[
              MigrationHelpers.replaceStyle(styles.originalProgressFill, styles.migratedProgressFill), 
              { width: `${Math.min(progress, 100)}%` }
            ]} 
          />
        </View>
        <Text style={MigrationHelpers.replaceStyle(styles.originalProgressText, styles.migratedProgressText)}>
          {waterIntake}ml / {waterGoal}ml ({Math.round(progress)}%)
        </Text>
      </View>
      
      <TouchableOpacity 
        style={MigrationHelpers.replaceStyle(styles.originalButton, styles.migratedButton)} 
        onPress={handleAddWater}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            <Ionicons name="add" size={20} color="white" />
            <Text style={MigrationHelpers.replaceStyle(styles.originalButtonText, styles.migratedButtonText)}>
              Add 250ml
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

// MAIN DEMO COMPONENT
export const RealWorldMigrationExample = () => {
  const [showMigrated, setShowMigrated] = useState(false);
  const [showGradual, setShowGradual] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Real-World Migration Example</Text>
      
      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.toggleButton, showMigrated && styles.toggleButtonActive]}
          onPress={() => setShowMigrated(!showMigrated)}
        >
          <Text style={[styles.toggleButtonText, showMigrated && styles.toggleButtonTextActive]}>
            Show Migrated
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toggleButton, showGradual && styles.toggleButtonActive]}
          onPress={() => setShowGradual(!showGradual)}
        >
          <Text style={[styles.toggleButtonText, showGradual && styles.toggleButtonTextActive]}>
            Show Gradual
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Original Component</Text>
        <OriginalWaterLoggingCard />
        
        {showMigrated && (
          <>
            <Text style={styles.exampleTitle}>Migrated Component</Text>
            <MigratedWaterLoggingCard />
          </>
        )}
        
        {showGradual && (
          <>
            <Text style={styles.exampleTitle}>Gradual Migration</Text>
            <GradualMigrationWaterLoggingCard />
          </>
        )}
      </View>

      <View style={styles.comparisonContainer}>
        <Text style={styles.comparisonTitle}>Migration Benefits:</Text>
        <View style={styles.benefitItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.benefitText}>Reduced code duplication</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.benefitText}>Consistent error handling</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.benefitText}>Centralized loading state</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.benefitText}>Better debugging with DebugUtils</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.benefitText}>Style constants instead of hardcoded values</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1f2937',
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#3b82f6',
  },
  toggleButtonText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: 'white',
  },
  exampleContainer: {
    gap: 20,
  },
  exampleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 10,
  },
  
  // Original component styles (hardcoded)
  originalContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  originalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  originalProgressContainer: {
    marginBottom: 16,
  },
  originalProgressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  originalProgressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  originalProgressText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  originalButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  originalButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  
  // Migrated component styles (using constants)
  migratedContainer: {
    backgroundColor: DUPLICATE_STYLES.BACKGROUND_WHITE,
    padding: DUPLICATE_STYLES.PADDING_HORIZONTAL_20,
    borderRadius: DUPLICATE_STYLES.BORDER_RADIUS_12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  migratedTitle: {
    fontSize: DUPLICATE_STYLES.FONT_SIZE_18,
    fontWeight: '600',
    color: DUPLICATE_STYLES.COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  migratedProgressContainer: {
    marginBottom: 16,
  },
  migratedProgressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  migratedProgressFill: {
    height: '100%',
    backgroundColor: DUPLICATE_STYLES.COLORS.PRIMARY,
    borderRadius: 4,
  },
  migratedProgressText: {
    fontSize: 14,
    color: DUPLICATE_STYLES.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  migratedButton: {
    backgroundColor: DUPLICATE_STYLES.COLORS.PRIMARY,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  migratedButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  
  // Comparison section
  comparisonContainer: {
    marginTop: 30,
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1e40af',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#1e40af',
  },
});

export default RealWorldMigrationExample;
