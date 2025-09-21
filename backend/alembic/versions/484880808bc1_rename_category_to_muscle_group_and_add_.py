"""rename_category_to_muscle_group_and_add_logging_category

Revision ID: 484880808bc1
Revises: e27d5b9806ce
Create Date: 2025-09-21 06:57:16.492943

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '484880808bc1'
down_revision = 'e27d5b9806ce'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create the enum type first
    exercise_logging_category_enum = sa.Enum('bodyweight', 'weighted', 'cardio_duration', 'hold_static', 'repetition_only', 'distance_based', name='exerciseloggingcategoryenum')
    exercise_logging_category_enum.create(op.get_bind())
    
    # Rename subcategory column to muscle_group
    op.alter_column('exercises', 'subcategory', new_column_name='muscle_group')
    
    # Add logging_category column
    op.add_column('exercises', sa.Column('logging_category', exercise_logging_category_enum, nullable=True))
    
    # Create index for logging_category
    op.create_index('ix_exercises_logging_category', 'exercises', ['logging_category'])


def downgrade() -> None:
    # Drop logging_category index and column
    op.drop_index('ix_exercises_logging_category', table_name='exercises')
    op.drop_column('exercises', 'logging_category')
    
    # Rename muscle_group back to subcategory
    op.alter_column('exercises', 'muscle_group', new_column_name='subcategory')
    
    # Drop the enum type
    exercise_logging_category_enum = sa.Enum('bodyweight', 'weighted', 'cardio_duration', 'hold_static', 'repetition_only', 'distance_based', name='exerciseloggingcategoryenum')
    exercise_logging_category_enum.drop(op.get_bind())
