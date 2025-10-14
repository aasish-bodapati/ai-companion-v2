# Archived Migrations

This document lists migrations that have been archived due to complexity or being superseded by newer migrations.

## Archived Migration Files

### Schema Consolidation Migrations (Archived)
These migrations attempted to consolidate the schema but were complex and potentially problematic:

- `b5dd987d3a0e_consolidate_health_logs_to_unified_table.py` - Attempted to create unified health logs table
- `1a91a3ba6b8c_simplify_routine_system_simple.py` - Complex routine system simplification
- `dcec4a05b40a_simplify_user_model_phase5.py` - User model simplification with JSON fields

### ID Type Migration (Archived)
- `cc0ece2c2dde_standardize_all_ids_to_integers.py` - Documented ID standardization (no actual changes)

### Table Cleanup Migrations (Archived)
- `0a28c19ec001_fix_routine_table_name_mismatch.py` - Fixed table name mismatches
- `1ca451888dc7_remove_unused_tables_phase2.py` - Removed unused tables
- `908af64ce8c4_cleanup_unused_tables_and_columns.py` - Cleaned up unused columns

### Feature-Specific Migrations (Archived)
- `add_body_type_goal_manual.py` - Manual body type goals addition
- `add_water_logs_table_manual.py` - Manual water logs table addition
- `add_mood_label_and_emoji_manual.py` - Manual mood logging enhancements

## Current Active Schema

The current database schema is defined by the latest migration and includes:

### Core Tables
- `users` - User accounts and profiles
- `fitness_logs` - Fitness activity logging
- `nutrition_logs` - Nutrition and meal logging
- `mood_logs` - Mood and wellness tracking
- `water_logs` - Water intake tracking

### Routine Tables
- `simple_routines` - Workout routines
- `nutrition_routines` - Nutrition routines
- `routine_workout_days` - Individual workout days
- `routine_exercises` - Exercises within workout days

### Data Tables
- `exercises` - Exercise database
- `foods` - Food database
- `indian_foods` - Indian food database
- `body_type_goals` - Body type specific goals

## Migration Guidelines

1. **Keep migrations simple** - One logical change per migration
2. **Test migrations thoroughly** - Always test both upgrade and downgrade
3. **Document complex changes** - Add comments explaining the reasoning
4. **Avoid data migrations in schema changes** - Separate data migrations from schema changes
5. **Use descriptive names** - Make migration purpose clear from the filename

## Current Migration Head

The current migration head is: `[LATEST_MIGRATION_ID]`

To check the current head:
```bash
alembic current
```

To see migration history:
```bash
alembic history
```
