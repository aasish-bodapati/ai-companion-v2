"""merge schema improvements

Revision ID: bac29afa104f
Revises: improve_schema_phase2, improve_schema_phase3
Create Date: 2025-09-14 21:29:10.684109

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'bac29afa104f'
down_revision = ('improve_schema_phase2_sqlite', 'improve_schema_phase3_sqlite')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
