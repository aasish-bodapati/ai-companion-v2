"""add notes, tasks, reminders tables

Revision ID: 1a2b3c4d5e67
Revises: 9dc946f3fd6e
Create Date: 2025-08-24 21:50:00.000000

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "1a2b3c4d5e67"
down_revision = "9dc946f3fd6e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # notes
    op.create_table(
        "notes",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column(
            "user_id",
            sa.String(length=36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("body", sa.String(), nullable=True),
        sa.Column("tags", sa.String(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.create_index("ix_notes_user_id", "notes", ["user_id"], unique=False)

    # tasks
    op.create_table(
        "tasks",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column(
            "user_id",
            sa.String(length=36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("priority", sa.String(), nullable=True),
        sa.Column("tags", sa.String(), nullable=True),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.create_index("ix_tasks_user_id", "tasks", ["user_id"], unique=False)

    # reminders
    op.create_table(
        "reminders",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column(
            "user_id",
            sa.String(length=36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("content", sa.String(), nullable=False),
        sa.Column("trigger_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("channel", sa.String(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.create_index("ix_reminders_user_id", "reminders", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_reminders_user_id", table_name="reminders")
    op.drop_table("reminders")

    op.drop_index("ix_tasks_user_id", table_name="tasks")
    op.drop_table("tasks")

    op.drop_index("ix_notes_user_id", table_name="notes")
    op.drop_table("notes")
