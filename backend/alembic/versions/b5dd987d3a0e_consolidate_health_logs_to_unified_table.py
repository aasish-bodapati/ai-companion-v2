"""consolidate_health_logs_to_unified_table

Revision ID: b5dd987d3a0e
Revises: a28fa9496f7f
Create Date: 2025-10-13 03:14:33.071188

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b5dd987d3a0e'
down_revision = 'a28fa9496f7f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create unified_health_logs table
    op.create_table('unified_health_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('log_type', sa.String(50), nullable=False),  # 'fitness', 'nutrition', 'mood', 'water', 'weight'
        sa.Column('log_date', sa.Date(), nullable=False),
        sa.Column('log_time', sa.Time(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        
        # Flexible JSON data for different log types
        sa.Column('data', sa.JSON(), nullable=True),
        
        # Common fields that apply to multiple log types
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('tags', sa.ARRAY(sa.String()), nullable=True),
        
        # Specific fields for different log types (nullable for flexibility)
        sa.Column('duration_minutes', sa.Integer(), nullable=True),  # fitness, water
        sa.Column('calories', sa.Float(), nullable=True),  # fitness, nutrition
        sa.Column('weight_kg', sa.Float(), nullable=True),  # weight
        sa.Column('mood_rating', sa.Integer(), nullable=True),  # mood (1-10)
        sa.Column('water_amount_ml', sa.Integer(), nullable=True),  # water
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    
    # Create indexes for better performance
    op.create_index('ix_unified_health_logs_user_id', 'unified_health_logs', ['user_id'])
    op.create_index('ix_unified_health_logs_log_type', 'unified_health_logs', ['log_type'])
    op.create_index('ix_unified_health_logs_log_date', 'unified_health_logs', ['log_date'])
    op.create_index('ix_unified_health_logs_user_log_type_date', 'unified_health_logs', ['user_id', 'log_type', 'log_date'])


def downgrade() -> None:
    # Drop the unified table
    op.drop_table('unified_health_logs')
