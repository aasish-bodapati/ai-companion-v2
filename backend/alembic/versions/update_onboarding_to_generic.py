"""update onboarding to generic learning focus

Revision ID: update_onboarding_to_generic
Revises: update_onboarding_to_fact_based
Create Date: 2025-01-27 11:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "update_onboarding_to_generic"
down_revision = "update_onboarding_to_fact_based"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop old work-specific columns
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

    # Add new generic learning-focused columns
    op.add_column("onboarding_profiles", sa.Column("interest_areas", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("experience_level", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("time_availability", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("learning_style", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("learning_goals", sa.Text(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("current_challenges", sa.Text(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("current_tools", sa.String(), nullable=True))
    op.add_column(
        "onboarding_profiles", sa.Column("information_preference", sa.String(), nullable=True)
    )
    op.add_column("onboarding_profiles", sa.Column("motivation", sa.Text(), nullable=True))
    op.add_column(
        "onboarding_profiles", sa.Column("communication_preference", sa.Text(), nullable=True)
    )
    op.add_column("onboarding_profiles", sa.Column("goal_timeline", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("success_definition", sa.Text(), nullable=True))


def downgrade() -> None:
    # Drop new generic columns
    op.drop_column("onboarding_profiles", "interest_areas")
    op.drop_column("onboarding_profiles", "experience_level")
    op.drop_column("onboarding_profiles", "time_availability")
    op.drop_column("onboarding_profiles", "learning_style")
    op.drop_column("onboarding_profiles", "learning_goals")
    op.drop_column("onboarding_profiles", "current_challenges")
    op.drop_column("onboarding_profiles", "current_tools")
    op.drop_column("onboarding_profiles", "information_preference")
    op.drop_column("onboarding_profiles", "motivation")
    op.drop_column("onboarding_profiles", "communication_preference")
    op.drop_column("onboarding_profiles", "goal_timeline")
    op.drop_column("onboarding_profiles", "success_definition")

    # Re-add old work-specific columns
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
    op.add_column(
        "onboarding_profiles", sa.Column("technical_constraints", sa.Text(), nullable=True)
    )
    op.add_column("onboarding_profiles", sa.Column("weekly_goals", sa.Text(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("timeline", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("daily_time", sa.String(), nullable=True))
