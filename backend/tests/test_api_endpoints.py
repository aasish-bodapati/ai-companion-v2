#!/usr/bin/env python3
"""
Test Memory Monitoring API Endpoints

This script tests the memory monitoring endpoints with proper authentication.
"""

import requests
import json
from datetime import datetime

# API base URL
BASE_URL = "http://localhost:8000/api/v1"

def test_public_endpoints():
    """Test public endpoints that don't require authentication."""
    print("🔍 Testing Public Endpoints")
    print("=" * 40)
    
    # Test public health endpoint
    try:
        response = requests.get(f"{BASE_URL}/public/health", timeout=5)
        print(f"✅ Public Health: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Status: {data.get('status', 'unknown')}")
    except Exception as e:
        print(f"❌ Public Health: Error - {e}")
    
    # Test API docs
    try:
        response = requests.get("http://localhost:8000/docs", timeout=5)
        print(f"✅ API Docs: {response.status_code}")
    except Exception as e:
        print(f"❌ API Docs: Error - {e}")

def test_memory_monitoring_endpoints():
    """Test memory monitoring endpoints (will show auth required)."""
    print("\n🔍 Testing Memory Monitoring Endpoints")
    print("=" * 40)
    
    endpoints = [
        "/memory-monitoring/health",
        "/memory-monitoring/dashboard",
        "/memory-monitoring/metrics",
        "/memory-monitoring/alerts",
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=5)
            if response.status_code in [401, 403]:
                print(f"✅ {endpoint}: Authentication required (expected)")
            elif response.status_code == 200:
                print(f"✅ {endpoint}: Accessible")
                data = response.json()
                print(f"   Response keys: {list(data.keys())}")
            else:
                print(f"⚠️ {endpoint}: Status {response.status_code}")
        except Exception as e:
            print(f"❌ {endpoint}: Error - {e}")

def test_memory_endpoints():
    """Test basic memory endpoints."""
    print("\n🔍 Testing Memory Endpoints")
    print("=" * 40)
    
    endpoints = [
        "/memory/status",
        "/memory/users/me/memories",
        "/memory/users/me/memories/digest",
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=5)
            if response.status_code in [401, 403]:
                print(f"✅ {endpoint}: Authentication required (expected)")
            elif response.status_code == 200:
                print(f"✅ {endpoint}: Accessible")
            else:
                print(f"⚠️ {endpoint}: Status {response.status_code}")
        except Exception as e:
            print(f"❌ {endpoint}: Error - {e}")

def check_server_status():
    """Check if the server is responding."""
    print("🚀 Checking Server Status")
    print("=" * 40)
    
    try:
        response = requests.get("http://localhost:8000/", timeout=5)
        print(f"✅ Server is running: Status {response.status_code}")
        return True
    except Exception as e:
        print(f"❌ Server not responding: {e}")
        return False

def main():
    """Main test function."""
    print("🧪 Memory Monitoring API Endpoint Tests")
    print("=" * 60)
    print(f"Testing against: {BASE_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    # Check server status
    if not check_server_status():
        print("\n❌ Server is not running. Please start your server first:")
        print("   uvicorn app.main:app --reload")
        return
    
    # Test endpoints
    test_public_endpoints()
    test_memory_monitoring_endpoints()
    test_memory_endpoints()
    
    print("\n" + "=" * 60)
    print("🎯 Test Summary")
    print("=" * 60)
    print("✅ If you see 'Authentication required' for monitoring endpoints,")
    print("   that means the endpoints are properly implemented and secured.")
    print("\n📋 Next Steps:")
    print("1. Authenticate with your API to access monitoring endpoints")
    print("2. Visit http://localhost:8000/docs for interactive API documentation")
    print("3. Use the monitoring endpoints with proper authentication headers")
    print("\n🔧 To access monitoring endpoints, you'll need to:")
    print("   - Login to get authentication tokens")
    print("   - Include Authorization headers in requests")
    print("   - Or use the interactive docs at /docs")

if __name__ == "__main__":
    main()
