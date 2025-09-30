"""add_database_improvements_audit_soft_delete_indexes

Revision ID: 55f8f148215b
Revises: b1b4ae50e428
Create Date: 2025-09-30 23:35:55.802205

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '55f8f148215b'
down_revision = 'b1b4ae50e428'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add UUID extension
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    
    # Add audit columns to all main tables
    tables_to_update = [
        'users', 'nutrition_logs', 'fitness_logs', 'mood_logs', 'water_logs',
        'onboarding_profiles', 'user_health_profile', 'user_weight_logs',
        'user_goals', 'simple_routines', 'nutrition_routines',
        'simple_user_routine_progress', 'nutrition_user_routine_progress',
        'routine_workout_days', 'routine_exercises', 'exercises', 'foods',
        'exercise_logging_categories', 'body_type_goals', 'indian_foods'
    ]
    
    for table in tables_to_update:
        # Check if table exists before adding columns
        conn = op.get_bind()
        inspector = sa.inspect(conn)
        existing_columns = [col['name'] for col in inspector.get_columns(table)]
        
        # Add UUID column if it doesn't exist
        if 'uuid' not in existing_columns:
            op.add_column(table, sa.Column('uuid', sa.UUID(), nullable=True, server_default=sa.text('uuid_generate_v4()')))
            # Create unique constraint on UUID
            op.create_unique_constraint(f'uq_{table}_uuid', table, ['uuid'])
        
        # Add audit columns if they don't exist
        if 'created_by' not in existing_columns:
            op.add_column(table, sa.Column('created_by', sa.Integer(), nullable=True))
        elif table == 'body_type_goals':
            # Convert existing VARCHAR created_by to INTEGER
            # First drop any default value and make nullable, then convert type
            op.execute(f'ALTER TABLE {table} ALTER COLUMN created_by DROP DEFAULT')
            op.execute(f'ALTER TABLE {table} ALTER COLUMN created_by DROP NOT NULL')
            op.execute(f'ALTER TABLE {table} ALTER COLUMN created_by TYPE INTEGER USING CASE WHEN created_by ~ \'^[0-9]+$\' THEN created_by::INTEGER ELSE NULL END')
        if 'updated_by' not in existing_columns:
            op.add_column(table, sa.Column('updated_by', sa.Integer(), nullable=True))
        
        # Add soft delete columns if they don't exist
        if 'deleted_at' not in existing_columns:
            op.add_column(table, sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))
        if 'deleted_by' not in existing_columns:
            op.add_column(table, sa.Column('deleted_by', sa.Integer(), nullable=True))
        
        # Add foreign key constraints for audit columns (check if they don't exist)
        existing_fks = [fk['name'] for fk in inspector.get_foreign_keys(table)]
        
        if f'fk_{table}_created_by' not in existing_fks:
            op.create_foreign_key(
                f'fk_{table}_created_by',
                table, 'users',
                ['created_by'], ['id'],
                ondelete='SET NULL'
            )
        if f'fk_{table}_updated_by' not in existing_fks:
            op.create_foreign_key(
                f'fk_{table}_updated_by',
                table, 'users',
                ['updated_by'], ['id'],
                ondelete='SET NULL'
            )
        if f'fk_{table}_deleted_by' not in existing_fks:
            op.create_foreign_key(
                f'fk_{table}_deleted_by',
                table, 'users',
                ['deleted_by'], ['id'],
                ondelete='SET NULL'
            )
    
    # Add missing composite indexes for better query performance
    existing_indexes = [idx['name'] for idx in inspector.get_indexes('nutrition_logs')]
    if 'idx_nutrition_logs_user_meal_date' not in existing_indexes:
        op.create_index('idx_nutrition_logs_user_meal_date', 'nutrition_logs', ['user_id', 'meal_date'])
    
    existing_indexes = [idx['name'] for idx in inspector.get_indexes('fitness_logs')]
    if 'idx_fitness_logs_user_activity_date' not in existing_indexes:
        op.create_index('idx_fitness_logs_user_activity_date', 'fitness_logs', ['user_id', 'activity_date'])
    
    existing_indexes = [idx['name'] for idx in inspector.get_indexes('mood_logs')]
    if 'idx_mood_logs_user_date' not in existing_indexes:
        op.create_index('idx_mood_logs_user_date', 'mood_logs', ['user_id', 'mood_date'])
    
    existing_indexes = [idx['name'] for idx in inspector.get_indexes('water_logs')]
    if 'idx_water_logs_user_date' not in existing_indexes:
        op.create_index('idx_water_logs_user_date', 'water_logs', ['user_id', 'log_date'])
    
    # Add indexes for soft delete queries
    if 'idx_nutrition_logs_deleted_at' not in existing_indexes:
        op.create_index('idx_nutrition_logs_deleted_at', 'nutrition_logs', ['deleted_at'])
    
    existing_indexes = [idx['name'] for idx in inspector.get_indexes('fitness_logs')]
    if 'idx_fitness_logs_deleted_at' not in existing_indexes:
        op.create_index('idx_fitness_logs_deleted_at', 'fitness_logs', ['deleted_at'])
    
    existing_indexes = [idx['name'] for idx in inspector.get_indexes('users')]
    if 'idx_users_deleted_at' not in existing_indexes:
        op.create_index('idx_users_deleted_at', 'users', ['deleted_at'])
    
    # Add indexes for audit queries
    existing_indexes = [idx['name'] for idx in inspector.get_indexes('nutrition_logs')]
    if 'idx_nutrition_logs_created_by' not in existing_indexes:
        op.create_index('idx_nutrition_logs_created_by', 'nutrition_logs', ['created_by'])
    
    existing_indexes = [idx['name'] for idx in inspector.get_indexes('fitness_logs')]
    if 'idx_fitness_logs_created_by' not in existing_indexes:
        op.create_index('idx_fitness_logs_created_by', 'fitness_logs', ['created_by'])
    
    # Standardize JSON types - convert JSON to JSONB for better performance
    # Check if columns exist and are JSON type before converting
    nutrition_columns = [col['name'] for col in inspector.get_columns('nutrition_logs')]
    if 'food_items' in nutrition_columns:
        op.execute('ALTER TABLE nutrition_logs ALTER COLUMN food_items TYPE JSONB USING food_items::JSONB')
    
    fitness_columns = [col['name'] for col in inspector.get_columns('fitness_logs')]
    if 'exercises' in fitness_columns:
        op.execute('ALTER TABLE fitness_logs ALTER COLUMN exercises TYPE JSONB USING exercises::JSONB')
    
    # Add check constraints for soft delete
    op.create_check_constraint(
        'ck_nutrition_logs_soft_delete',
        'nutrition_logs',
        'deleted_at IS NULL OR deleted_by IS NOT NULL'
    )
    op.create_check_constraint(
        'ck_fitness_logs_soft_delete',
        'fitness_logs',
        'deleted_at IS NULL OR deleted_by IS NOT NULL'
    )
    op.create_check_constraint(
        'ck_users_soft_delete',
        'users',
        'deleted_at IS NULL OR deleted_by IS NOT NULL'
    )


def downgrade() -> None:
    # Remove check constraints
    op.drop_constraint('ck_users_soft_delete', 'users', type_='check')
    op.drop_constraint('ck_fitness_logs_soft_delete', 'fitness_logs', type_='check')
    op.drop_constraint('ck_nutrition_logs_soft_delete', 'nutrition_logs', type_='check')
    
    # Revert JSONB to JSON
    op.execute('ALTER TABLE fitness_logs ALTER COLUMN exercises TYPE JSON USING exercises::JSON')
    op.execute('ALTER TABLE nutrition_logs ALTER COLUMN food_items TYPE JSON USING food_items::JSON')
    
    # Remove indexes
    op.drop_index('idx_fitness_logs_created_by', 'fitness_logs')
    op.drop_index('idx_nutrition_logs_created_by', 'nutrition_logs')
    op.drop_index('idx_users_deleted_at', 'users')
    op.drop_index('idx_fitness_logs_deleted_at', 'fitness_logs')
    op.drop_index('idx_nutrition_logs_deleted_at', 'nutrition_logs')
    op.drop_index('idx_water_logs_user_date', 'water_logs')
    op.drop_index('idx_mood_logs_user_date', 'mood_logs')
    op.drop_index('idx_fitness_logs_user_activity_date', 'fitness_logs')
    op.drop_index('idx_nutrition_logs_user_meal_date', 'nutrition_logs')
    
    # Remove columns from all tables
    tables_to_update = [
        'users', 'nutrition_logs', 'fitness_logs', 'mood_logs', 'water_logs',
        'onboarding_profiles', 'user_health_profile', 'user_weight_logs',
        'user_goals', 'simple_routines', 'nutrition_routines',
        'simple_user_routine_progress', 'nutrition_user_routine_progress',
        'routine_workout_days', 'routine_exercises', 'exercises', 'foods',
        'exercise_logging_categories', 'body_type_goals', 'indian_foods'
    ]
    
    for table in tables_to_update:
        # Drop foreign key constraints
        op.drop_constraint(f'fk_{table}_deleted_by', table, type_='foreignkey')
        op.drop_constraint(f'fk_{table}_updated_by', table, type_='foreignkey')
        op.drop_constraint(f'fk_{table}_created_by', table, type_='foreignkey')
        
        # Drop columns
        op.drop_column(table, 'deleted_by')
        op.drop_column(table, 'deleted_at')
        op.drop_column(table, 'updated_by')
        op.drop_column(table, 'created_by')
        op.drop_column(table, 'uuid')
    
    # Drop UUID extension
    op.execute('DROP EXTENSION IF EXISTS "uuid-ossp"')
