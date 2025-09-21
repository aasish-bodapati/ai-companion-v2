# Database Schema Documentation

## Core Tables

### users
- **id**: Primary key, auto-incrementing integer
- **email**: Unique email address for login
- **hashed_password**: Encrypted password for authentication
- **full_name**: User's display name
- **is_active**: Whether user account is enabled
- **is_superuser**: Admin privileges flag

### onboarding_profiles
- **id**: Primary key, auto-incrementing integer
- **user_id**: Foreign key to users table (one-to-one)
- **completed**: Whether onboarding is finished
- **updated_at**: Last modification timestamp

## Health & Fitness Tables

### user_health_profile
- **id**: Primary key, auto-incrementing integer
- **user_id**: Foreign key to users table (one-to-one)
- **height_cm**: User's height in centimeters
- **age**: User's current age
- **gender**: User's gender (male, female, other)
- **activity_level**: Daily activity level (sedentary to extremely_active)
- **current_weight_kg**: User's current weight in kilograms

### fitness_logs
- **id**: Primary key, auto-incrementing integer
- **user_id**: Foreign key to users table
- **activity_type**: Type of exercise (running, weightlifting, etc.)
- **activity_name**: Custom name for the activity
- **duration_minutes**: Workout duration in minutes
- **calories_burned**: Estimated calories burned
- **distance_km**: Distance covered for cardio activities
- **weight_kg**: Weight used for strength training
- **reps**: Number of repetitions performed
- **sets**: Number of sets completed
- **notes**: Additional workout notes
- **activity_date**: When the workout occurred
- **created_at**: Record creation timestamp
- **updated_at**: Last modification timestamp

## 📊 **Schema Summary**

### **Total Tables: 12** (reduced from 21)
- **Core Tables**: 2 (users, onboarding_profiles)
- **Health & Fitness**: 4 (user_health_profile, fitness_logs, exercises, user_exercise_history)
- **Nutrition**: 3 (foods, nutrition_logs, food_log_items, user_food_history)
- **Mood & Wellness**: 2 (mood_logs, user_weight_logs)
- **Routines**: 4 (simple_routines, routine_workout_days, routine_exercises, simple_user_routine_progress)
- **Nutrition Routines**: 2 (nutrition_routines, nutrition_user_routine_progress)

### **Key Simplifications**
- **Removed AI features** (memory_enabled, complex onboarding fields)
- **Removed legacy fields** (exercise categories, muscle groups, equipment)
- **Removed unused features** (intensity, mood tracking, complex JSON fields)
- **Removed advanced systems** (V2 exercise system, complex goal tracking)
- **Focused on essentials** for simple fitness and nutrition logging

### **Core Functionality**
- **Quick logging** of workouts and meals
- **Clean data visualization** for progress tracking
- **Simple routine management** for workout planning
- **Essential health metrics** tracking
- **Reliable data storage** and retrieval

### exercises
- **id**: Primary key, auto-incrementing integer
- **name**: Exercise name (e.g., "Push-ups", "Running")
- **logging_category**: Exercise category for logging (weighted, cardio_duration, etc.)
- **difficulty_level**: Difficulty rating (beginner, intermediate, advanced)
- **calories_per_minute**: Average calories burned per minute
- **description**: Exercise description and instructions
- **created_at**: Record creation timestamp
- **updated_at**: Last modification timestamp

## 📊 **Schema Summary**

### **Total Tables: 12** (reduced from 21)
- **Core Tables**: 2 (users, onboarding_profiles)
- **Health & Fitness**: 4 (user_health_profile, fitness_logs, exercises, user_exercise_history)
- **Nutrition**: 3 (foods, nutrition_logs, food_log_items, user_food_history)
- **Mood & Wellness**: 2 (mood_logs, user_weight_logs)
- **Routines**: 4 (simple_routines, routine_workout_days, routine_exercises, simple_user_routine_progress)
- **Nutrition Routines**: 2 (nutrition_routines, nutrition_user_routine_progress)

### **Key Simplifications**
- **Removed AI features** (memory_enabled, complex onboarding fields)
- **Removed legacy fields** (exercise categories, muscle groups, equipment)
- **Removed unused features** (intensity, mood tracking, complex JSON fields)
- **Removed advanced systems** (V2 exercise system, complex goal tracking)
- **Focused on essentials** for simple fitness and nutrition logging

### **Core Functionality**
- **Quick logging** of workouts and meals
- **Clean data visualization** for progress tracking
- **Simple routine management** for workout planning
- **Essential health metrics** tracking
- **Reliable data storage** and retrieval

### user_exercise_history
- **id**: Primary key, auto-incrementing integer
- **user_id**: Foreign key to users table
- **exercise_id**: Foreign key to exercises table
- **times_logged**: Number of times user has logged this exercise
- **last_logged**: Most recent logging date
- **created_at**: Record creation timestamp
- **updated_at**: Last modification timestamp

## 📊 **Schema Summary**

### **Total Tables: 12** (reduced from 21)
- **Core Tables**: 2 (users, onboarding_profiles)
- **Health & Fitness**: 4 (user_health_profile, fitness_logs, exercises, user_exercise_history)
- **Nutrition**: 3 (foods, nutrition_logs, food_log_items, user_food_history)
- **Mood & Wellness**: 2 (mood_logs, user_weight_logs)
- **Routines**: 4 (simple_routines, routine_workout_days, routine_exercises, simple_user_routine_progress)
- **Nutrition Routines**: 2 (nutrition_routines, nutrition_user_routine_progress)

### **Key Simplifications**
- **Removed AI features** (memory_enabled, complex onboarding fields)
- **Removed legacy fields** (exercise categories, muscle groups, equipment)
- **Removed unused features** (intensity, mood tracking, complex JSON fields)
- **Removed advanced systems** (V2 exercise system, complex goal tracking)
- **Focused on essentials** for simple fitness and nutrition logging

### **Core Functionality**
- **Quick logging** of workouts and meals
- **Clean data visualization** for progress tracking
- **Simple routine management** for workout planning
- **Essential health metrics** tracking
- **Reliable data storage** and retrieval

## Nutrition Tables

### foods
- **id**: Primary key, auto-incrementing integer
- **name**: Food name (e.g., "Chicken Breast", "Brown Rice")
- **brand**: Food brand name (optional)
- **category**: Food category (fruits, vegetables, grains, etc.)
- **calories_per_100g**: Calories per 100 grams
- **protein_per_100g**: Protein content per 100 grams
- **carbs_per_100g**: Carbohydrate content per 100 grams
- **fat_per_100g**: Fat content per 100 grams
- **fiber_per_100g**: Fiber content per 100 grams
- **sugar_per_100g**: Sugar content per 100 grams
- **sodium_per_100g**: Sodium content per 100 grams (in mg)
- **default_serving_grams**: Default serving size in grams
- **created_at**: Record creation timestamp
- **updated_at**: Last modification timestamp

## 📊 **Schema Summary**

### **Total Tables: 12** (reduced from 21)
- **Core Tables**: 2 (users, onboarding_profiles)
- **Health & Fitness**: 4 (user_health_profile, fitness_logs, exercises, user_exercise_history)
- **Nutrition**: 3 (foods, nutrition_logs, food_log_items, user_food_history)
- **Mood & Wellness**: 2 (mood_logs, user_weight_logs)
- **Routines**: 4 (simple_routines, routine_workout_days, routine_exercises, simple_user_routine_progress)
- **Nutrition Routines**: 2 (nutrition_routines, nutrition_user_routine_progress)

### **Key Simplifications**
- **Removed AI features** (memory_enabled, complex onboarding fields)
- **Removed legacy fields** (exercise categories, muscle groups, equipment)
- **Removed unused features** (intensity, mood tracking, complex JSON fields)
- **Removed advanced systems** (V2 exercise system, complex goal tracking)
- **Focused on essentials** for simple fitness and nutrition logging

### **Core Functionality**
- **Quick logging** of workouts and meals
- **Clean data visualization** for progress tracking
- **Simple routine management** for workout planning
- **Essential health metrics** tracking
- **Reliable data storage** and retrieval

### nutrition_logs
- **id**: Primary key, auto-incrementing integer
- **user_id**: Foreign key to users table
- **meal_type**: Type of meal (breakfast, lunch, dinner, snack)
- **meal_name**: Custom name for the meal
- **total_calories**: Total calories for the meal
- **protein_g**: Total protein in grams
- **carbs_g**: Total carbohydrates in grams
- **fat_g**: Total fat in grams
- **fiber_g**: Total fiber in grams
- **sugar_g**: Total sugar in grams
- **sodium_mg**: Total sodium in milligrams
- **food_items**: JSON array of food items in the meal
- **notes**: Additional meal notes
- **meal_date**: When the meal was consumed
- **created_at**: Record creation timestamp
- **updated_at**: Last modification timestamp

## 📊 **Schema Summary**

### **Total Tables: 12** (reduced from 21)
- **Core Tables**: 2 (users, onboarding_profiles)
- **Health & Fitness**: 4 (user_health_profile, fitness_logs, exercises, user_exercise_history)
- **Nutrition**: 3 (foods, nutrition_logs, food_log_items, user_food_history)
- **Mood & Wellness**: 2 (mood_logs, user_weight_logs)
- **Routines**: 4 (simple_routines, routine_workout_days, routine_exercises, simple_user_routine_progress)
- **Nutrition Routines**: 2 (nutrition_routines, nutrition_user_routine_progress)

### **Key Simplifications**
- **Removed AI features** (memory_enabled, complex onboarding fields)
- **Removed legacy fields** (exercise categories, muscle groups, equipment)
- **Removed unused features** (intensity, mood tracking, complex JSON fields)
- **Removed advanced systems** (V2 exercise system, complex goal tracking)
- **Focused on essentials** for simple fitness and nutrition logging

### **Core Functionality**
- **Quick logging** of workouts and meals
- **Clean data visualization** for progress tracking
- **Simple routine management** for workout planning
- **Essential health metrics** tracking
- **Reliable data storage** and retrieval

### food_log_items
- **id**: Primary key, auto-incrementing integer
- **nutrition_log_id**: Foreign key to nutrition_logs table
- **food_id**: Foreign key to foods table (optional)
- **food_name**: Name of the food item
- **quantity_grams**: Amount consumed in grams
- **calories**: Calculated calories for this quantity
- **protein_g**: Calculated protein in grams
- **carbs_g**: Calculated carbohydrates in grams
- **fat_g**: Calculated fat in grams
- **fiber_g**: Calculated fiber in grams
- **sugar_g**: Calculated sugar in grams
- **sodium_mg**: Calculated sodium in milligrams
- **created_at**: Record creation timestamp
- **updated_at**: Last modification timestamp

## 📊 **Schema Summary**

### **Total Tables: 12** (reduced from 21)
- **Core Tables**: 2 (users, onboarding_profiles)
- **Health & Fitness**: 4 (user_health_profile, fitness_logs, exercises, user_exercise_history)
- **Nutrition**: 3 (foods, nutrition_logs, food_log_items, user_food_history)
- **Mood & Wellness**: 2 (mood_logs, user_weight_logs)
- **Routines**: 4 (simple_routines, routine_workout_days, routine_exercises, simple_user_routine_progress)
- **Nutrition Routines**: 2 (nutrition_routines, nutrition_user_routine_progress)

### **Key Simplifications**
- **Removed AI features** (memory_enabled, complex onboarding fields)
- **Removed legacy fields** (exercise categories, muscle groups, equipment)
- **Removed unused features** (intensity, mood tracking, complex JSON fields)
- **Removed advanced systems** (V2 exercise system, complex goal tracking)
- **Focused on essentials** for simple fitness and nutrition logging

### **Core Functionality**
- **Quick logging** of workouts and meals
- **Clean data visualization** for progress tracking
- **Simple routine management** for workout planning
- **Essential health metrics** tracking
- **Reliable data storage** and retrieval

### user_food_history
- **id**: Primary key, auto-incrementing integer
- **user_id**: Foreign key to users table
- **food_id**: Foreign key to foods table
- **times_logged**: Number of times user has logged this food
- **last_logged**: Most recent logging date
- **created_at**: Record creation timestamp
- **updated_at**: Last modification timestamp

## 📊 **Schema Summary**

### **Total Tables: 12** (reduced from 21)
- **Core Tables**: 2 (users, onboarding_profiles)
- **Health & Fitness**: 4 (user_health_profile, fitness_logs, exercises, user_exercise_history)
- **Nutrition**: 3 (foods, nutrition_logs, food_log_items, user_food_history)
- **Mood & Wellness**: 2 (mood_logs, user_weight_logs)
- **Routines**: 4 (simple_routines, routine_workout_days, routine_exercises, simple_user_routine_progress)
- **Nutrition Routines**: 2 (nutrition_routines, nutrition_user_routine_progress)

### **Key Simplifications**
- **Removed AI features** (memory_enabled, complex onboarding fields)
- **Removed legacy fields** (exercise categories, muscle groups, equipment)
- **Removed unused features** (intensity, mood tracking, complex JSON fields)
- **Removed advanced systems** (V2 exercise system, complex goal tracking)
- **Focused on essentials** for simple fitness and nutrition logging

### **Core Functionality**
- **Quick logging** of workouts and meals
- **Clean data visualization** for progress tracking
- **Simple routine management** for workout planning
- **Essential health metrics** tracking
- **Reliable data storage** and retrieval

## Mood & Wellness Tables

### mood_logs
- **id**: Primary key, auto-incrementing integer
- **user_id**: Foreign key to users table
- **mood_rating**: Mood rating on 1-10 scale
- **energy_level**: Energy level on 1-10 scale
- **stress_level**: Stress level on 1-10 scale
- **sleep_quality**: Sleep quality on 1-10 scale
- **sleep_hours**: Hours of sleep
- **notes**: Additional wellness notes
- **activities**: JSON array of activities performed
- **log_date**: Date of the log entry
- **created_at**: Record creation timestamp
- **updated_at**: Last modification timestamp

## 📊 **Schema Summary**

### **Total Tables: 12** (reduced from 21)
- **Core Tables**: 2 (users, onboarding_profiles)
- **Health & Fitness**: 4 (user_health_profile, fitness_logs, exercises, user_exercise_history)
- **Nutrition**: 3 (foods, nutrition_logs, food_log_items, user_food_history)
- **Mood & Wellness**: 2 (mood_logs, user_weight_logs)
- **Routines**: 4 (simple_routines, routine_workout_days, routine_exercises, simple_user_routine_progress)
- **Nutrition Routines**: 2 (nutrition_routines, nutrition_user_routine_progress)

### **Key Simplifications**
- **Removed AI features** (memory_enabled, complex onboarding fields)
- **Removed legacy fields** (exercise categories, muscle groups, equipment)
- **Removed unused features** (intensity, mood tracking, complex JSON fields)
- **Removed advanced systems** (V2 exercise system, complex goal tracking)
- **Focused on essentials** for simple fitness and nutrition logging

### **Core Functionality**
- **Quick logging** of workouts and meals
- **Clean data visualization** for progress tracking
- **Simple routine management** for workout planning
- **Essential health metrics** tracking
- **Reliable data storage** and retrieval

### user_weight_logs
- **id**: Primary key, auto-incrementing integer
- **user_id**: Foreign key to users table
- **weight_kg**: Weight in kilograms
- **body_fat_percent**: Body fat percentage
- **muscle_mass_kg**: Muscle mass in kilograms
- **waist_circumference_cm**: Waist measurement in centimeters
- **hip_circumference_cm**: Hip measurement in centimeters
- **notes**: Additional measurement notes
- **log_date**: Date of the measurement
- **created_at**: Record creation timestamp

## Routine & Planning Tables

### simple_routines
- **id**: Primary key, auto-incrementing integer
- **name**: Routine name (e.g., "Push/Pull/Legs")
- **description**: Routine description
- **difficulty**: Difficulty level (beginner, intermediate, advanced)
- **duration_weeks**: Routine duration in weeks
- **is_template**: Whether this is a system template
- **created_by_user_id**: Foreign key to users table (for user-created routines)
- **is_active**: Whether routine is currently active
- **created_at**: Record creation timestamp
- **updated_at**: Last modification timestamp

## 📊 **Schema Summary**

### **Total Tables: 12** (reduced from 21)
- **Core Tables**: 2 (users, onboarding_profiles)
- **Health & Fitness**: 4 (user_health_profile, fitness_logs, exercises, user_exercise_history)
- **Nutrition**: 3 (foods, nutrition_logs, food_log_items, user_food_history)
- **Mood & Wellness**: 2 (mood_logs, user_weight_logs)
- **Routines**: 4 (simple_routines, routine_workout_days, routine_exercises, simple_user_routine_progress)
- **Nutrition Routines**: 2 (nutrition_routines, nutrition_user_routine_progress)

### **Key Simplifications**
- **Removed AI features** (memory_enabled, complex onboarding fields)
- **Removed legacy fields** (exercise categories, muscle groups, equipment)
- **Removed unused features** (intensity, mood tracking, complex JSON fields)
- **Removed advanced systems** (V2 exercise system, complex goal tracking)
- **Focused on essentials** for simple fitness and nutrition logging

### **Core Functionality**
- **Quick logging** of workouts and meals
- **Clean data visualization** for progress tracking
- **Simple routine management** for workout planning
- **Essential health metrics** tracking
- **Reliable data storage** and retrieval

### routine_workout_days
- **id**: Primary key, auto-incrementing integer
- **routine_id**: Foreign key to simple_routines table
- **day_name**: Day of the week (Monday, Tuesday, etc.)
- **day_order**: Order within the week (1-7)
- **workout_name**: Name of the workout (Push, Pull, Legs, etc.)
- **description**: Workout day description
- **created_at**: Record creation timestamp
- **updated_at**: Last modification timestamp

## 📊 **Schema Summary**

### **Total Tables: 12** (reduced from 21)
- **Core Tables**: 2 (users, onboarding_profiles)
- **Health & Fitness**: 4 (user_health_profile, fitness_logs, exercises, user_exercise_history)
- **Nutrition**: 3 (foods, nutrition_logs, food_log_items, user_food_history)
- **Mood & Wellness**: 2 (mood_logs, user_weight_logs)
- **Routines**: 4 (simple_routines, routine_workout_days, routine_exercises, simple_user_routine_progress)
- **Nutrition Routines**: 2 (nutrition_routines, nutrition_user_routine_progress)

### **Key Simplifications**
- **Removed AI features** (memory_enabled, complex onboarding fields)
- **Removed legacy fields** (exercise categories, muscle groups, equipment)
- **Removed unused features** (intensity, mood tracking, complex JSON fields)
- **Removed advanced systems** (V2 exercise system, complex goal tracking)
- **Focused on essentials** for simple fitness and nutrition logging

### **Core Functionality**
- **Quick logging** of workouts and meals
- **Clean data visualization** for progress tracking
- **Simple routine management** for workout planning
- **Essential health metrics** tracking
- **Reliable data storage** and retrieval

### routine_exercises
- **id**: Primary key, auto-incrementing integer
- **workout_day_id**: Foreign key to routine_workout_days table
- **exercise_name**: Name of the exercise
- **sets**: Number of sets to perform
- **reps**: Repetition range (e.g., "8-12")
- **weight_notes**: Weight instructions (e.g., "moderate weight")
- **rest_time**: Rest time between sets
- **notes**: Exercise-specific notes
- **order_index**: Order within the workout
- **created_at**: Record creation timestamp
- **updated_at**: Last modification timestamp

## 📊 **Schema Summary**

### **Total Tables: 12** (reduced from 21)
- **Core Tables**: 2 (users, onboarding_profiles)
- **Health & Fitness**: 4 (user_health_profile, fitness_logs, exercises, user_exercise_history)
- **Nutrition**: 3 (foods, nutrition_logs, food_log_items, user_food_history)
- **Mood & Wellness**: 2 (mood_logs, user_weight_logs)
- **Routines**: 4 (simple_routines, routine_workout_days, routine_exercises, simple_user_routine_progress)
- **Nutrition Routines**: 2 (nutrition_routines, nutrition_user_routine_progress)

### **Key Simplifications**
- **Removed AI features** (memory_enabled, complex onboarding fields)
- **Removed legacy fields** (exercise categories, muscle groups, equipment)
- **Removed unused features** (intensity, mood tracking, complex JSON fields)
- **Removed advanced systems** (V2 exercise system, complex goal tracking)
- **Focused on essentials** for simple fitness and nutrition logging

### **Core Functionality**
- **Quick logging** of workouts and meals
- **Clean data visualization** for progress tracking
- **Simple routine management** for workout planning
- **Essential health metrics** tracking
- **Reliable data storage** and retrieval

### simple_user_routine_progress
- **id**: Primary key, auto-incrementing integer
- **user_id**: Foreign key to users table
- **routine_id**: Foreign key to simple_routines table
- **is_active**: Whether user is currently following this routine
- **started_at**: When user started the routine
- **completed_at**: When user completed the routine
- **workouts_completed**: Number of workouts completed
- **last_workout_date**: Date of last workout
- **created_at**: Record creation timestamp
- **updated_at**: Last modification timestamp

## 📊 **Schema Summary**

### **Total Tables: 12** (reduced from 21)
- **Core Tables**: 2 (users, onboarding_profiles)
- **Health & Fitness**: 4 (user_health_profile, fitness_logs, exercises, user_exercise_history)
- **Nutrition**: 3 (foods, nutrition_logs, food_log_items, user_food_history)
- **Mood & Wellness**: 2 (mood_logs, user_weight_logs)
- **Routines**: 4 (simple_routines, routine_workout_days, routine_exercises, simple_user_routine_progress)
- **Nutrition Routines**: 2 (nutrition_routines, nutrition_user_routine_progress)

### **Key Simplifications**
- **Removed AI features** (memory_enabled, complex onboarding fields)
- **Removed legacy fields** (exercise categories, muscle groups, equipment)
- **Removed unused features** (intensity, mood tracking, complex JSON fields)
- **Removed advanced systems** (V2 exercise system, complex goal tracking)
- **Focused on essentials** for simple fitness and nutrition logging

### **Core Functionality**
- **Quick logging** of workouts and meals
- **Clean data visualization** for progress tracking
- **Simple routine management** for workout planning
- **Essential health metrics** tracking
- **Reliable data storage** and retrieval

## Nutrition Routine Tables

### nutrition_routines
- **id**: Primary key, auto-incrementing integer
- **name**: Routine name (e.g., "Weight Loss Plan")
- **description**: Routine description
- **difficulty**: Difficulty level (beginner, intermediate, advanced)
- **duration_weeks**: Routine duration in weeks
- **target_calories**: Daily calorie target
- **is_template**: Whether this is a system template
- **created_by_user_id**: Foreign key to users table (for user-created routines)
- **created_at**: Record creation timestamp
- **updated_at**: Last modification timestamp

## 📊 **Schema Summary**

### **Total Tables: 12** (reduced from 21)
- **Core Tables**: 2 (users, onboarding_profiles)
- **Health & Fitness**: 4 (user_health_profile, fitness_logs, exercises, user_exercise_history)
- **Nutrition**: 3 (foods, nutrition_logs, food_log_items, user_food_history)
- **Mood & Wellness**: 2 (mood_logs, user_weight_logs)
- **Routines**: 4 (simple_routines, routine_workout_days, routine_exercises, simple_user_routine_progress)
- **Nutrition Routines**: 2 (nutrition_routines, nutrition_user_routine_progress)

### **Key Simplifications**
- **Removed AI features** (memory_enabled, complex onboarding fields)
- **Removed legacy fields** (exercise categories, muscle groups, equipment)
- **Removed unused features** (intensity, mood tracking, complex JSON fields)
- **Removed advanced systems** (V2 exercise system, complex goal tracking)
- **Focused on essentials** for simple fitness and nutrition logging

### **Core Functionality**
- **Quick logging** of workouts and meals
- **Clean data visualization** for progress tracking
- **Simple routine management** for workout planning
- **Essential health metrics** tracking
- **Reliable data storage** and retrieval

### nutrition_user_routine_progress
- **id**: Primary key, auto-incrementing integer
- **routine_id**: Foreign key to nutrition_routines table
- **user_id**: Foreign key to users table
- **is_active**: Whether user is currently following this routine
- **started_at**: When user started the routine
- **completed_at**: When user completed the routine
- **days_completed**: Number of days completed
- **created_at**: Record creation timestamp
- **updated_at**: Last modification timestamp

## 📊 **Schema Summary**

### **Total Tables: 12** (reduced from 21)
- **Core Tables**: 2 (users, onboarding_profiles)
- **Health & Fitness**: 4 (user_health_profile, fitness_logs, exercises, user_exercise_history)
- **Nutrition**: 3 (foods, nutrition_logs, food_log_items, user_food_history)
- **Mood & Wellness**: 2 (mood_logs, user_weight_logs)
- **Routines**: 4 (simple_routines, routine_workout_days, routine_exercises, simple_user_routine_progress)
- **Nutrition Routines**: 2 (nutrition_routines, nutrition_user_routine_progress)

### **Key Simplifications**
- **Removed AI features** (memory_enabled, complex onboarding fields)
- **Removed legacy fields** (exercise categories, muscle groups, equipment)
- **Removed unused features** (intensity, mood tracking, complex JSON fields)
- **Removed advanced systems** (V2 exercise system, complex goal tracking)
- **Focused on essentials** for simple fitness and nutrition logging

### **Core Functionality**
- **Quick logging** of workouts and meals
- **Clean data visualization** for progress tracking
- **Simple routine management** for workout planning
- **Essential health metrics** tracking
- **Reliable data storage** and retrieval

