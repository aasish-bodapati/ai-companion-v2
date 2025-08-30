#!/usr/bin/env python3
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings

def check_config():
    """Check configuration settings."""
    print("⚙️  CHECKING CONFIGURATION")
    print("=" * 50)
    
    print(f"MEMORY_ENABLED: {getattr(settings, 'MEMORY_ENABLED', 'NOT_SET')}")
    print(f"EMBEDDING_MODEL_NAME: {getattr(settings, 'EMBEDDING_MODEL_NAME', 'NOT_SET')}")
    print(f"VECTOR_STORE_BACKEND: {getattr(settings, 'VECTOR_STORE_BACKEND', 'NOT_SET')}")

if __name__ == "__main__":
    check_config()
