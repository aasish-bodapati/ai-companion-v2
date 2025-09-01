"""merge onboarding fields migrations

Revision ID: f76bbf264c03
Revises: add_prompt_based_onboarding, 9cac6e7ed734
Create Date: 2025-09-01 01:10:10.872563

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f76bbf264c03'
down_revision = ('add_prompt_based_onboarding', '9cac6e7ed734')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
