"""merge_heads_before_cleanup

Revision ID: 299ada1b0f8c
Revises: add_exercise_logging_cats, d6e83c5521c4
Create Date: 2025-09-20 20:26:10.071173

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '299ada1b0f8c'
down_revision = ('add_exercise_logging_cats', 'd6e83c5521c4')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
