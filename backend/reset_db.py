import logging
import sys
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

def reset_database():
    """Drop all tables and recreate them."""
    try:
        from sqlalchemy import create_engine, MetaData
        from app.core.config import settings
        
        # Create a new SQLAlchemy engine
        engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
        
        # Drop all tables
        logger.info("Dropping all tables...")
        meta = MetaData()
        meta.reflect(bind=engine)
        meta.drop_all(bind=engine)
        logger.info("All tables dropped successfully.")
        
        # Recreate tables
        logger.info("Creating tables...")
        from app.db.base_class import Base
        from app.db.session import engine as app_engine
        Base.metadata.create_all(bind=app_engine)
        logger.info("Tables created successfully.")
        
        return True
    except Exception as e:
        logger.error(f"Error resetting database: {e}")
        return False

if __name__ == "__main__":
    logger.info("Starting database reset...")
    if reset_database():
        logger.info("Database reset completed successfully.")
        # Run the initialization script to create test user
        logger.info("Running database initialization...")
        try:
            from init_db import init_db
            init_db()
            logger.info("Database initialization completed successfully.")
        except Exception as e:
            logger.error(f"Error during database initialization: {e}")
            sys.exit(1)
    else:
        logger.error("Database reset failed.")
        sys.exit(1)
