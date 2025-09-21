"""merge heads

Revision ID: fa027e8b4966
Revises: 1d92b9724638, standardize_integer_ids
Create Date: 2025-09-19 17:30:05.381760

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fa027e8b4966'
down_revision = ('1d92b9724638', 'standardize_integer_ids')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
