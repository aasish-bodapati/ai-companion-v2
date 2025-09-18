"""merge_heads

Revision ID: 2eb5dd9c02c2
Revises: bac29afa104f, improve_schema_phase2, improve_schema_phase3
Create Date: 2025-09-16 13:20:26.356700

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2eb5dd9c02c2'
down_revision = ('bac29afa104f', 'improve_schema_phase2', 'improve_schema_phase3')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
