# Current Database Schema Documentation

This document describes the current state of the database schema after all migrations have been applied.

## Schema Overview

The database uses PostgreSQL with integer primary keys and timezone-aware timestamps. All user-related data is properly cascaded on user deletion.

## Core Tables

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    timezone VARCHAR(50) DEFAULT 'UTC',
    active_routine_id INTEGER,
    health_profile JSON,
    onboarding_data JSON,
    goals JSON,
    preferences JSON,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Health Logging Tables

#### Fitness Logs
```sql
CREATE TABLE fitness_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    activity_name VARCHAR(100),
    duration_minutes INTEGER NOT NULL,
    calories_burned INTEGER,
    exercises TEXT, -- JSON string
    unit VARCHAR(10),
    notes TEXT,
    activity_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Nutrition Logs
```sql
CREATE TABLE nutrition_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    meal_type VARCHAR(20) NOT NULL,
    meal_name VARCHAR(100),
    total_calories INTEGER NOT NULL,
    protein_g FLOAT,
    carbs_g FLOAT,
    fat_g FLOAT,
    food_items JSON,
    notes TEXT,
    meal_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Mood Logs
```sql
CREATE TABLE mood_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    mood_rating INTEGER NOT NULL,
    mood_label VARCHAR(50),
    mood_emoji VARCHAR(10),
    notes TEXT,
    log_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Water Logs
```sql
CREATE TABLE water_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    amount_ml INTEGER NOT NULL,
    log_type VARCHAR(20) DEFAULT 'manual',
    notes TEXT,
    log_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Routine Tables

#### Simple Routines
```sql
CREATE TABLE simple_routines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) NOT NULL,
    duration_weeks INTEGER NOT NULL DEFAULT 4,
    tags JSON,
    is_template BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_user_id INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    workout_schedule JSON,
    total_workouts_per_week INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Routine Workout Days
```sql
CREATE TABLE routine_workout_days (
    id SERIAL PRIMARY KEY,
    routine_id INTEGER NOT NULL,
    day_name VARCHAR(20) NOT NULL,
    day_order INTEGER NOT NULL,
    workout_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (routine_id) REFERENCES simple_routines(id) ON DELETE CASCADE
);
```

#### Routine Exercises
```sql
CREATE TABLE routine_exercises (
    id SERIAL PRIMARY KEY,
    workout_day_id INTEGER NOT NULL,
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

### Data Tables

#### Exercise Database
```sql
CREATE TABLE exercises (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    muscle_group VARCHAR(100),
    equipment VARCHAR(100),
    difficulty VARCHAR(20),
    instructions TEXT[],
    gif_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Food Database
```sql
CREATE TABLE foods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    brand VARCHAR(100),
    category VARCHAR(100),
    calories_per_100g FLOAT NOT NULL,
    protein_g FLOAT,
    carbs_g FLOAT,
    fat_g FLOAT,
    fiber_g FLOAT,
    sugar_g FLOAT,
    sodium_mg FLOAT,
    serving_size VARCHAR(50),
    barcode VARCHAR(50),
    food_type VARCHAR(20) DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Indexes

### Primary Indexes
- All tables have primary key indexes on `id`

### Foreign Key Indexes
- `ix_fitness_logs_user_id` on `fitness_logs(user_id)`
- `ix_nutrition_logs_user_id` on `nutrition_logs(user_id)`
- `ix_mood_logs_user_id` on `mood_logs(user_id)`
- `ix_water_logs_user_id` on `water_logs(user_id)`

### Performance Indexes
- `ix_fitness_logs_activity_date` on `fitness_logs(activity_date)`
- `ix_nutrition_logs_meal_date` on `nutrition_logs(meal_date)`
- `ix_mood_logs_log_date` on `mood_logs(log_date)`
- `ix_water_logs_log_date` on `water_logs(log_date)`

## Constraints

### Fitness Logs
- `duration_minutes > 0 AND duration_minutes <= 1440`
- `calories_burned >= 0`

### Nutrition Logs
- `meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')`
- `total_calories >= 0`

### Mood Logs
- `mood_rating >= 1 AND mood_rating <= 10`

### Water Logs
- `amount_ml > 0`

## Relationships

### Primary Relationships
- `users` → `fitness_logs` (1:many)
- `users` → `nutrition_logs` (1:many)
- `users` → `mood_logs` (1:many)
- `users` → `water_logs` (1:many)
- `users` → `simple_routines` (1:many, created_by_user_id)

### Routine Relationships
- `simple_routines` → `routine_workout_days` (1:many)
- `routine_workout_days` → `routine_exercises` (1:many)

## Data Types

### String Types
- `VARCHAR(50)`: Medium-length strings (activity types, difficulty levels)
- `VARCHAR(100)`: Longer strings (names, locations)
- `VARCHAR(255)`: Long strings (full names, routine names)
- `TEXT`: Very long strings (notes, descriptions)

### Numeric Types
- `SERIAL`: Auto-incrementing primary keys
- `INTEGER`: Whole numbers (durations, counts, ratings, foreign keys)
- `FLOAT`: Decimal numbers (weights, measurements, percentages)
- `BOOLEAN`: True/false values

### Date/Time Types
- `TIMESTAMP WITH TIME ZONE`: All datetime fields for timezone support

### Special Types
- `JSON`: For complex data structures (food items, tags, activities, health profiles)

## Migration Status

Current migration head: `[LATEST_MIGRATION_ID]`

To check current status:
```bash
alembic current
```

To see migration history:
```bash
alembic history
```

To apply pending migrations:
```bash
alembic upgrade head
```
