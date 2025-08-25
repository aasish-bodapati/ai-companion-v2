"""Add indexes for memory queries

Revision ID: add_memory_indexes
Revises: 
Create Date: 2025-01-19 17:40:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_memory_indexes'
down_revision = None  # Update this with the latest revision
branch_labels = None
depends_on = None


def upgrade():
    # Add composite index for user_id + timestamp queries (most common)
    op.create_index(
        'ix_memory_nodes_user_timestamp', 
        'memory_nodes', 
        ['user_id', 'timestamp']
    )
    
    # Add index for user_id + content_type queries
    op.create_index(
        'ix_memory_nodes_user_content_type', 
        'memory_nodes', 
        ['user_id', 'content_type']
    )
    
    # Add index for importance_score queries
    op.create_index(
        'ix_memory_nodes_importance_score', 
        'memory_nodes', 
        ['importance_score']
    )
    
    # Add index for conversation_id queries
    op.create_index(
        'ix_memory_nodes_conversation_id', 
        'memory_nodes', 
        ['conversation_id']
    )


def downgrade():
    op.drop_index('ix_memory_nodes_conversation_id', table_name='memory_nodes')
    op.drop_index('ix_memory_nodes_importance_score', table_name='memory_nodes')
    op.drop_index('ix_memory_nodes_user_content_type', table_name='memory_nodes')
    op.drop_index('ix_memory_nodes_user_timestamp', table_name='memory_nodes')
