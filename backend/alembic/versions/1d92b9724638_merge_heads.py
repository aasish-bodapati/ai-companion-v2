"""merge heads

Revision ID: 1d92b9724638
Revises: 908af64ce8c4, create_food_log_items
Create Date: 2025-09-19 15:53:12.471401

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1d92b9724638'
down_revision = ('908af64ce8c4', 'create_food_log_items')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
