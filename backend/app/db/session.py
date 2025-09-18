from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings


db_url = settings.SQLALCHEMY_DATABASE_URI
is_sqlite = db_url.startswith("sqlite:///")

engine_kwargs = {
    "pool_pre_ping": True,
    "pool_timeout": 30,  # 30 seconds timeout for getting connection from pool
    "pool_recycle": 3600,  # Recycle connections after 1 hour
}

if is_sqlite:
    # SQLite needs this in multi-threaded apps like FastAPI dev server
    engine_kwargs["connect_args"] = {
        "check_same_thread": False,
        "timeout": 30  # SQLite connection timeout
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
