import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, TouchableOpacity, StyleSheet, Text } from 'react-native';

import DashboardScreen from '../screens/main/DashboardScreen';
import FitnessScreen from '../screens/main/FitnessScreen';
import NutritionScreen from '../screens/main/NutritionScreen';
// import AnalyticsScreen from '../screens/main/AnalyticsScreen'; // REMOVED
import SimpleProfileScreen from '../screens/main/SimpleProfileScreen';
// Removed MigrationScreen import
import QuickAddModal from '../components/common/QuickAddModal';
import SmartWorkoutLogger from '../components/fitness/SmartWorkoutLogger';
import UnifiedNutritionLogger from '../components/nutrition/UnifiedNutritionLogger';

export type TabParamList = {
  Dashboard: undefined;
  Fitness: undefined;
  Nutrition: undefined;
  // Analytics: undefined; // REMOVED
  Profile: undefined;
  // Removed Migration tab
};

const Tab = createBottomTabNavigator<TabParamList>();

// Custom tab bar with floating plus button
function CustomTabBar({ state, descriptors, navigation }: Record<string, unknown>) {
  const [showLogWorkoutModal, setShowLogWorkoutModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [showLogMealModal, setShowLogMealModal] = useState(false);

  return (
    <>
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          {state.routes.map((route: Record<string, unknown>, index: number) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            let iconName: keyof typeof Ionicons.glyphMap;
            if (route.name === 'Dashboard') {
              iconName = isFocused ? 'home' : 'home-outline';
            } else if (route.name === 'Fitness') {
              iconName = isFocused ? 'fitness' : 'fitness-outline';
            } else if (route.name === 'Nutrition') {
              iconName = isFocused ? 'nutrition' : 'nutrition-outline';
            } else if (route.name === 'Profile') {
              iconName = isFocused ? 'person' : 'person-outline';
            } else {
              iconName = 'help-outline';
            }

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabItem}
              >
                <Ionicons
                  name={iconName}
                  size={24}
                  color={isFocused ? '#6366f1' : '#6b7280'}
                />
                <Text style={[styles.tabLabel, isFocused && styles.tabLabelFocused]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Floating Plus Button */}
        <TouchableOpacity
          style={styles.plusButton}
          onPress={() => setShowQuickAddModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Quick Add Modal */}
      <QuickAddModal
        visible={showQuickAddModal}
        onClose={() => setShowQuickAddModal(false)}
        onLogWorkout={() => setShowLogWorkoutModal(true)}
        onLogMeal={() => setShowLogMealModal(true)}
      />

      {/* Smart Workout Logger */}
      <SmartWorkoutLogger
        visible={showLogWorkoutModal}
        onClose={() => setShowLogWorkoutModal(false)}
        onSave={(workout) => {
          // Handle workout saving here
          console.log('Workout saved:', workout);
          setShowLogWorkoutModal(false);
        }}
      />

      {/* Log Meal Modal */}
      <UnifiedNutritionLogger
        visible={showLogMealModal}
        onClose={() => setShowLogMealModal(false)}
        onMealLogged={() => {
          setShowLogMealModal(false);
        }}
      />
    </>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6366f1',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Fitness"
        component={FitnessScreen}
        options={{ title: 'Fitness' }}
      />
      <Tab.Screen
        name="Nutrition"
        component={NutritionScreen}
        options={{ title: 'Nutrition' }}
      />
      {/* Analytics tab removed */}
      <Tab.Screen
        name="Profile"
        component={SimpleProfileScreen}
        options={{ title: 'Profile' }}
      />
      {/* Removed Migration tab */}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'relative',
    backgroundColor: '#ffffff',
    borderTopColor: '#e5e7eb',
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 5,
    paddingTop: 5,
    height: Platform.OS === 'ios' ? 90 : 65,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    flex: 1,
    paddingHorizontal: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 3,
    textAlign: 'center',
  },
  tabLabelFocused: {
    color: '#6366f1',
  },
  plusButton: {
    position: 'absolute',
    top: -70,
    right: 25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
});
