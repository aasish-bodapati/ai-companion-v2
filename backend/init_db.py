"""
Database initialization script.
Run this to create all database tables.
"""
import sys
from pathlib import Path

# Add the backend directory to the Python path
sys.path.append(str(Path(__file__).parent))

from app.database import engine, Base
from app.models import init_models

if __name__ == "__main__":
    print("Creating database tables...")
    init_models()
    print("Database tables created successfully!")
