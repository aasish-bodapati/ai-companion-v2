from sqlalchemy import create_engine, MetaData, Table, select
import os

# Database connection
DATABASE_URL = "sqlite:///./minimal.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

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
