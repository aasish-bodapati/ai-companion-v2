#!/usr/bin/env python3
"""
Endpoint Tester

This script tests a specific API endpoint and captures the full error traceback.
"""
import os
import sys
import requests
import traceback
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_auth_token():
    """Get authentication token."""
    login_url = f"{os.getenv('BASE_URL', 'http://localhost:8000')}/api/v1/login/access-token"
    data = {
        'username': os.getenv('TEST_USERNAME'),
        'password': os.getenv('TEST_PASSWORD'),
        'grant_type': 'password'
    }
    
    try:
        response = requests.post(
            login_url,
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        response.raise_for_status()
        return response.json()["access_token"]
    except Exception as e:
        print(f"Error getting auth token: {e}")
        return None

def test_endpoint():
    """Test the /api/v1/conversations/ endpoint."""
    base_url = os.getenv('BASE_URL', 'http://localhost:8000')
    token = get_auth_token()
    
    if not token:
        print("Failed to get authentication token")
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    endpoint = f"{base_url}/api/v1/conversations/"
    
    try:
        print(f"Testing endpoint: {endpoint}")
        # Enable traceback in response
        response = requests.get(
            endpoint, 
            headers=headers,
            params={"debug": "true"}  # Add debug parameter if supported
        )
        
        print(f"Status code: {response.status_code}")
        print("Response headers:")
        for k, v in response.headers.items():
            print(f"  {k}: {v}")
            
        print("\nResponse body:")
        try:
            print(response.json())
        except Exception as e:
            print(f"Could not parse JSON response: {e}")
            print("Raw response:")
            print(response.text)
            
        # Print response history in case of redirects
        if response.history:
            print("\nRequest was redirected:")
            for resp in response.history:
                print(f"  {resp.status_code} {resp.url}")
            
    except Exception as e:
        print(f"Error testing endpoint: {e}")
        print("\nFull traceback:")
        traceback.print_exc()

if __name__ == "__main__":
    test_endpoint()
