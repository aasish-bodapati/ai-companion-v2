-- Power BI Database Verification Script
-- Generated on: 2025-09-19 16:38:43
-- Database: ai_companion_powerbi

-- 1. Check current database
SELECT current_database() as database_name;

-- 2. Count all tables
SELECT COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 3. List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 4. Check for removed tables (should return 0 rows)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'exercise_templates',
    'food_alternatives', 
    'meal_templates',
    'nutrition_meal_plans',
    'nutrition_meals',
    'nutrition_meal_foods',
    'recipe_ingredients'
);

-- 5. Get database timestamp
SELECT now() as current_timestamp;
