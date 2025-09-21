"""Add exercise logging categories based on attributes

Revision ID: add_exercise_logging_categories_targeted
Revises: c1a66bda425e
Create Date: 2025-09-19 19:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_exercise_logging_cats'
down_revision = 'c1a66bda425e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create the exercise_logging_categories table
    op.create_table('exercise_logging_categories',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('category', sa.Enum('bodyweight', 'weighted', 'cardio_duration', 'hold_static', 'repetition_only', 'distance_based', name='exerciseloggingcategoryenum'), nullable=False),
        sa.Column('display_name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('logging_attributes', sa.JSON(), nullable=False),
        sa.Column('icon', sa.String(length=50), nullable=True),
        sa.Column('color', sa.String(length=20), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    
    # Create index for the category enum
    op.create_index('ix_exercise_logging_categories_category', 'exercise_logging_categories', ['category'], unique=False)
    
    # Add new columns to exercises table
    op.add_column('exercises', sa.Column('logging_category', sa.Enum('bodyweight', 'weighted', 'cardio_duration', 'hold_static', 'repetition_only', 'distance_based', name='exerciseloggingcategoryenum'), nullable=True))
    
    # Create index for the new logging_category column
    op.create_index('ix_exercises_logging_category', 'exercises', ['logging_category'], unique=False)
    
    # Insert the predefined logging categories
    op.execute("""
        INSERT INTO exercise_logging_categories (name, category, display_name, description, logging_attributes, icon, color, is_active, sort_order) VALUES
        ('bodyweight', 'bodyweight', 'Bodyweight Exercises', 'Exercises using only your body weight', 
         '{"required": [{"name": "sets", "type": "number", "label": "Sets", "min": 1, "max": 50}, {"name": "reps", "type": "number", "label": "Reps", "min": 1, "max": 1000}], "optional": [{"name": "notes", "type": "text", "label": "Notes", "max_length": 500}]}', 
         'user', 'blue', true, 1),
        
        ('weighted', 'weighted', 'Weighted Exercises', 'Exercises with external weights', 
         '{"required": [{"name": "sets", "type": "number", "label": "Sets", "min": 1, "max": 50}, {"name": "reps", "type": "number", "label": "Reps", "min": 1, "max": 1000}, {"name": "weight", "type": "number", "label": "Weight", "min": 0, "max": 1000}], "optional": [{"name": "weight_unit", "type": "select", "label": "Weight Unit", "options": ["lbs", "kg"]}, {"name": "notes", "type": "text", "label": "Notes", "max_length": 500}]}', 
         'dumbbell', 'red', true, 2),
        
        ('cardio_duration', 'cardio_duration', 'Cardio & Duration', 'Cardiovascular exercises tracked by time', 
         '{"required": [{"name": "duration", "type": "number", "label": "Duration (minutes)", "min": 1, "max": 600}], "optional": [{"name": "distance", "type": "number", "label": "Distance", "min": 0, "max": 1000}, {"name": "distance_unit", "type": "select", "label": "Distance Unit", "options": ["miles", "km", "meters"]}, {"name": "intensity", "type": "select", "label": "Intensity", "options": ["low", "medium", "high"]}, {"name": "heart_rate", "type": "number", "label": "Heart Rate (bpm)", "min": 40, "max": 220}, {"name": "notes", "type": "text", "label": "Notes", "max_length": 500}]}', 
         'heart', 'green', true, 3),
        
        ('hold_static', 'hold_static', 'Hold & Static', 'Static holds and isometric exercises', 
         '{"required": [{"name": "duration", "type": "number", "label": "Hold Time (seconds)", "min": 1, "max": 3600}], "optional": [{"name": "difficulty", "type": "select", "label": "Difficulty", "options": ["beginner", "intermediate", "advanced"]}, {"name": "notes", "type": "text", "label": "Notes", "max_length": 500}]}', 
         'clock', 'purple', true, 4),
        
        ('repetition_only', 'repetition_only', 'Repetition Only', 'Simple repetition-based exercises', 
         '{"required": [{"name": "total_reps", "type": "number", "label": "Total Reps", "min": 1, "max": 10000}], "optional": [{"name": "notes", "type": "text", "label": "Notes", "max_length": 500}]}', 
         'repeat', 'orange', true, 5),
        
        ('distance_based', 'distance_based', 'Distance Based', 'Exercises tracked by distance and time', 
         '{"required": [{"name": "distance", "type": "number", "label": "Distance", "min": 0.1, "max": 1000}, {"name": "time", "type": "number", "label": "Time (minutes)", "min": 1, "max": 600}], "optional": [{"name": "distance_unit", "type": "select", "label": "Distance Unit", "options": ["miles", "km", "meters"]}, {"name": "pace", "type": "text", "label": "Pace (e.g., 8:30/mile)", "max_length": 20}, {"name": "notes", "type": "text", "label": "Notes", "max_length": 500}]}', 
         'map', 'teal', true, 6);
    """)


def downgrade() -> None:
    # Drop the new index
    op.drop_index('ix_exercises_logging_category', table_name='exercises')
    
    # Drop the new column
    op.drop_column('exercises', 'logging_category')
    
    # Drop the exercise_logging_categories table
    op.drop_table('exercise_logging_categories')
    
    # Drop the enum type
    op.execute('DROP TYPE IF EXISTS exerciseloggingcategoryenum')
