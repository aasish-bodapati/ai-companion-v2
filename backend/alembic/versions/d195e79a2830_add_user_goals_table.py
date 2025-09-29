"""add_user_goals_table

Revision ID: d195e79a2830
Revises: add_timezone_to_users
Create Date: 2025-09-29 18:17:33.317760

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd195e79a2830'
down_revision = 'add_timezone_to_users'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create user_goals table
    op.create_table('user_goals',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True, default='active'),
        sa.Column('priority', sa.String(length=10), nullable=True, default='medium'),
        sa.Column('target_date', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_goals_user_id'), 'user_goals', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_user_goals_user_id'), table_name='user_goals')
    op.drop_table('user_goals')
