"""create_exercise_logging_categories_table

Revision ID: e92d1b5dc214
Revises: 484880808bc1
Create Date: 2025-09-21 07:03:18.211466

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e92d1b5dc214'
down_revision = '484880808bc1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create exercise_logging_categories table
    op.create_table('exercise_logging_categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('category', sa.Enum('bodyweight', 'weighted', 'cardio_duration', 'hold_static', 'repetition_only', 'distance_based', name='exerciseloggingcategoryenum', create_type=False), nullable=False),
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
    
    # Create index
    op.create_index('ix_exercise_logging_categories_category', 'exercise_logging_categories', ['category'])
    
    # Insert default categories
    categories_data = [
        {
            'name': 'bodyweight',
            'category': 'bodyweight',
            'display_name': 'Bodyweight Exercises',
            'description': 'Exercises using only your body weight',
            'logging_attributes': {
                'required': [
                    {'name': 'sets', 'type': 'number', 'label': 'Sets', 'min': 1, 'max': 50},
                    {'name': 'reps', 'type': 'number', 'label': 'Reps', 'min': 1, 'max': 1000}
                ],
                'optional': [
                    {'name': 'notes', 'type': 'text', 'label': 'Notes', 'max_length': 500}
                ]
            },
            'icon': 'user',
            'color': 'blue',
            'is_active': True,
            'sort_order': 1
        },
        {
            'name': 'weighted',
            'category': 'weighted',
            'display_name': 'Weighted Exercises',
            'description': 'Exercises with external weights',
            'logging_attributes': {
                'required': [
                    {'name': 'sets', 'type': 'number', 'label': 'Sets', 'min': 1, 'max': 50},
                    {'name': 'reps', 'type': 'number', 'label': 'Reps', 'min': 1, 'max': 1000},
                    {'name': 'weight', 'type': 'number', 'label': 'Weight', 'min': 0, 'max': 1000}
                ],
                'optional': [
                    {'name': 'weight_unit', 'type': 'select', 'label': 'Weight Unit', 'options': ['lbs', 'kg']},
                    {'name': 'notes', 'type': 'text', 'label': 'Notes', 'max_length': 500}
                ]
            },
            'icon': 'dumbbell',
            'color': 'red',
            'is_active': True,
            'sort_order': 2
        },
        {
            'name': 'cardio_duration',
            'category': 'cardio_duration',
            'display_name': 'Cardio & Duration',
            'description': 'Cardiovascular exercises tracked by time',
            'logging_attributes': {
                'required': [
                    {'name': 'duration', 'type': 'number', 'label': 'Duration (minutes)', 'min': 1, 'max': 600}
                ],
                'optional': [
                    {'name': 'distance', 'type': 'number', 'label': 'Distance', 'min': 0, 'max': 1000},
                    {'name': 'distance_unit', 'type': 'select', 'label': 'Distance Unit', 'options': ['miles', 'km', 'meters']},
                    {'name': 'intensity', 'type': 'select', 'label': 'Intensity', 'options': ['low', 'medium', 'high']},
                    {'name': 'heart_rate', 'type': 'number', 'label': 'Heart Rate (bpm)', 'min': 40, 'max': 220},
                    {'name': 'notes', 'type': 'text', 'label': 'Notes', 'max_length': 500}
                ]
            },
            'icon': 'heart',
            'color': 'green',
            'is_active': True,
            'sort_order': 3
        },
        {
            'name': 'hold_static',
            'category': 'hold_static',
            'display_name': 'Hold & Static',
            'description': 'Static holds and isometric exercises',
            'logging_attributes': {
                'required': [
                    {'name': 'duration', 'type': 'number', 'label': 'Hold Time (seconds)', 'min': 1, 'max': 3600}
                ],
                'optional': [
                    {'name': 'difficulty', 'type': 'select', 'label': 'Difficulty', 'options': ['beginner', 'intermediate', 'advanced']},
                    {'name': 'notes', 'type': 'text', 'label': 'Notes', 'max_length': 500}
                ]
            },
            'icon': 'clock',
            'color': 'purple',
            'is_active': True,
            'sort_order': 4
        },
        {
            'name': 'repetition_only',
            'category': 'repetition_only',
            'display_name': 'Repetition Only',
            'description': 'Simple repetition-based exercises',
            'logging_attributes': {
                'required': [
                    {'name': 'total_reps', 'type': 'number', 'label': 'Total Reps', 'min': 1, 'max': 10000}
                ],
                'optional': [
                    {'name': 'notes', 'type': 'text', 'label': 'Notes', 'max_length': 500}
                ]
            },
            'icon': 'repeat',
            'color': 'orange',
            'is_active': True,
            'sort_order': 5
        },
        {
            'name': 'distance_based',
            'category': 'distance_based',
            'display_name': 'Distance Based',
            'description': 'Exercises tracked by distance and time',
            'logging_attributes': {
                'required': [
                    {'name': 'distance', 'type': 'number', 'label': 'Distance', 'min': 0.1, 'max': 1000},
                    {'name': 'time', 'type': 'number', 'label': 'Time (minutes)', 'min': 1, 'max': 600}
                ],
                'optional': [
                    {'name': 'distance_unit', 'type': 'select', 'label': 'Distance Unit', 'options': ['miles', 'km', 'meters']},
                    {'name': 'pace', 'type': 'text', 'label': 'Pace (e.g., 8:30/mile)', 'max_length': 20},
                    {'name': 'notes', 'type': 'text', 'label': 'Notes', 'max_length': 500}
                ]
            },
            'icon': 'map',
            'color': 'teal',
            'is_active': True,
            'sort_order': 6
        }
    ]
    
    # Insert the categories
    for category_data in categories_data:
        op.execute(
            sa.text("""
                INSERT INTO exercise_logging_categories 
                (name, category, display_name, description, logging_attributes, icon, color, is_active, sort_order)
                VALUES (:name, :category, :display_name, :description, :logging_attributes, :icon, :color, :is_active, :sort_order)
            """),
            category_data
        )


def downgrade() -> None:
    # Drop the table
    op.drop_index('ix_exercise_logging_categories_category', table_name='exercise_logging_categories')
    op.drop_table('exercise_logging_categories')
