"""Standardize all tables to use integer auto-increment primary keys

Revision ID: standardize_integer_ids
Revises: 
Create Date: 2025-09-19 16:15:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'standardize_integer_ids'
down_revision = None  # This will be set to the latest migration
branch_labels = None
depends_on = None


def upgrade():
    """Convert all tables to use integer auto-increment primary keys."""
    
    # First, create new tables with integer IDs
    # Users table
    op.create_table('users_new',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('is_superuser', sa.Boolean(), nullable=True),
        sa.Column('memory_enabled', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_new_email'), 'users_new', ['email'], unique=True)
    op.create_index(op.f('ix_users_new_id'), 'users_new', ['id'], unique=False)
    
    # Copy data from old users table to new table
    op.execute("""
        INSERT INTO users_new (email, hashed_password, full_name, is_active, is_superuser, memory_enabled)
        SELECT email, hashed_password, full_name, is_active, is_superuser, memory_enabled
        FROM users
    """)
    
    # Drop old users table and rename new one
    op.drop_table('users')
    op.rename_table('users_new', 'users')
    
    # Update all foreign key references to use integer user_id
    # This is a complex migration that needs to be done carefully
    # For now, we'll create a script to handle this manually
    
    # Update fitness_logs table
    if op.get_bind().dialect.name == 'postgresql':
        op.execute("""
            ALTER TABLE fitness_logs 
            DROP CONSTRAINT IF EXISTS fk_fitness_logs_user_id_users;
        """)
        op.execute("""
            ALTER TABLE fitness_logs 
            ALTER COLUMN user_id TYPE INTEGER USING user_id::INTEGER;
        """)
        op.execute("""
            ALTER TABLE fitness_logs 
            ADD CONSTRAINT fk_fitness_logs_user_id_users 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        """)
    
    # Update nutrition_logs table
    if op.get_bind().dialect.name == 'postgresql':
        op.execute("""
            ALTER TABLE nutrition_logs 
            DROP CONSTRAINT IF EXISTS fk_nutrition_logs_user_id_users;
        """)
        op.execute("""
            ALTER TABLE nutrition_logs 
            ALTER COLUMN user_id TYPE INTEGER USING user_id::INTEGER;
        """)
        op.execute("""
            ALTER TABLE nutrition_logs 
            ADD CONSTRAINT fk_nutrition_logs_user_id_users 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        """)
    
    # Update mood_logs table
    if op.get_bind().dialect.name == 'postgresql':
        op.execute("""
            ALTER TABLE mood_logs 
            DROP CONSTRAINT IF EXISTS fk_mood_logs_user_id_users;
        """)
        op.execute("""
            ALTER TABLE mood_logs 
            ALTER COLUMN user_id TYPE INTEGER USING user_id::INTEGER;
        """)
        op.execute("""
            ALTER TABLE mood_logs 
            ADD CONSTRAINT fk_mood_logs_user_id_users 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        """)
    
    # Update weight_logs table
    if op.get_bind().dialect.name == 'postgresql':
        op.execute("""
            ALTER TABLE weight_logs 
            DROP CONSTRAINT IF EXISTS fk_weight_logs_user_id_users;
        """)
        op.execute("""
            ALTER TABLE weight_logs 
            ALTER COLUMN user_id TYPE INTEGER USING user_id::INTEGER;
        """)
        op.execute("""
            ALTER TABLE weight_logs 
            ADD CONSTRAINT fk_weight_logs_user_id_users 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        """)
    
    # Update onboarding_profiles table
    if op.get_bind().dialect.name == 'postgresql':
        op.execute("""
            ALTER TABLE onboarding_profiles 
            DROP CONSTRAINT IF EXISTS fk_onboarding_profiles_user_id_users;
        """)
        op.execute("""
            ALTER TABLE onboarding_profiles 
            ALTER COLUMN user_id TYPE INTEGER USING user_id::INTEGER;
        """)
        op.execute("""
            ALTER TABLE onboarding_profiles 
            ADD CONSTRAINT fk_onboarding_profiles_user_id_users 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        """)
    
    # Update user_health_profiles table
    if op.get_bind().dialect.name == 'postgresql':
        op.execute("""
            ALTER TABLE user_health_profiles 
            DROP CONSTRAINT IF EXISTS fk_user_health_profiles_user_id_users;
        """)
        op.execute("""
            ALTER TABLE user_health_profiles 
            ALTER COLUMN user_id TYPE INTEGER USING user_id::INTEGER;
        """)
        op.execute("""
            ALTER TABLE user_health_profiles 
            ADD CONSTRAINT fk_user_health_profiles_user_id_users 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        """)


def downgrade():
    """Revert to string UUIDs."""
    # This is complex to implement and not recommended
    # The migration should be one-way for this type of change
    pass
