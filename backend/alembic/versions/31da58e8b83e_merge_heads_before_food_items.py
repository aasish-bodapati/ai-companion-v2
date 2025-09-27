"""merge_heads_before_food_items

Revision ID: 31da58e8b83e
Revises: 06b172b18593, add_mood_label_and_emoji_manual
Create Date: 2025-09-27 11:06:08.581773

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '31da58e8b83e'
down_revision = ('06b172b18593', 'add_mood_label_and_emoji_manual')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
