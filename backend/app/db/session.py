from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings

# Postgres-only engine (we're removing SQLite)
engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    pool_pre_ping=True,
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency
def get_db() -> Session:
    """
    Get a database session.
    
    Yields:
        Session: A database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
