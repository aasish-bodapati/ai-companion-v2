"""add prompt based onboarding fields

Revision ID: add_prompt_based_onboarding
Revises: c073d610868f
Create Date: 2025-01-27 12:00:00.000000

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "add_prompt_based_onboarding"
down_revision = "c073d610868f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new fields to onboarding_profiles table
    op.add_column("onboarding_profiles", sa.Column("user_prompt", sa.TEXT(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("processed_summary", sa.TEXT(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("memory_chunks", sa.TEXT(), nullable=True))  # JSON as TEXT for SQLite
    op.add_column("onboarding_profiles", sa.Column("structured_data", sa.TEXT(), nullable=True))  # JSON as TEXT for SQLite


def downgrade() -> None:
    # Remove the added columns
    op.drop_column("onboarding_profiles", "user_prompt")
    op.drop_column("onboarding_profiles", "processed_summary")
    op.drop_column("onboarding_profiles", "memory_chunks")
    op.drop_column("onboarding_profiles", "structured_data")
