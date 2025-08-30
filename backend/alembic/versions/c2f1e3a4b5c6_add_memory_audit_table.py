"""add memory_audit table

Revision ID: c2f1e3a4b5c6
Revises: 8eb5c2f99984
Create Date: 2025-08-25 22:28:00.000000

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "c2f1e3a4b5c6"
down_revision = "8eb5c2f99984"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "memory_audit",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("faiss_id", sa.String(length=36), nullable=False),
        sa.Column("action", sa.String(length=32), nullable=False),
        sa.Column("source", sa.String(length=64), nullable=True),
        sa.Column("conversation_id", sa.String(length=36), nullable=True),
        sa.Column("message_id", sa.String(length=36), nullable=True),
        sa.Column("before_content", sa.Text(), nullable=True),
        sa.Column("after_content", sa.Text(), nullable=True),
        sa.Column("before_metadata", sa.Text(), nullable=True),
        sa.Column("after_metadata", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_memory_audit_user_id"), "memory_audit", ["user_id"], unique=False)
    op.create_index(op.f("ix_memory_audit_faiss_id"), "memory_audit", ["faiss_id"], unique=False)
    op.create_index(op.f("ix_memory_audit_action"), "memory_audit", ["action"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_memory_audit_action"), table_name="memory_audit")
    op.drop_index(op.f("ix_memory_audit_faiss_id"), table_name="memory_audit")
    op.drop_index(op.f("ix_memory_audit_user_id"), table_name="memory_audit")
    op.drop_table("memory_audit")
