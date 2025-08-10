"""add_memory_nodes_table

Revision ID: 846f386b72c6
Revises: fad26210c922
Create Date: 2025-08-10 06:55:25.370668

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '846f386b72c6'
down_revision = 'fad26210c922'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create memory_nodes table
    op.create_table(
        'memory_nodes',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('faiss_id', sa.String(36), nullable=False, unique=True),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('content_type', sa.String(50), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('conversation_id', sa.String(36), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('relevance_score', sa.Float, default=1.0),
        sa.Column('memory_metadata', sa.Text, nullable=True)
    )
    
    # Create indexes
    op.create_index('ix_memory_nodes_faiss_id', 'memory_nodes', ['faiss_id'])
    op.create_index('ix_memory_nodes_user_id', 'memory_nodes', ['user_id'])
    op.create_index('ix_memory_nodes_conversation_id', 'memory_nodes', ['conversation_id'])


def downgrade() -> None:
    # Drop memory_nodes table
    op.drop_table('memory_nodes')
