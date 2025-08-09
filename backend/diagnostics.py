import sys
import sqlite3
from pathlib import Path
from typing import Dict, List, Any
import requests
from pydantic import BaseModel
import importlib.util
import inspect
from fastapi import FastAPI
from fastapi.routing import APIRoute

# Add the current directory to the path so we can import app modules
sys.path.append(str(Path(__file__).parent))
from app.core.config import settings

class DatabaseTable(BaseModel):
    name: str
    columns: List[Dict[str, str]]

class SchemaField(BaseModel):
    name: str
    type: str
    required: bool

class ModelField(BaseModel):
    name: str
    type: str
    nullable: bool

def get_db_tables() -> Dict[str, DatabaseTable]:
    """Connect to SQLite and get all tables with their columns."""
    db_path = settings.SQLALCHEMY_DATABASE_URI.replace("sqlite:///", "")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    
    result = {}
    for (table_name,) in tables:
        # Get table info
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = []
        for col in cursor.fetchall():
            columns.append({
                "name": col[1],
                "type": col[2],
                "nullable": not bool(col[3]),
                "default": col[4],
                "primary_key": bool(col[5])
            })
        result[table_name] = DatabaseTable(name=table_name, columns=columns)
    
    conn.close()
    return result

def compare_schemas_models() -> Dict[str, Any]:
    """Compare Pydantic schemas with SQLAlchemy models."""
    result = {"conversation": {"matches": True, "issues": []}, 
              "message": {"matches": True, "issues": []}}
    
    try:
        # Import conversation schema and model
        from app.schemas.conversation import ConversationCreate, Conversation, ConversationInDB
        from app.models.conversation import Conversation as ConversationModel
        
        # Compare conversation schema and model
        schema_fields = []
        for name, field in Conversation.__fields__.items():
            schema_fields.append(SchemaField(
                name=name,
                type=field._type_display(),
                required=field.required
            ))
        
        model_fields = []
        for name, column in ConversationModel.__table__.columns.items():
            model_fields.append(ModelField(
                name=name,
                type=str(column.type),
                nullable=column.nullable
            ))
        
        # Compare fields
        schema_field_names = {f.name for f in schema_fields}
        model_field_names = {f.name for f in model_fields}
        
        # Check for missing fields
        for field in schema_fields:
            if field.name not in model_field_names and field.required:
                result["conversation"]["issues"].append(f"Missing required field in model: {field.name}")
                result["conversation"]["matches"] = False
        
        for field in model_fields:
            if field.name not in schema_field_names and field.name != "id":
                result["conversation"]["issues"].append(f"Extra field in model not in schema: {field.name}")
                result["conversation"]["matches"] = False
        
        # TODO: Add message schema/model comparison
        
    except Exception as e:
        result["error"] = f"Error comparing schemas and models: {str(e)}"
    
    return result

def get_registered_routes(app: FastAPI) -> List[Dict[str, str]]:
    """Get all registered routes in the FastAPI app."""
    routes = []
    for route in app.routes:
        if isinstance(route, APIRoute):
            routes.append({
                "path": route.path,
                "methods": list(route.methods),
                "endpoint": route.endpoint.__name__ if hasattr(route.endpoint, "__name__") else str(route.endpoint)
            })
    return routes

def capture_error() -> Dict[str, Any]:
    """Capture error from the conversations endpoint."""
    try:
        # First get auth token
        login_url = f"{settings.SERVER_HOST}/token"
        login_data = {
            "username": settings.FIRST_SUPERUSER,
            "password": settings.FIRST_SUPERUSER_PASSWORD,
            "grant_type": "password",
            "scope": ""
        }
        response = requests.post(login_url, data=login_data)
        token = response.json().get("access_token")
        
        # Then make the request to conversations endpoint
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{settings.SERVER_HOST}/api/v1/conversations/",
            headers=headers
        )
        
        return {"status": response.status_code, "response": response.text}
    except Exception as e:
        return {"error": str(e), "traceback": str(e.__traceback__)}

def main():
    print("🔍 Running FastAPI Backend Diagnostics")
    print("=" * 80)
    
    # 1. Database Table Verification
    print("\n📊 DATABASE TABLES")
    print("-" * 40)
    try:
        tables = get_db_tables()
        print(f"Found {len(tables)} tables:")
        for table_name, table in tables.items():
            print(f"\nTable: {table_name}")
            print("  Columns:")
            for col in table.columns:
                print(f"    - {col['name']}: {col['type']} "
                      f"{'NULL' if col['nullable'] else 'NOT NULL'} "
                      f"{'PRIMARY KEY' if col['primary_key'] else ''}")
    except Exception as e:
        print(f"❌ Error accessing database: {str(e)}")
    
    # 2. Schema vs Model Consistency
    print("\n🔍 SCHEMA vs MODEL CONSISTENCY")
    print("-" * 40)
    try:
        comparison = compare_schemas_models()
        if "error" in comparison:
            print(f"❌ {comparison['error']}")
        else:
            for model, data in comparison.items():
                status = "✅" if data["matches"] else "❌"
                print(f"\n{status} {model.capitalize()}:")
                if data["issues"]:
                    for issue in data["issues"]:
                        print(f"  - {issue}")
    except Exception as e:
        print(f"❌ Error comparing schemas and models: {str(e)}")
    
    # 3. Route Registration Audit
    print("\n🛣️  REGISTERED ROUTES")
    print("-" * 40)
    try:
        from app.main import app
        routes = get_registered_routes(app)
        print(f"Found {len(routes)} registered routes:")
        for route in routes:
            print(f"\n{route['path']}")
            print(f"  Methods: {', '.join(route['methods'])}")
            print(f"  Endpoint: {route['endpoint']}")
    except Exception as e:
        print(f"❌ Error getting registered routes: {str(e)}")
    
    # 4. Error Log Capture
    print("\n⚠️  ERROR CAPTURE")
    print("-" * 40)
    try:
        error_info = capture_error()
        if "error" in error_info:
            print(f"❌ Error capturing error: {error_info['error']}")
        else:
            print(f"Status: {error_info['status']}")
            print(f"Response: {error_info['response']}")
    except Exception as e:
        print(f"❌ Error during error capture: {str(e)}")
    
    print("\n" + "=" * 80)
    print("✅ Diagnostics complete")

if __name__ == "__main__":
    main()
