#!/usr/bin/env node

/**
 * Fix Remaining Import Issues
 * Fixes the remaining import casing issues
 */

const fs = require('fs');
const path = require('path');

// Specific files and their import fixes
const specificFixes = [
  {
    file: 'src/components/ai/AIInsightsCard.tsx',
    fixes: [
      { from: "from '../../services/aiInsightsService'", to: "from '../../services/AiInsightsService'" }
    ]
  },
  {
    file: 'src/components/bodyType/BodyTypeProgressCard.tsx',
    fixes: [
      { from: "from '../../services/bodyTypeGoals'", to: "from '../../services/BodyTypeGoalsService'" },
      { from: "from '../../services/profileService'", to: "from '../../services/ProfileService'" }
    ]
  },
  {
    file: 'mobile/src/components/bodyType/BodyTypeProgressDashboard.tsx',
    fixes: [
      { from: "from '../../services/bodyTypeGoals'", to: "from '../../services/BodyTypeGoalsService'" },
      { from: "from '../../services/bodyTypeScoringService'", to: "from '../../services/BodyTypeScoringService'" }
    ]
  },
  {
    file: 'mobile/src/components/bodyType/BodyTypeScoringDashboard.tsx',
    fixes: [
      { from: "from '../../services/bodyTypeScoringService'", to: "from '../../services/BodyTypeScoringService'" },
      { from: "from '../../services/bodyTypeGoals'", to: "from '../../services/BodyTypeGoalsService'" }
    ]
  },
  {
    file: 'mobile/src/components/bodyType/ScoringCard.tsx',
    fixes: [
      { from: "from '../../services/bodyTypeScoringService'", to: "from '../../services/BodyTypeScoringService'" }
    ]
  },
  {
    file: 'mobile/src/components/dashboard/WelcomeCard.tsx',
    fixes: [
      { from: "from '../../services/weatherService'", to: "from '../../services/WeatherService'" }
    ]
  },
  {
    file: 'mobile/src/components/debug/NetworkTest.tsx',
    fixes: [
      { from: "from '../../services/api'", to: "from '../../services/ApiService'" }
    ]
  },
  {
    file: 'mobile/src/components/fitness/ExerciseDropdown.tsx',
    fixes: [
      { from: "from '../../services/fitnessService'", to: "from '../../services/FitnessService'" }
    ]
  },
  {
    file: 'mobile/src/components/fitness/RoutineDetailsModal.tsx',
    fixes: [
      { from: "from '../../services/routineService'", to: "from '../../services/RoutineService'" }
    ]
  },
  {
    file: 'mobile/src/components/fitness/SimpleFitnessLogs.tsx',
    fixes: [
      { from: "from '../../services/fitnessService'", to: "from '../../services/FitnessService'" },
      { from: "from '../../services/exerciseCategoryService'", to: "from '../../services/ExerciseCategoryService'" }
    ]
  },
  {
    file: 'mobile/src/components/fitness/SimpleRoutineDisplay.tsx',
    fixes: [
      { from: "from '../../services/routineService'", to: "from '../../services/RoutineService'" }
    ]
  },
  {
    file: 'mobile/src/components/fitness/UnifiedWorkoutLogger.tsx',
    fixes: [
      { from: "from '../../services/fitnessService'", to: "from '../../services/FitnessService'" }
    ]
  },
  {
    file: 'mobile/src/components/fitness/WorkoutLoggingModal.tsx',
    fixes: [
      { from: "from '../../services/fitnessService'", to: "from '../../services/FitnessService'" }
    ]
  },
  {
    file: 'mobile/src/components/health/MoodLoggingCard.tsx',
    fixes: [
      { from: "from '../../services/moodService'", to: "from '../../services/MoodService'" }
    ]
  },
  {
    file: 'mobile/src/components/health/WaterLogger.tsx',
    fixes: [
      { from: "from '../../services/simpleWaterService'", to: "from '../../services/SimpleWaterService'" }
    ]
  },
  {
    file: 'mobile/src/components/nutrition/NutritionLogsView.tsx',
    fixes: [
      { from: "from '../../services/nutritionService'", to: "from '../../services/NutritionService'" }
    ]
  },
  {
    file: 'mobile/src/components/nutrition/NutritionOverviewDashboard.tsx',
    fixes: [
      { from: "from '../../services/nutritionService'", to: "from '../../services/NutritionService'" },
      { from: "from '../../services/nutritionGoalsService'", to: "from '../../services/NutritionGoalsService'" }
    ]
  },
  {
    file: 'mobile/src/components/nutrition/UnifiedNutritionLogger.tsx',
    fixes: [
      { from: "from '../../services/nutritionService'", to: "from '../../services/NutritionService'" }
    ]
  },
  {
    file: 'mobile/src/components/onboarding/BodyTypeGoalsStep.tsx',
    fixes: [
      { from: "from '../../services/bodyTypeGoals'", to: "from '../../services/BodyTypeGoalsService'" }
    ]
  },
  {
    file: 'mobile/src/components/profile/EditGoalsModal.tsx',
    fixes: [
      { from: "from '../../services/onboardingService'", to: "from '../../services/OnboardingService'" }
    ]
  },
  {
    file: 'mobile/src/components/profile/EditHealthDataModal.tsx',
    fixes: [
      { from: "from '../../services/onboardingService'", to: "from '../../services/OnboardingService'" }
    ]
  },
  {
    file: 'mobile/src/components/profile/EditPreferencesModal.tsx',
    fixes: [
      { from: "from '../../services/onboardingService'", to: "from '../../services/OnboardingService'" }
    ]
  },
  {
    file: 'mobile/src/components/profile/NumericalGoalsModal.tsx',
    fixes: [
      { from: "from '../../services/goalTemplates'", to: "from '../../services/GoalTemplatesService'" }
    ]
  },
  {
    file: 'mobile/src/components/profile/TimezoneSelector.tsx',
    fixes: [
      { from: "from '../../services/api'", to: "from '../../services/ApiService'" }
    ]
  },
  {
    file: 'mobile/src/components/routines/ComprehensiveRoutineModal.tsx',
    fixes: [
      { from: "from '../../services/routineService'", to: "from '../../services/RoutineService'" },
      { from: "from '../../services/api'", to: "from '../../services/ApiService'" }
    ]
  },
  {
    file: 'mobile/src/components/routines/EditRoutineModal.tsx',
    fixes: [
      { from: "from '../../services/routineService'", to: "from '../../services/RoutineService'" },
      { from: "from '../../services/api'", to: "from '../../services/ApiService'" }
    ]
  },
  {
    file: 'mobile/src/components/routines/RoutineProgressTracker.tsx',
    fixes: [
      { from: "from '../../services/routineService'", to: "from '../../services/RoutineService'" }
    ]
  },
  {
    file: 'mobile/src/components/weather/WeatherDetailsModal.tsx',
    fixes: [
      { from: "from '../../services/weatherService'", to: "from '../../services/WeatherService'" }
    ]
  },
  {
    file: 'mobile/src/components/workout/LogTodaysWorkoutModal.tsx',
    fixes: [
      { from: "from '../../services/routineService'", to: "from '../../services/RoutineService'" },
      { from: "from '../../services/fitnessService'", to: "from '../../services/FitnessService'" }
    ]
  },
  {
    file: 'mobile/src/contexts/AuthContext.tsx',
    fixes: [
      { from: "from '../services/api'", to: "from '../services/ApiService'" }
    ]
  },
  {
    file: 'mobile/src/hooks/useActiveRoutine.ts',
    fixes: [
      { from: "from '../services/routineService'", to: "from '../services/RoutineService'" }
    ]
  },
  {
    file: 'mobile/src/hooks/useBodyTypeGoalMetrics.ts',
    fixes: [
      { from: "from '../services/nutritionService'", to: "from '../services/NutritionService'" },
      { from: "from '../services/fitnessService'", to: "from '../services/FitnessService'" },
      { from: "from '../services/simpleWaterService'", to: "from '../services/SimpleWaterService'" },
      { from: "from '../services/stepTrackingService'", to: "from '../services/StepTrackingService'" }
    ]
  },
  {
    file: 'mobile/src/hooks/useBodyTypeScoring.ts',
    fixes: [
      { from: "from '../services/bodyTypeScoringService'", to: "from '../services/BodyTypeScoringService'" },
      { from: "from '../services/bodyTypeGoals'", to: "from '../services/BodyTypeGoalsService'" }
    ]
  },
  {
    file: 'mobile/src/hooks/useStepsTracking.ts',
    fixes: [
      { from: "from '../services/stepTrackingService'", to: "from '../services/StepTrackingService'" }
    ]
  },
  {
    file: 'mobile/src/hooks/useTodaysWorkout.ts',
    fixes: [
      { from: "from '../services/routineService'", to: "from '../services/RoutineService'" }
    ]
  },
  {
    file: 'mobile/src/hooks/useWeather.ts',
    fixes: [
      { from: "from '../services/weatherService'", to: "from '../services/WeatherService'" }
    ]
  },
  {
    file: 'mobile/src/hooks/useWeeklyActivity.ts',
    fixes: [
      { from: "from '../services/fitnessService'", to: "from '../services/FitnessService'" }
    ]
  },
  {
    file: 'mobile/src/screens/HomeScreen.tsx',
    fixes: [
      { from: "from '../services/healthService'", to: "from '../services/HealthService'" }
    ]
  },
  {
    file: 'mobile/src/screens/bodyType/BodyTypeDashboardScreen.tsx',
    fixes: [
      { from: "from '../../services/bodyTypeGoals'", to: "from '../../services/BodyTypeGoalsService'" },
      { from: "from '../../services/bodyTypeScoringService'", to: "from '../../services/BodyTypeScoringService'" },
      { from: "from '../../services/profileService'", to: "from '../../services/ProfileService'" }
    ]
  },
  {
    file: 'mobile/src/screens/main/EnhancedProfileScreen.tsx',
    fixes: [
      { from: "from '../../services/onboardingService'", to: "from '../../services/OnboardingService'" },
      { from: "from '../../services/profileService'", to: "from '../../services/ProfileService'" },
      { from: "from '../../services/numericalGoalsService'", to: "from '../../services/NumericalGoalsService'" },
      { from: "from '../../services/bodyTypeGoals'", to: "from '../../services/BodyTypeGoalsService'" }
    ]
  },
  {
    file: 'mobile/src/screens/main/FitnessScreen.tsx',
    fixes: [
      { from: "from '../../services/routineService'", to: "from '../../services/RoutineService'" }
    ]
  },
  {
    file: 'mobile/src/screens/main/NutritionScreen.tsx',
    fixes: [
      { from: "from '../../services/nutritionService'", to: "from '../../services/NutritionService'" }
    ]
  },
  {
    file: 'mobile/src/screens/onboarding/EnhancedOnboardingScreen.tsx',
    fixes: [
      { from: "from '../../services/profileService'", to: "from '../../services/ProfileService'" }
    ]
  },
  {
    file: 'mobile/src/stores/appStore.ts',
    fixes: [
      { from: "from '../services/dashboardService'", to: "from '../services/DashboardService'" },
      { from: "from '../services/stepTrackingService'", to: "from '../services/StepTrackingService'" }
    ]
  },
  {
    file: 'mobile/src/stores/exerciseCategoriesStore.ts',
    fixes: [
      { from: "from '../services/exerciseCategoryService'", to: "from '../services/ExerciseCategoryService'" }
    ]
  },
  {
    file: 'mobile/src/stores/fitnessStore.ts',
    fixes: [
      { from: "from '../services/fitnessService'", to: "from '../services/FitnessService'" }
    ]
  },
  {
    file: 'mobile/src/stores/nutritionStore.ts',
    fixes: [
      { from: "from '../services/nutritionService'", to: "from '../services/NutritionService'" }
    ]
  },
  {
    file: 'mobile/src/test-utils/globalStateRefresh.test.ts',
    fixes: [
      { from: "from '../services/nutritionService'", to: "from '../services/NutritionService'" },
      { from: "from '../services/fitnessService'", to: "from '../services/FitnessService'" }
    ]
  },
  {
    file: 'mobile/src/test-utils/manualTestGlobalStateRefresh.ts',
    fixes: [
      { from: "from '../services/nutritionService'", to: "from '../services/NutritionService'" },
      { from: "from '../services/fitnessService'", to: "from '../services/FitnessService'" }
    ]
  },
  {
    file: 'mobile/src/test-utils/stepTrackingTest.ts',
    fixes: [
      { from: "from '../services/stepTrackingService'", to: "from '../services/StepTrackingService'" }
    ]
  }
];

// Function to fix imports in a specific file
function fixSpecificFile(filePath, fixes) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    for (const fix of fixes) {
      if (content.includes(fix.from)) {
        content = content.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.to);
        updated = true;
        console.log(`  ✅ Fixed: ${fix.from} → ${fix.to}`);
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`📝 Updated: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
function main() {
  console.log('🚀 Starting specific import fixes...\n');
  
  let fixedCount = 0;
  let totalCount = specificFixes.length;
  
  for (const fileFix of specificFixes) {
    console.log(`\n🔧 Processing: ${fileFix.file}`);
    if (fixSpecificFile(fileFix.file, fileFix.fixes)) {
      fixedCount++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total files processed: ${totalCount}`);
  console.log(`   Files with imports fixed: ${fixedCount}`);
  console.log(`   Files unchanged: ${totalCount - fixedCount}`);
  
  if (fixedCount > 0) {
    console.log('\n✨ Specific import fixes complete!');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { fixSpecificFile };
