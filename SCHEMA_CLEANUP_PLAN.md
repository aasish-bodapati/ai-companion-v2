# Database Schema Cleanup Plan

## Current Focus: Simple Fitness & Nutrition Logging

Based on the new vision and actual usage patterns, here are the columns and tables that can be removed or simplified:

## 🗑️ **Tables to Remove Completely**

### **Advanced Exercise System (V2) - Not Used**
- `exercise_types` - Complex exercise type system not needed
- `routine_exercises_v2` - Advanced routine exercises not used
- `workout_logs_v2` - Advanced workout logs not used

### **Complex Onboarding - Overly Complex**
- `onboarding_profiles` - Most fields are legacy/unused
- Keep only: `user_id`, `completed`, `updated_at`

### **Unused Goal System**
- `user_health_goals` - Complex goal system not used
- `user_goals` - Another goal system not used

## 🔧 **Tables to Simplify**

### **users** - Remove AI Features
- Remove: `memory_enabled` (AI feature not needed)

### **exercises** - Simplify
- Remove: `category`, `muscle_groups`, `equipment_needed` (legacy fields)
- Keep: `id`, `name`, `logging_category`, `difficulty_level`, `calories_per_minute`, `description`

### **fitness_logs** - Focus on Essentials
- Remove: `intensity` (not commonly used)
- Keep: `id`, `user_id`, `activity_type`, `activity_name`, `duration_minutes`, `calories_burned`, `distance_km`, `weight_kg`, `reps`, `sets`, `notes`, `activity_date`

### **nutrition_logs** - Simplify
- Remove: `mood_before`, `mood_after` (not essential for logging)
- Keep: `id`, `user_id`, `meal_type`, `meal_name`, `total_calories`, `protein_g`, `carbs_g`, `fat_g`, `fiber_g`, `sugar_g`, `sodium_mg`, `food_items`, `notes`, `meal_date`

### **mood_logs** - Simplify
- Remove: `water_intake_ml`, `steps_count`, `weight_kg` (duplicate with other tables)
- Keep: `id`, `user_id`, `mood_rating`, `energy_level`, `stress_level`, `sleep_quality`, `sleep_hours`, `notes`, `log_date`

### **simple_routines** - Focus on Essentials
- Remove: `tags` (JSON field not used)
- Keep: `id`, `name`, `description`, `difficulty`, `duration_weeks`, `is_template`, `created_by_user_id`, `is_active`

### **nutrition_routines** - Simplify
- Remove: `meal_plans` (JSON field too complex)
- Keep: `id`, `name`, `description`, `difficulty`, `duration_weeks`, `target_calories`, `is_template`, `created_by_user_id`

## 📊 **Essential Tables to Keep**

### **Core Logging Tables**
- `users` - User management
- `fitness_logs` - Workout logging
- `nutrition_logs` - Meal logging
- `mood_logs` - Wellness tracking
- `user_weight_logs` - Weight tracking

### **Reference Tables**
- `exercises` - Exercise database
- `foods` - Food database
- `food_log_items` - Detailed food items

### **Routine Tables**
- `simple_routines` - Workout routines
- `routine_workout_days` - Workout days
- `routine_exercises` - Exercise details
- `simple_user_routine_progress` - User progress

### **Health Profile**
- `user_health_profile` - Basic health info

## 🎯 **Result: Streamlined Schema**

After cleanup, we'll have:
- **12 tables** instead of 21 (43% reduction)
- **Essential columns only** for fitness and nutrition logging
- **No AI-related fields** or complex features
- **Focus on simple, fast logging** through clean UI
