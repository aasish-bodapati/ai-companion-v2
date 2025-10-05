/**
 * Migration Examples
 * Shows how to gradually migrate from old components to new unified components
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { isFeatureEnabled } from '../config/featureFlags';
import { createLoadingState } from '../utils/duplicateCodeUtils';
import { DUPLICATE_STYLES } from '../theme/duplicateStyles';
import { MigrationHelpers } from '../utils/migrationHelpers';
import { DebugUtils } from '../utils/debugUtils';

// OLD: Using hardcoded styles
const OldComponentExample = () => {
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Action completed');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.oldContainer}>
      <Text style={styles.oldTitle}>Old Component</Text>
      {loading && <Text>Loading...</Text>}
      <TouchableOpacity style={styles.oldButton} onPress={handleAction}>
        <Text style={styles.oldButtonText}>Old Action</Text>
      </TouchableOpacity>
    </View>
  );
};

// NEW: Using new utilities (with feature flags)
const NewComponentExample = () => {
  const { loading, withLoading } = createLoadingState();

  const handleAction = () => withLoading(async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    DebugUtils.log('Action completed');
  });

  return (
    <View style={styles.newContainer}>
      <Text style={styles.newTitle}>New Component</Text>
      {loading && <Text>Loading...</Text>}
      <TouchableOpacity style={styles.newButton} onPress={handleAction}>
        <Text style={styles.newButtonText}>New Action</Text>
      </TouchableOpacity>
    </View>
  );
};

// MIGRATION: Gradual migration using helpers
const MigrationComponentExample = () => {
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Use migration helper for console.log
      MigrationHelpers.replaceConsoleLog('Action completed');
    } catch (error) {
      // Use migration helper for error handling
      MigrationHelpers.replaceErrorHandling(error, 'MigrationComponentExample');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={MigrationHelpers.replaceStyle(styles.oldContainer, styles.newContainer)}>
      <Text style={MigrationHelpers.replaceStyle(styles.oldTitle, styles.newTitle)}>
        Migration Component
      </Text>
      {loading && <Text>Loading...</Text>}
      <TouchableOpacity 
        style={MigrationHelpers.replaceStyle(styles.oldButton, styles.newButton)} 
        onPress={handleAction}
      >
        <Text style={MigrationHelpers.replaceStyle(styles.oldButtonText, styles.newButtonText)}>
          Migration Action
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// STYLE MIGRATION: Using style constants
const StyleMigrationExample = () => {
  return (
    <View style={styles.styleMigrationContainer}>
      <Text style={styles.styleMigrationTitle}>Style Migration Example</Text>
      <Text style={styles.styleMigrationText}>
        This component uses style constants instead of hardcoded values
      </Text>
    </View>
  );
};

// MAIN EXAMPLE COMPONENT
export const MigrationExamples = () => {
  const [showNewComponents, setShowNewComponents] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Migration Examples</Text>
      
      <TouchableOpacity 
        style={styles.toggleButton}
        onPress={() => setShowNewComponents(!showNewComponents)}
      >
        <Text style={styles.toggleButtonText}>
          {showNewComponents ? 'Show Old Components' : 'Show New Components'}
        </Text>
      </TouchableOpacity>

      <View style={styles.examplesContainer}>
        <OldComponentExample />
        
        {showNewComponents && (
          <>
            <NewComponentExample />
            <MigrationComponentExample />
            <StyleMigrationExample />
          </>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Migration Strategy:</Text>
        <Text style={styles.infoText}>
          1. Start with new components only (feature flags disabled)
        </Text>
        <Text style={styles.infoText}>
          2. Enable feature flags gradually
        </Text>
        <Text style={styles.infoText}>
          3. Use migration helpers for existing components
        </Text>
        <Text style={styles.infoText}>
          4. Replace old components once new ones are proven
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  toggleButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  toggleButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  examplesContainer: {
    gap: 20,
  },
  
  // Old component styles (hardcoded)
  oldContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  oldTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  oldButton: {
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  oldButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // New component styles (using constants)
  newContainer: {
    backgroundColor: DUPLICATE_STYLES.BACKGROUND_WHITE,
    padding: DUPLICATE_STYLES.PADDING_HORIZONTAL_20,
    borderRadius: DUPLICATE_STYLES.BORDER_RADIUS_8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  newTitle: {
    fontSize: DUPLICATE_STYLES.FONT_SIZE_18,
    fontWeight: '600',
    marginBottom: 8,
  },
  newButton: {
    backgroundColor: DUPLICATE_STYLES.COLORS.SUCCESS,
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  newButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Style migration example
  styleMigrationContainer: {
    ...DUPLICATE_STYLES.CARD_STYLE,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  styleMigrationTitle: {
    ...DUPLICATE_STYLES.SECTION_TITLE_STYLE,
    marginBottom: 8,
  },
  styleMigrationText: {
    fontSize: DUPLICATE_STYLES.FONT_SIZE_14,
    color: DUPLICATE_STYLES.COLORS.TEXT_SECONDARY,
  },
  
  // Info section
  infoContainer: {
    marginTop: 30,
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1e40af',
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 4,
  },
});

export default MigrationExamples;
