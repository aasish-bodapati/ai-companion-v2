import logging
import sys
from sqlalchemy.orm import Session

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

# Import database models and session
try:
    from app.db.base_class import Base
    from app.db.session import engine, SessionLocal
    from app.models.user import User
    from app.core.security import get_password_hash
    from app.core.config import settings
    
    logger.info("Successfully imported database models and dependencies")
except ImportError as e:
    logger.error(f"Error importing database dependencies: {e}")
    sys.exit(1)

def init_db() -> None:
    """Initialize the database with required tables and initial data."""
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Create a test user if it doesn't exist
    db = SessionLocal()
    try:
        test_user = db.query(User).filter(User.email == settings.TEST_USERNAME).first()
        if not test_user:
            logger.info("Creating test user...")
            test_user = User(
                email=settings.TEST_USERNAME,
                hashed_password=get_password_hash(settings.TEST_PASSWORD),
                full_name="Test User",
                is_active=True,
                is_superuser=True
            )
            db.add(test_user)
            db.commit()
            logger.info(f"Created test user: {settings.TEST_USERNAME}")
        else:
            logger.info(f"Test user already exists: {settings.TEST_USERNAME}")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    logger.info("Starting database initialization...")
    init_db()
    logger.info("Database initialization complete.")
