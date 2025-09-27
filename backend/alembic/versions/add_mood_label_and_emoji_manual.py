"""add_mood_label_and_emoji_manual

Revision ID: add_mood_label_and_emoji_manual
Revises: 9e617536b0da
Create Date: 2025-09-26 21:25:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_mood_label_and_emoji_manual'
down_revision = '9e617536b0da'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add mood_label and mood_emoji columns to mood_logs table
    op.add_column('mood_logs', sa.Column('mood_label', sa.String(50), nullable=True))
    op.add_column('mood_logs', sa.Column('mood_emoji', sa.String(10), nullable=True))


def downgrade() -> None:
    # Remove mood_label and mood_emoji columns from mood_logs table
    op.drop_column('mood_logs', 'mood_emoji')
    op.drop_column('mood_logs', 'mood_label')
