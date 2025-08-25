"""update onboarding to personal assistant focus

Revision ID: onboarding_personal_assistant
Revises: update_onboarding_to_generic
Create Date: 2025-01-27 12:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "onboarding_personal_assistant"
down_revision = "update_onboarding_to_generic"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop old generic learning-focused columns
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

    # Add new personal assistant focused columns
    op.add_column("onboarding_profiles", sa.Column("daily_schedule", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("schedule_preferences", sa.Text(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("fitness_goals", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("nutrition_goals", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("dietary_preferences", sa.Text(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("communication_style", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("additional_preferences", sa.Text(), nullable=True))


def downgrade() -> None:
    # Drop new personal assistant columns
    op.drop_column("onboarding_profiles", "daily_schedule")
    op.drop_column("onboarding_profiles", "schedule_preferences")
    op.drop_column("onboarding_profiles", "fitness_goals")
    op.drop_column("onboarding_profiles", "nutrition_goals")
    op.drop_column("onboarding_profiles", "dietary_preferences")
    op.drop_column("onboarding_profiles", "communication_style")
    op.drop_column("onboarding_profiles", "additional_preferences")

    # Re-add old generic columns
    op.add_column("onboarding_profiles", sa.Column("interest_areas", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("experience_level", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("time_availability", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("learning_style", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("learning_goals", sa.Text(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("current_challenges", sa.Text(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("current_tools", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("information_preference", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("motivation", sa.Text(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("communication_preference", sa.Text(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("goal_timeline", sa.String(), nullable=True))
    op.add_column("onboarding_profiles", sa.Column("success_definition", sa.Text(), nullable=True))
