from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings

db_url = settings.SQLALCHEMY_DATABASE_URI

# Database connection settings - PostgreSQL
engine_kwargs = {
    "pool_pre_ping": True,
    "pool_timeout": 30,  # 30 seconds timeout for getting connection from pool
    "pool_recycle": 3600,  # Recycle connections after 1 hour
    "pool_size": 10,  # PostgreSQL connection pool size
    "max_overflow": 20,  # Additional connections beyond pool_size
    "connect_args": {
        "options": "-c timezone=UTC"  # Force UTC timezone for all connections
    }
}

engine = create_engine(db_url, **engine_kwargs)

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
