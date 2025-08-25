#!/usr/bin/env python3
"""
Test script to simulate frontend authentication flow and test streaming
"""
import asyncio
import httpx
import json

async def test_frontend_auth_flow():
    print("🧪 Testing Frontend Authentication Flow")
    print("=" * 50)
    
    async with httpx.AsyncClient() as client:
        # Step 1: Check if we can access the login endpoint
        print("1️⃣ Testing login endpoint accessibility...")
        try:
            response = await client.get("http://localhost:8000/api/v1/login/access-token")
            print(f"   Login endpoint status: {response.status_code}")
            if response.status_code == 405:  # Method not allowed (POST required)
                print("   ✅ Login endpoint exists (POST required)")
            else:
                print(f"   ⚠️ Unexpected status: {response.status_code}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        # Step 2: Try to create a test user (if registration works)
        print("\n2️⃣ Testing user registration...")
        try:
            test_user = {
                "email": "test@example.com",
                "password": "testpassword123",
                "full_name": "Test User"
            }
            response = await client.post(
                "http://localhost:8000/api/v1/register",
                json=test_user
            )
            print(f"   Registration status: {response.status_code}")
            if response.status_code == 201:
                print("   ✅ User created successfully")
            elif response.status_code == 422:
                print("   ⚠️ User might already exist (validation error)")
            else:
                print(f"   ❌ Registration failed: {response.status_code}")
                print(f"   Response: {response.text}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        # Step 3: Try to login with the test user
        print("\n3️⃣ Testing user login...")
        try:
            form_data = {
                "username": "test@example.com",
                "password": "testpassword123",
                "grant_type": "password",
                "scope": "",
                "client_id": "",
                "client_secret": ""
            }
            response = await client.post(
                "http://localhost:8000/api/v1/login/access-token",
                data=form_data
            )
            print(f"   Login status: {response.status_code}")
            if response.status_code == 200:
                print("   ✅ Login successful")
                token_data = response.json()
                access_token = token_data.get("access_token")
                if access_token:
                    print(f"   Token received: {access_token[:20]}...")
                    
                    # Step 4: Test authenticated endpoints with the token
                    print("\n4️⃣ Testing authenticated endpoints...")
                    headers = {"Authorization": f"Bearer {access_token}"}
                    
                    # Test user profile
                    try:
                        user_response = await client.get(
                            "http://localhost:8000/api/v1/users/me",
                            headers=headers
                        )
                        print(f"   User profile status: {user_response.status_code}")
                        if user_response.status_code == 200:
                            user_data = user_response.json()
                            print(f"   ✅ User authenticated: {user_data.get('email')}")
                            
                            # Step 5: Test streaming endpoint with auth
                            print("\n5️⃣ Testing streaming endpoint with auth...")
                            try:
                                stream_response = await client.post(
                                    "http://localhost:8000/api/v1/conversations/1/reply/stream",
                                    headers=headers
                                )
                                print(f"   Streaming status: {stream_response.status_code}")
                                print(f"   Streaming headers: {dict(stream_response.headers)}")
                                
                                if stream_response.status_code == 200:
                                    print("   ✅ Streaming endpoint accessible!")
                                    # Try to read the response
                                    content = stream_response.text
                                    print(f"   Response preview: {content[:200]}...")
                                else:
                                    print(f"   ❌ Streaming failed: {stream_response.status_code}")
                                    print(f"   Response: {stream_response.text}")
                            except Exception as e:
                                print(f"   ❌ Streaming error: {e}")
                        else:
                            print(f"   ❌ User profile failed: {user_response.status_code}")
                            print(f"   Response: {user_response.text}")
                    except Exception as e:
                        print(f"   ❌ User profile error: {e}")
                else:
                    print("   ❌ No access token in response")
            else:
                print(f"   ❌ Login failed: {response.status_code}")
                print(f"   Response: {response.text}")
        except Exception as e:
            print(f"   ❌ Login error: {e}")
    
    return True

if __name__ == "__main__":
    asyncio.run(test_frontend_auth_flow())
