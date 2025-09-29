"""add_body_type_goals_table_manual

Revision ID: add_body_type_goals_manual
Revises: c266d7fdb80e
Create Date: 2025-09-30 00:20:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_body_type_goals_manual'
down_revision = 'c266d7fdb80e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create body_type_goals table
    op.create_table('body_type_goals',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('category', sa.String(), nullable=False, server_default='body_type'),
        sa.Column('icon', sa.String(), nullable=False),
        sa.Column('color', sa.String(), nullable=False),
        sa.Column('target_bmi', sa.Float(), nullable=False),
        sa.Column('target_body_fat', sa.Float(), nullable=True),
        sa.Column('target_attributes', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('sort_order', sa.Integer(), nullable=True, server_default='0'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('body_type_goals')
