"""Add embedding column to messages

Revision ID: 1234abcd5678
Revises: None
Create Date: 2025-08-09 17:25:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '1234abcd5678'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    bind = op.get_bind()
    dialect = bind.dialect.name if bind is not None else ""
    if dialect == "postgresql":
        # Enable the pgvector extension if not already enabled
        op.execute('CREATE EXTENSION IF NOT EXISTS vector')

        # Add the embedding column using the vector type
        op.add_column(
            'messages',
            sa.Column('embedding', postgresql.VECTOR(1536), nullable=True)
        )

        # Create an index on the embedding column for faster similarity search
        op.execute('''
            CREATE INDEX IF NOT EXISTS idx_messages_embedding 
            ON messages 
            USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100);
        ''')
    else:
        # Fallback for SQLite and other dialects: store as TEXT
        op.add_column(
            'messages',
            sa.Column('embedding', sa.Text(), nullable=True)
        )

def downgrade():
    bind = op.get_bind()
    dialect = bind.dialect.name if bind is not None else ""
    if dialect == "postgresql":
        # Drop the index if it exists
        op.execute('DROP INDEX IF EXISTS idx_messages_embedding')
    # Drop the embedding column (works for both dialects)
    op.drop_column('messages', 'embedding')
