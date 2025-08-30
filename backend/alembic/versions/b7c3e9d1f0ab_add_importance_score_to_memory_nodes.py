"""add importance_score to memory_nodes

Revision ID: b7c3e9d1f0ab
Revises: a1b2c3d4e5f6
Create Date: 2025-08-13 01:44:00.000000

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "b7c3e9d1f0ab"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add column with default 0 and non-null constraint
    op.add_column(
        "memory_nodes",
        sa.Column("importance_score", sa.Integer(), nullable=False, server_default=sa.text("0")),
    )
    # Backfill from relevance_score (0..1) -> importance_score (0..100)
    # Use integer rounding and clamp via SQL expressions
    op.execute(
        """
        UPDATE memory_nodes
        SET importance_score = CASE
            WHEN relevance_score IS NULL THEN 0
            WHEN relevance_score < 0 THEN 0
            WHEN relevance_score > 1 THEN 100
            ELSE CAST(ROUND(relevance_score * 100.0) AS INTEGER)
        END
        """
    )
    # Remove server_default after backfill to keep model-managed defaults
    with op.batch_alter_table("memory_nodes") as batch_op:
        batch_op.alter_column("importance_score", server_default=None)


def downgrade() -> None:
    op.drop_column("memory_nodes", "importance_score")
