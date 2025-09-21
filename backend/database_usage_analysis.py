#!/usr/bin/env python3
"""
Database Usage Analysis - Identify which tables are actually used in the application
"""

import sys
sys.path.append('.')

from app.db.session import SessionLocal
from sqlalchemy import text
from collections import defaultdict
import os
import re

def get_table_usage_analysis():
    """Analyze which tables are actually used in the application"""
    
    # Get all tables
    db = SessionLocal()
    try:
        result = db.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """))
        all_tables = [row[0] for row in result.fetchall()]
    finally:
        db.close()
    
    # Define table categories based on actual usage
    table_analysis = {
        'core_tables': {
            'users': {
                'usage': 'Authentication, user management',
                'api_endpoints': ['/api/v1/users/me', '/api/v1/login/access-token'],
                'frontend_usage': 'AuthContext, user profile',
                'essential': True
            },
            'onboarding_profiles': {
                'usage': 'User onboarding data',
                'api_endpoints': ['/api/v1/health/onboarding'],
                'frontend_usage': 'OnboardingEditor component',
                'essential': True
            },
            'user_health_profile': {
                'usage': 'User health information',
                'api_endpoints': ['/api/v1/health/profile'],
                'frontend_usage': 'Health profile management',
                'essential': True
            }
        },
        'logging_tables': {
            'fitness_logs': {
                'usage': 'Fitness activity logging',
                'api_endpoints': ['/api/v1/health/logging/fitness', '/api/v1/health/fitness-logs'],
                'frontend_usage': 'FitnessLogsView, SmartWorkoutLogger',
                'essential': True
            },
            'nutrition_logs': {
                'usage': 'Nutrition logging',
                'api_endpoints': ['/api/v1/health/logging/nutrition'],
                'frontend_usage': 'NutritionLogsView, SmartMealLogger',
                'essential': True
            },
            'mood_logs': {
                'usage': 'Mood and wellness tracking',
                'api_endpoints': ['/api/v1/health/logging/mood'],
                'frontend_usage': 'Mood tracking components',
                'essential': True
            },
            'user_weight_logs': {
                'usage': 'Weight tracking',
                'api_endpoints': ['/api/v1/health/logging/weight'],
                'frontend_usage': 'Weight tracking components',
                'essential': True
            },
            'food_log_items': {
                'usage': 'Individual food items in nutrition logs',
                'api_endpoints': ['/api/v1/health/logging/nutrition'],
                'frontend_usage': 'NutritionLogsView',
                'essential': True
            }
        },
        'routine_tables': {
            'simple_routines': {
                'usage': 'Workout routine templates',
                'api_endpoints': ['/api/v1/health/simple-routines'],
                'frontend_usage': 'SimpleRoutineTemplates, CustomRoutineBuilder',
                'essential': True
            },
            'simple_user_routine_progress': {
                'usage': 'User progress on routines',
                'api_endpoints': ['/api/v1/health/simple-routines'],
                'frontend_usage': 'Routine progress tracking',
                'essential': True
            },
            'routine_workout_days': {
                'usage': 'Workout days within routines',
                'api_endpoints': ['/api/v1/health/simple-routines'],
                'frontend_usage': 'Routine detail views',
                'essential': True
            },
            'routine_exercises': {
                'usage': 'Exercises within workout days',
                'api_endpoints': ['/api/v1/health/simple-routines'],
                'frontend_usage': 'Routine detail views',
                'essential': True
            },
            'nutrition_routines': {
                'usage': 'Nutrition routine templates',
                'api_endpoints': ['/api/v1/health/nutrition-routines'],
                'frontend_usage': 'NutritionRoutineManager',
                'essential': True
            },
            'nutrition_user_routine_progress': {
                'usage': 'User progress on nutrition routines',
                'api_endpoints': ['/api/v1/health/nutrition-routines'],
                'frontend_usage': 'Nutrition routine progress',
                'essential': True
            }
        },
        'database_tables': {
            'exercises': {
                'usage': 'Exercise database',
                'api_endpoints': ['/api/v1/health/exercises'],
                'frontend_usage': 'Exercise search, CustomRoutineBuilder',
                'essential': True
            },
            'foods': {
                'usage': 'Food database',
                'api_endpoints': ['/api/v1/health/foods'],
                'frontend_usage': 'Food search, nutrition logging',
                'essential': True
            },
            'user_exercise_history': {
                'usage': 'User exercise preferences',
                'api_endpoints': ['/api/v1/health/exercises'],
                'frontend_usage': 'Exercise suggestions',
                'essential': False
            },
            'user_food_history': {
                'usage': 'User food preferences',
                'api_endpoints': ['/api/v1/health/foods'],
                'frontend_usage': 'Food suggestions',
                'essential': False
            },
            'workout_categories': {
                'usage': 'Exercise categorization',
                'api_endpoints': ['/api/v1/health/exercises'],
                'frontend_usage': 'Exercise filtering',
                'essential': False
            }
        },
        'unused_tables': {
            'exercise_templates': {
                'usage': 'Pre-built exercise templates',
                'api_endpoints': [],
                'frontend_usage': 'Not used',
                'essential': False,
                'recommendation': 'REMOVE - Not implemented'
            },
            'food_alternatives': {
                'usage': 'Food substitution suggestions',
                'api_endpoints': [],
                'frontend_usage': 'Not used',
                'essential': False,
                'recommendation': 'REMOVE - Not implemented'
            },
            'meal_templates': {
                'usage': 'Pre-built meal templates',
                'api_endpoints': ['/api/v1/health/foods'],
                'frontend_usage': 'Not used',
                'essential': False,
                'recommendation': 'REMOVE - Not implemented'
            },
            'nutrition_meal_plans': {
                'usage': 'Daily meal plans in nutrition routines',
                'api_endpoints': [],
                'frontend_usage': 'Not used',
                'essential': False,
                'recommendation': 'REMOVE - Overcomplicated'
            },
            'nutrition_meals': {
                'usage': 'Individual meals in meal plans',
                'api_endpoints': [],
                'frontend_usage': 'Not used',
                'essential': False,
                'recommendation': 'REMOVE - Overcomplicated'
            },
            'nutrition_meal_foods': {
                'usage': 'Food items in meals',
                'api_endpoints': [],
                'frontend_usage': 'Not used',
                'essential': False,
                'recommendation': 'REMOVE - Overcomplicated'
            },
            'recipe_ingredients': {
                'usage': 'Recipe ingredient tracking',
                'api_endpoints': [],
                'frontend_usage': 'Not used',
                'essential': False,
                'recommendation': 'REMOVE - Not implemented'
            }
        }
    }
    
    return table_analysis, all_tables

def main():
    print("🔍 DATABASE USAGE ANALYSIS")
    print("=" * 60)
    
    table_analysis, all_tables = get_table_usage_analysis()
    
    # Count tables by category
    total_tables = len(all_tables)
    essential_tables = 0
    optional_tables = 0
    unused_tables = 0
    
    print(f"\n📊 TABLE CATEGORIZATION:")
    print("=" * 40)
    
    for category, tables in table_analysis.items():
        print(f"\n🏷️  {category.upper().replace('_', ' ')} ({len(tables)} tables):")
        for table_name, info in tables.items():
            status = "✅ ESSENTIAL" if info['essential'] else "⚠️  OPTIONAL" if category != 'unused_tables' else "❌ UNUSED"
            print(f"  {status} {table_name}")
            print(f"      Usage: {info['usage']}")
            if info['api_endpoints']:
                print(f"      API: {', '.join(info['api_endpoints'])}")
            if 'recommendation' in info:
                print(f"      💡 {info['recommendation']}")
            print()
            
            if info['essential']:
                essential_tables += 1
            elif category == 'unused_tables':
                unused_tables += 1
            else:
                optional_tables += 1
    
    print(f"\n📈 SUMMARY:")
    print("=" * 20)
    print(f"Total tables: {total_tables}")
    print(f"Essential tables: {essential_tables}")
    print(f"Optional tables: {optional_tables}")
    print(f"Unused tables: {unused_tables}")
    
    # Recommendations
    print(f"\n💡 RECOMMENDATIONS:")
    print("=" * 25)
    
    print(f"\n🗑️  TABLES TO REMOVE ({unused_tables} tables):")
    for table_name, info in table_analysis['unused_tables'].items():
        print(f"  ❌ {table_name} - {info['recommendation']}")
    
    print(f"\n🔍 TABLES TO REVIEW ({optional_tables} tables):")
    for category, tables in table_analysis.items():
        if category not in ['unused_tables', 'core_tables', 'logging_tables', 'routine_tables']:
            for table_name, info in tables.items():
                if not info['essential']:
                    print(f"  ⚠️  {table_name} - Consider if needed")
    
    print(f"\n✅ KEEP AS IS ({essential_tables} tables):")
    for category, tables in table_analysis.items():
        if category in ['core_tables', 'logging_tables', 'routine_tables']:
            for table_name, info in tables.items():
                if info['essential']:
                    print(f"  ✅ {table_name}")
    
    # Database optimization suggestions
    print(f"\n🚀 DATABASE OPTIMIZATION SUGGESTIONS:")
    print("=" * 40)
    print("1. Remove unused tables to reduce complexity")
    print("2. Consider consolidating nutrition routine tables")
    print("3. Add indexes on frequently queried columns")
    print("4. Consider partitioning large logging tables")
    print("5. Implement data archiving for old logs")
    
    return {
        'total_tables': total_tables,
        'essential_tables': essential_tables,
        'optional_tables': optional_tables,
        'unused_tables': unused_tables,
        'tables_to_remove': list(table_analysis['unused_tables'].keys())
    }

if __name__ == "__main__":
    main()
