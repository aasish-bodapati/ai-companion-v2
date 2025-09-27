"""add_water_logs_table_manual

Revision ID: add_water_logs_manual
Revises: 79bdb801f3be
Create Date: 2025-09-26 10:50:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_water_logs_manual'
down_revision = '79bdb801f3be'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create water_logs table
    op.create_table('water_logs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('amount_ml', sa.Integer(), nullable=False),
        sa.Column('amount_oz', sa.Float(), nullable=True),
        sa.Column('log_type', sa.String(length=20), nullable=False, server_default='manual'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('log_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='water_logs_user_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='water_logs_pkey'),
        sa.CheckConstraint('amount_ml > 0 AND amount_ml <= 10000', name='ck_water_logs_amount_ml'),
        sa.CheckConstraint("log_type IN ('manual', 'goal', 'reminder')", name='ck_water_logs_log_type')
    )
    
    # Create indexes
    op.create_index('idx_water_logs_user_id', 'water_logs', ['user_id'], unique=False)
    op.create_index('idx_water_logs_log_date', 'water_logs', ['log_date'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_water_logs_log_date', table_name='water_logs')
    op.drop_index('idx_water_logs_user_id', table_name='water_logs')
    
    # Drop table
    op.drop_table('water_logs')
