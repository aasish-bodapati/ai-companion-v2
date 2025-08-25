"""update onboarding to fact based

Revision ID: update_onboarding_to_fact_based
Revises: 8eb5c2f99984
Create Date: 2025-01-27 10:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "update_onboarding_to_fact_based"
down_revision = "8eb5c2f99984"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop old columns
    op.drop_column("onboarding_profiles", "name")
    op.drop_column("onboarding_profiles", "nickname")
    op.drop_column("onboarding_profiles", "pronouns")
    op.drop_column("onboarding_profiles", "birthday")
    op.drop_column("onboarding_profiles", "location")
    op.drop_column("onboarding_profiles", "topics_json")
    op.drop_column("onboarding_profiles", "hobbies")
    op.drop_column("onboarding_profiles", "favorites")
    op.drop_column("onboarding_profiles", "response_style")
    op.drop_column("onboarding_profiles", "tone_json")
    op.drop_column("onboarding_profiles", "small_talk_level")
    op.drop_column("onboarding_profiles", "primary_reason")
    op.drop_column("onboarding_profiles", "personal_goals")
    op.drop_column("onboarding_profiles", "checkins_enabled")
    op.drop_column("onboarding_profiles", "avoid_topics")
    op.drop_column("onboarding_profiles", "memory_policy")
    op.drop_column("onboarding_profiles", "recall_enabled")
    op.drop_column("onboarding_profiles", "dream_trip")
    op.drop_column("onboarding_profiles", "random_fact")
    op.drop_column("onboarding_profiles", "ai_persona")

    # Add new fact-based columns
    op.add_column("onboarding_profiles", sa.Column("occupation", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("industry", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("company_size", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("work_schedule", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("primary_tools", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("current_project", sa.Text(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("current_challenge", sa.Text(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("help_preference", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("primary_device", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("tech_comfort", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("technical_constraints", sa.Text(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("weekly_goals", sa.Text(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("timeline", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("daily_time", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("additional_context", sa.Text(), nullable=True))


def downgrade() -> None:
    # Drop new columns
    op.drop_column("onboarding_profiles", "occupation")
    op.drop_column("onboarding_profiles", "industry")
    op.drop_column("onboarding_profiles", "company_size")
    op.drop_column("onboarding_profiles", "work_schedule")
    op.drop_column("onboarding_profiles", "primary_tools")
    op.drop_column("onboarding_profiles", "current_project")
    op.drop_column("onboarding_profiles", "current_challenge")
    op.drop_column("onboarding_profiles", "help_preference")
    op.drop_column("onboarding_profiles", "primary_device")
    op.drop_column("onboarding_profiles", "tech_comfort")
    op.drop_column("onboarding_profiles", "technical_constraints")
    op.drop_column("onboarding_profiles", "weekly_goals")
    op.drop_column("onboarding_profiles", "timeline")
    op.drop_column("onboarding_profiles", "daily_time")
    op.drop_column("onboarding_profiles", "additional_context")

    # Re-add old columns
    op.add_column("onboarding_profiles", sa.Column("name", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("nickname", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("pronouns", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("birthday", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("location", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("topics_json", sa.Text(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("hobbies", sa.Text(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("favorites", sa.Text(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("response_style", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("tone_json", sa.Text(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("small_talk_level", sa.Integer(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("primary_reason", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("personal_goals", sa.Text(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("checkins_enabled", sa.Boolean(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("avoid_topics", sa.Text(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("memory_policy", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("recall_enabled", sa.Boolean(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("dream_trip", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("random_fact", sa.Text(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("ai_persona", sa.Text(), nullable=True))
