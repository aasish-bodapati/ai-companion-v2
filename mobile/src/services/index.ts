/**
 * Central Service Exports - CONSOLIDATED ARCHITECTURE
 * 
 * This file consolidates all service exports to prevent circular dependencies.
 * 
 * IMPORT RULES:
 * - Components/Screens: Import from this file
 * - Services: Import api directly from './api'
 * - Never import services from this file within other services
 * 
 * CONSOLIDATED SERVICES (30+ → 8):
 * - fitnessService: Fitness, Exercise, Routine, ExerciseCategory
 * - nutritionService: Nutrition, IndianFood, LocalFood, NutritionGoals
 * - healthService: Health, HealthData, Mood, StepTracking, Water
 * - userService: Profile, Onboarding, TimezoneDetection
 * - goalsService: NumericalGoals, BodyTypeGoals, GoalRecommendation, NutritionGoals
 * - dashboardService: Dashboard, HealthData aggregation
 * - notificationsService: SmartNotifications, Weather
 * - api: Central API client
 */

// API Client
export { api, setAuthToken, clearAuthToken, getAuthToken } from './api';

// ===== CONSOLIDATED SERVICES (8 DOMAIN SERVICES) =====

// 1. Fitness Service (Fitness + Exercise + Routine + ExerciseCategory)
export { fitnessService } from './ConsolidatedFitnessService';

// 2. Nutrition Service (Nutrition + IndianFood + LocalFood + NutritionGoals)
export { nutritionService } from './ConsolidatedNutritionService';

// 3. Health Service (Health + HealthData + Mood + StepTracking + Water)
export { healthService } from './ConsolidatedHealthService';

// 4. User Service (Profile + Onboarding + TimezoneDetection)
export { userService } from './ConsolidatedUserService';

// 5. Goals Service (NumericalGoals + BodyTypeGoals + GoalRecommendation + NutritionGoals)
export { goalsService } from './ConsolidatedGoalsService';

// 6. Dashboard Service (Dashboard + HealthData aggregation)
export { dashboardService } from './ConsolidatedDashboardService';

// 7. Notifications Service (SmartNotifications + Weather)
export { notificationsService } from './ConsolidatedNotificationsService';

// 8. Base Service (Shared functionality)
export { BaseService } from './BaseService';

// ===== LEGACY EXPORTS (for backward compatibility during migration) =====
// TODO: Remove these after updating all imports

// Legacy Fitness Services
export { fitnessService as legacyFitnessService } from './FitnessService';
export { routineService } from './RoutineService';
export { exerciseService } from './ExerciseService';
export { exerciseCategoryService } from './ExerciseCategoryService';

// Legacy Nutrition Services
export { nutritionService as legacyNutritionService } from './NutritionService';
export { indianFoodService } from './IndianFoodService';
export { localFoodService } from './LocalFoodService';

// Legacy Health Services
export { healthService as legacyHealthService } from './HealthService';
export { moodService } from './MoodService';
export { simpleWaterService } from './SimpleWaterService';
export { stepTrackingService } from './StepTrackingService';
export { healthDataService } from './HealthDataService';

// Legacy User Services
export { profileService } from './ProfileService';
export { onboardingService } from './OnboardingService';
export { timezoneDetectionService } from './TimezoneDetectionService';

// Legacy Goal Services
export { numericalGoalsService } from './NumericalGoalsService';
export { bodyTypeGoalsApiService } from './BodyTypeGoalsApiService';
export { GoalRecommendationService } from './GoalRecommendationService';

// Legacy Dashboard Services
export { dashboardService as legacyDashboardService } from './DashboardService';

// Legacy Notification Services
export { smartNotificationsService } from './SmartNotificationsService';
export { default as weatherService } from './WeatherService';

// Legacy Other Services
export { default as activeRoutineService } from './ActiveRoutineService';

