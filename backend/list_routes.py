#!/usr/bin/env python3
"""
FastAPI Route Lister

This script lists all registered routes in the FastAPI application.
"""
import uvicorn
from fastapi import FastAPI
from fastapi.routing import APIRoute
from app.main import app

def list_routes():
    """List all registered routes in the FastAPI application."""
    print("=== Registered Routes ===\n")
    
    # Get all routes
    routes = []
    for route in app.routes:
        if isinstance(route, APIRoute):
            methods = ", ".join(route.methods) if hasattr(route, 'methods') else ""
            routes.append({
                "path": route.path,
                "methods": methods,
                "endpoint": route.endpoint.__name__,
                "name": route.name
            })
    
    # Sort routes by path
    routes = sorted(routes, key=lambda x: x["path"])
    
    # Print routes
    for route in routes:
        print(f"{route['methods']: <10} {route['path']}")
        print(f"  → {route['endpoint']} ({route['name']})\n")

if __name__ == "__main__":
    list_routes()
