from sqlalchemy import create_engine, MetaData, Table, select
import os

# Ensure package import path
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

# Database connection: use app settings
from app.core.config import settings
DATABASE_URL = settings.SQLALCHEMY_DATABASE_URI
engine = create_engine(DATABASE_URL)

# Reflect the database
metadata = MetaData()
metadata.reflect(bind=engine)
users_table = Table('users', metadata, autoload_with=engine)

# Query for the user
with engine.connect() as conn:
    query = select(users_table).where(users_table.c.email == 'test001@example.com')
    result = conn.execute(query).fetchone()

    if result:
        print("User found:")
        print(f"ID: {result.id}")
        print(f"Email: {result.email}")
        print(f"Full Name: {result.full_name}")
        print(f"Active: {bool(result.is_active)}")
    else:
        print("No user found with email: test001@example.com")
