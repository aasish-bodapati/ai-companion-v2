"""enhance_memory_schema_manual

Revision ID: enhance_memory_schema_manual
Revises: 487eac5fa7c9
Create Date: 2025-08-30 16:50:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'enhance_memory_schema_manual'
down_revision = '487eac5fa7c9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to memory_nodes table (enhance existing table)
    op.add_column('memory_nodes', sa.Column('category', sa.String(100), nullable=True))
    op.add_column('memory_nodes', sa.Column('subcategory', sa.String(100), nullable=True))
    op.add_column('memory_nodes', sa.Column('effective_date', sa.Date(), nullable=True))
    op.add_column('memory_nodes', sa.Column('expiration_date', sa.Date(), nullable=True))
    op.add_column('memory_nodes', sa.Column('confidence_score', sa.Float(), nullable=True, default=0.8))
    op.add_column('memory_nodes', sa.Column('emotional_valence', sa.Float(), nullable=True))
    op.add_column('memory_nodes', sa.Column('parent_memory_id', sa.String(36), nullable=True))
    op.add_column('memory_nodes', sa.Column('related_memory_ids', sa.Text(), nullable=True))
    op.add_column('memory_nodes', sa.Column('tags', sa.Text(), nullable=True))
    op.add_column('memory_nodes', sa.Column('entities', sa.Text(), nullable=True))
    op.add_column('memory_nodes', sa.Column('access_count', sa.Integer(), nullable=True, default=0))
    op.add_column('memory_nodes', sa.Column('last_accessed', sa.DateTime(timezone=True), nullable=True))
    op.add_column('memory_nodes', sa.Column('created_via', sa.String(50), nullable=True))
    op.add_column('memory_nodes', sa.Column('privacy_level', sa.String(20), nullable=True, default='normal'))
    op.add_column('memory_nodes', sa.Column('is_core', sa.Integer(), nullable=True, default=0))

    # Create indexes for new columns
    op.create_index('ix_memory_nodes_category', 'memory_nodes', ['category'])
    op.create_index('ix_memory_nodes_relevance_score', 'memory_nodes', ['relevance_score'])
    op.create_index('ix_memory_nodes_importance_score', 'memory_nodes', ['importance_score'])
    op.create_index('ix_memory_nodes_parent_memory_id', 'memory_nodes', ['parent_memory_id'])

    # Create memory_relationships table
    op.create_table('memory_relationships',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('source_memory_id', sa.String(36), nullable=False),
        sa.Column('target_memory_id', sa.String(36), nullable=False),
        sa.Column('relationship_type', sa.String(50), nullable=False),
        sa.Column('strength', sa.Float(), default=1.0),
        sa.Column('context', sa.String(200), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('created_by', sa.String(50), nullable=True),
        sa.ForeignKeyConstraint(['source_memory_id'], ['memory_nodes.id']),
        sa.ForeignKeyConstraint(['target_memory_id'], ['memory_nodes.id'])
    )
    
    op.create_index('ix_memory_relationships_source_memory_id', 'memory_relationships', ['source_memory_id'])
    op.create_index('ix_memory_relationships_target_memory_id', 'memory_relationships', ['target_memory_id'])

    # Create memory_evolution table
    op.create_table('memory_evolution',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('memory_id', sa.String(36), nullable=False),
        sa.Column('evolution_type', sa.String(50), nullable=False),
        sa.Column('old_content', sa.Text(), nullable=True),
        sa.Column('new_content', sa.Text(), nullable=True),
        sa.Column('old_metadata', sa.Text(), nullable=True),
        sa.Column('new_metadata', sa.Text(), nullable=True),
        sa.Column('reason', sa.String(500), nullable=True),
        sa.Column('confidence', sa.Float(), default=0.8),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('triggered_by', sa.String(50), nullable=True),
        sa.ForeignKeyConstraint(['memory_id'], ['memory_nodes.id'])
    )
    
    op.create_index('ix_memory_evolution_memory_id', 'memory_evolution', ['memory_id'])


def downgrade() -> None:
    # Drop new tables
    op.drop_table('memory_evolution')
    op.drop_table('memory_relationships')
    
    # Remove new columns from memory_nodes
    op.drop_column('memory_nodes', 'is_core')
    op.drop_column('memory_nodes', 'privacy_level')
    op.drop_column('memory_nodes', 'created_via')
    op.drop_column('memory_nodes', 'last_accessed')
    op.drop_column('memory_nodes', 'access_count')
    op.drop_column('memory_nodes', 'entities')
    op.drop_column('memory_nodes', 'tags')
    op.drop_column('memory_nodes', 'related_memory_ids')
    op.drop_column('memory_nodes', 'parent_memory_id')
    op.drop_column('memory_nodes', 'emotional_valence')
    op.drop_column('memory_nodes', 'confidence_score')
    op.drop_column('memory_nodes', 'expiration_date')
    op.drop_column('memory_nodes', 'effective_date')
    op.drop_column('memory_nodes', 'subcategory')
    op.drop_column('memory_nodes', 'category')
