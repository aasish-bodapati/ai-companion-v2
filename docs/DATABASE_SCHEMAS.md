# Database Schemas Documentation

This document contains the complete database schema for the AI Companion health logging system.

## Table of Contents
1. [Core Tables](#core-tables)
2. [Health Logging Tables](#health-logging-tables)
3. [Simple Routine Tables](#simple-routine-tables)
4. [Nutrition Routine Tables](#nutrition-routine-tables)
5. [User Health Data Tables](#user-health-data-tables)
6. [Chat & Conversation Tables](#chat--conversation-tables)
7. [Schema Relationships](#schema-relationships)

---

## Core Tables

### Users Table
```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    memory_enabled BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## Health Logging Tables

### Fitness Logs Table
```sql
CREATE TABLE fitness_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    activity_name VARCHAR(100),
    duration_minutes INTEGER NOT NULL,
    intensity VARCHAR(20),
    calories_burned INTEGER,
    distance_km FLOAT,
    weight_kg FLOAT,
    reps INTEGER,
    sets INTEGER,
    notes TEXT,
    location VARCHAR(100),
    weather VARCHAR(50),
    activity_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX ix_fitness_logs_user_id ON fitness_logs(user_id);
```

### Nutrition Logs Table
```sql
CREATE TABLE nutrition_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    meal_type VARCHAR(20) NOT NULL,
    meal_name VARCHAR(100),
    total_calories INTEGER NOT NULL,
    protein_g FLOAT,
    carbs_g FLOAT,
    fat_g FLOAT,
    fiber_g FLOAT,
    sugar_g FLOAT,
    sodium_mg FLOAT,
    food_items TEXT NOT NULL,
    notes TEXT,
    mood_before VARCHAR(20),
    mood_after VARCHAR(20),
    meal_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX ix_nutrition_logs_user_id ON nutrition_logs(user_id);
```

### Mood Logs Table
```sql
CREATE TABLE mood_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    mood_rating INTEGER NOT NULL,
    energy_level INTEGER,
    stress_level INTEGER,
    sleep_quality INTEGER,
    sleep_hours FLOAT,
    water_intake_ml INTEGER,
    steps_count INTEGER,
    weight_kg FLOAT,
    notes TEXT,
    activities TEXT,
    log_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX ix_mood_logs_user_id ON mood_logs(user_id);
```

---

## Simple Routine Tables

### Simple Routines Table
```sql
CREATE TABLE simple_routines (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) NOT NULL,
    duration_weeks INTEGER NOT NULL DEFAULT 4,
    tags JSON,
    is_template BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_user_id VARCHAR(36),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    workout_schedule JSON,
    total_workouts_per_week INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Simple User Routine Progress Table
```sql
CREATE TABLE simple_user_routine_progress (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    routine_id VARCHAR(36) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    workouts_completed INTEGER NOT NULL DEFAULT 0,
    last_workout_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (routine_id) REFERENCES simple_routines(id) ON DELETE CASCADE
);
```

### Routine Workout Days Table
```sql
CREATE TABLE routine_workout_days (
    id VARCHAR(36) PRIMARY KEY,
    routine_id VARCHAR(36) NOT NULL,
    day_name VARCHAR(20) NOT NULL,
    day_order INTEGER NOT NULL,
    workout_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (routine_id) REFERENCES simple_routines(id) ON DELETE CASCADE
);
```

### Routine Exercises Table
```sql
CREATE TABLE routine_exercises (
    id VARCHAR(36) PRIMARY KEY,
    workout_day_id VARCHAR(36) NOT NULL,
    exercise_name VARCHAR(200) NOT NULL,
    sets INTEGER NOT NULL,
    reps VARCHAR(50),
    weight_notes VARCHAR(200),
    rest_time VARCHAR(50),
    notes TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workout_day_id) REFERENCES routine_workout_days(id) ON DELETE CASCADE
);
```

---

## Nutrition Routine Tables

### Nutrition Routines Table
```sql
CREATE TABLE nutrition_routines (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) NOT NULL,
    duration_weeks INTEGER NOT NULL DEFAULT 4,
    tags JSON,
    is_template BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_user_id VARCHAR(36),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Nutrition Meal Plans Table
```sql
CREATE TABLE nutrition_meal_plans (
    id VARCHAR(36) PRIMARY KEY,
    routine_id VARCHAR(36) NOT NULL,
    day_name VARCHAR(20) NOT NULL,
    day_order INTEGER NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (routine_id) REFERENCES nutrition_routines(id) ON DELETE CASCADE
);
```

### Nutrition Meals Table
```sql
CREATE TABLE nutrition_meals (
    id VARCHAR(36) PRIMARY KEY,
    meal_plan_id VARCHAR(36) NOT NULL,
    meal_type VARCHAR(20) NOT NULL,
    meal_name VARCHAR(100) NOT NULL,
    total_calories INTEGER NOT NULL,
    protein_g FLOAT,
    carbs_g FLOAT,
    fat_g FLOAT,
    fiber_g FLOAT,
    sugar_g FLOAT,
    sodium_mg FLOAT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meal_plan_id) REFERENCES nutrition_meal_plans(id) ON DELETE CASCADE
);
```

### Nutrition Meal Foods Table
```sql
CREATE TABLE nutrition_meal_foods (
    id VARCHAR(36) PRIMARY KEY,
    meal_id VARCHAR(36) NOT NULL,
    food_name VARCHAR(200) NOT NULL,
    quantity VARCHAR(100) NOT NULL,
    calories INTEGER NOT NULL,
    protein_g FLOAT,
    carbs_g FLOAT,
    fat_g FLOAT,
    fiber_g FLOAT,
    sugar_g FLOAT,
    sodium_mg FLOAT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meal_id) REFERENCES nutrition_meals(id) ON DELETE CASCADE
);
```

### Nutrition User Routine Progress Table
```sql
CREATE TABLE nutrition_user_routine_progress (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    routine_id VARCHAR(36) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    meals_completed INTEGER NOT NULL DEFAULT 0,
    last_meal_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (routine_id) REFERENCES nutrition_routines(id) ON DELETE CASCADE
);
```

---

## Chat & Conversation Tables

### Conversations Table
```sql
CREATE TABLE conversations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    personalization_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    incognito_mode BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Messages Table
```sql
CREATE TABLE messages (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);
```

---

## Routine Management Tables (Legacy)

### Routines Table
```sql
CREATE TABLE routines (
    id VARCHAR(36) PRIMARY KEY,
    created_by_user_id VARCHAR(36),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty VARCHAR(50) NOT NULL,
    duration_weeks INTEGER DEFAULT 4,
    tags TEXT,
    is_template BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

### Routine Workouts Table
```sql
CREATE TABLE routine_workouts (
    id VARCHAR(36) PRIMARY KEY,
    routine_id VARCHAR(36) NOT NULL,
    day VARCHAR(20) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    activity_name VARCHAR(255) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    intensity VARCHAR(20) NOT NULL,
    calories_burned INTEGER,
    notes TEXT,
    order_in_day INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE
);
```

### User Routine Progress Table
```sql
CREATE TABLE user_routine_progress (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    routine_id VARCHAR(36) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    current_week INTEGER DEFAULT 1,
    total_weeks_completed INTEGER DEFAULT 0,
    workouts_completed_this_week INTEGER DEFAULT 0,
    total_workouts_completed INTEGER DEFAULT 0,
    last_workout_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE
);
```

### User Routine Workout Logs Table
```sql
CREATE TABLE user_routine_workout_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    routine_id VARCHAR(36) NOT NULL,
    routine_workout_id VARCHAR(36) NOT NULL,
    fitness_log_id VARCHAR(36),
    week_number INTEGER NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    actual_duration_minutes INTEGER,
    actual_calories_burned INTEGER,
    actual_weight_kg FLOAT,
    actual_reps INTEGER,
    actual_sets INTEGER,
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE,
    FOREIGN KEY (routine_workout_id) REFERENCES routine_workouts(id) ON DELETE CASCADE,
    FOREIGN KEY (fitness_log_id) REFERENCES fitness_logs(id) ON DELETE SET NULL
);
```

---

## User Health Data Tables

### User Health Goals Table
```sql
CREATE TABLE user_health_goals (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    -- Weight and Body Composition Goals
    current_weight_kg FLOAT,
    target_weight_kg FLOAT,
    current_body_fat_percent FLOAT,
    target_body_fat_percent FLOAT,
    current_muscle_mass_kg FLOAT,
    target_muscle_mass_kg FLOAT,
    
    -- Calorie and Macro Goals
    daily_calorie_target INTEGER,
    daily_protein_target_g FLOAT,
    daily_carbs_target_g FLOAT,
    daily_fat_target_g FLOAT,
    daily_fiber_target_g FLOAT,
    daily_water_target_ml INTEGER,
    
    -- Fitness Goals
    weekly_workout_target INTEGER,
    daily_steps_target INTEGER,
    weekly_cardio_minutes INTEGER,
    weekly_strength_sessions INTEGER,
    
    -- Sleep and Recovery Goals
    target_sleep_hours FLOAT,
    target_sleep_quality INTEGER,
    
    -- Health Metrics Goals
    target_blood_pressure_systolic INTEGER,
    target_blood_pressure_diastolic INTEGER,
    target_resting_heart_rate INTEGER,
    
    -- Lifestyle Goals
    stress_management_goal VARCHAR(100),
    mood_tracking_goal VARCHAR(100),
    habit_goals TEXT,
    
    -- Goal Settings
    goal_priority VARCHAR(50),
    timeline_weeks INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### User Health Profile Table
```sql
CREATE TABLE user_health_profile (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    -- Basic Measurements
    height_cm FLOAT,
    age INTEGER,
    gender VARCHAR(20),
    activity_level VARCHAR(50),
    
    -- Current Health Metrics
    current_weight_kg FLOAT,
    current_body_fat_percent FLOAT,
    current_muscle_mass_kg FLOAT,
    current_waist_circumference_cm FLOAT,
    current_hip_circumference_cm FLOAT,
    
    -- Health Conditions
    has_diabetes BOOLEAN DEFAULT FALSE,
    has_hypertension BOOLEAN DEFAULT FALSE,
    has_heart_condition BOOLEAN DEFAULT FALSE,
    other_conditions TEXT,
    
    -- Dietary Preferences
    dietary_restrictions TEXT,
    food_allergies TEXT,
    preferred_cuisine VARCHAR(50),
    
    -- Fitness Preferences
    preferred_workout_times VARCHAR(50),
    preferred_workout_types TEXT,
    gym_access BOOLEAN DEFAULT FALSE,
    home_equipment TEXT,
    
    -- Lifestyle Information
    work_schedule VARCHAR(50),
    sleep_schedule VARCHAR(50),
    stress_level INTEGER,
    motivation_level INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## Schema Relationships

### Primary Relationships
- **users** → **fitness_logs** (1:many)
- **users** → **nutrition_logs** (1:many)
- **users** → **mood_logs** (1:many)
- **users** → **routines** (1:many, created_by_user_id)
- **users** → **user_routine_progress** (1:many)
- **users** → **user_routine_workout_logs** (1:many)
- **users** → **user_health_goals** (1:1)
- **users** → **user_health_profile** (1:1)

### Routine Relationships
- **routines** → **routine_workouts** (1:many)
- **routines** → **user_routine_progress** (1:many)
- **routines** → **user_routine_workout_logs** (1:many)
- **routine_workouts** → **user_routine_workout_logs** (1:many)

### Cross-Table Relationships
- **fitness_logs** → **user_routine_workout_logs** (1:many, fitness_log_id)

---

## Field Constraints and Validation

### Fitness Logs
- `duration_minutes`: 1-1440 (max 24 hours)
- `calories_burned`: >= 0
- `distance_km`: >= 0
- `weight_kg`: >= 0
- `reps`: >= 0
- `sets`: >= 0

### Nutrition Logs
- `total_calories`: >= 0
- All macro fields (protein_g, carbs_g, etc.): >= 0
- `food_items`: JSON array of food items

### Mood Logs
- `mood_rating`: 1-10
- `energy_level`: 1-10
- `stress_level`: 1-10
- `sleep_quality`: 1-10
- `sleep_hours`: 0-24
- `water_intake_ml`: >= 0
- `steps_count`: >= 0
- `weight_kg`: >= 0

### Health Goals
- Weight fields: 0-500 kg
- Body fat: 0-100%
- Muscle mass: 0-200 kg
- Daily calories: 500-10000
- Macro targets: 0-1000g (varies by type)
- Water intake: 0-10000 ml
- Workout targets: 0-14 per week
- Steps: 0-50000 per day
- Sleep hours: 0-24
- Sleep quality: 1-10
- Blood pressure: 70-200 (systolic), 40-120 (diastolic)
- Heart rate: 30-200 bpm
- Timeline: 1-104 weeks

### Health Profile
- Height: 50-300 cm
- Age: 13-120 years
- Weight: 0-500 kg
- Body fat: 0-100%
- Muscle mass: 0-200 kg
- Circumference measurements: 0-200 cm
- Stress/motivation levels: 1-10

---

## Indexes

### Primary Indexes
- All tables have primary key indexes on `id`

### Foreign Key Indexes
- `ix_fitness_logs_user_id` on `fitness_logs(user_id)`
- `ix_nutrition_logs_user_id` on `nutrition_logs(user_id)`
- `ix_mood_logs_user_id` on `mood_logs(user_id)`

### Additional Indexes (Recommended)
- `routines(created_by_user_id)` for user-created routines
- `routine_workouts(routine_id)` for routine workout lookups
- `user_routine_progress(user_id, routine_id)` for user progress
- `fitness_logs(activity_date)` for date-based queries
- `nutrition_logs(meal_date)` for date-based queries
- `mood_logs(log_date)` for date-based queries

---

## Data Types Summary

### String Types
- `VARCHAR(36)`: UUIDs and short identifiers
- `VARCHAR(50)`: Medium-length strings (activity types, difficulty levels)
- `VARCHAR(100)`: Longer strings (names, locations)
- `VARCHAR(255)`: Long strings (full names, routine names)
- `TEXT`: Very long strings (notes, JSON data)

### Numeric Types
- `INTEGER`: Whole numbers (durations, counts, ratings)
- `FLOAT`: Decimal numbers (weights, measurements, percentages)
- `BOOLEAN`: True/false values

### Date/Time Types
- `TIMESTAMP WITH TIME ZONE`: All datetime fields for timezone support

### Special Types
- `UUID`: For health goals and profile tables
- `JSON` (stored as TEXT): For complex data structures (food items, tags, activities)

---

This schema supports a comprehensive health logging system with full CRUD operations, user management, routine tracking, and analytics capabilities.
