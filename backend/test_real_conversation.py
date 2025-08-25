#!/usr/bin/env python3
"""
Test script to find real conversations and test streaming with valid UUIDs
"""
import pytest

# Avoid duplicate module import conflicts with the root-level test_real_conversation.py
# This backend copy is kept for manual runs only.
pytestmark = pytest.mark.skip(
    reason="Skipped to avoid duplicate module name conflict; use root test_real_conversation.py"
)
import asyncio
import httpx
import json

async def test_real_conversations():
    print("🧪 Testing with Real Conversations")
    print("=" * 50)
    
    async with httpx.AsyncClient() as client:
        # Step 1: Login to get a token
        print("1️⃣ Logging in...")
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
            if response.status_code != 200:
                print(f"   ❌ Login failed: {response.status_code}")
                return False
            
            token_data = response.json()
            access_token = token_data.get("access_token")
            if not access_token:
                print("   ❌ No access token received")
                return False
            
            print("   ✅ Login successful")
            headers = {"Authorization": f"Bearer {access_token}"}
            
        except Exception as e:
            print(f"   ❌ Login error: {e}")
            return False
        
        # Step 2: Get user's conversations
        print("\n2️⃣ Getting user conversations...")
        try:
            response = await client.get(
                "http://localhost:8000/api/v1/conversations/",
                headers=headers
            )
            print(f"   Conversations status: {response.status_code}")
            
            if response.status_code == 200:
                conversations = response.json()
                print(f"   ✅ Found {len(conversations)} conversations")
                
                if conversations:
                    # Use the first conversation
                    first_conv = conversations[0]
                    conversation_id = first_conv.get('id')
                    print(f"   Using conversation: {conversation_id}")
                    print(f"   Title: {first_conv.get('title', 'No title')}")
                    
                    # Step 3: Test streaming with real conversation ID
                    print("\n3️⃣ Testing streaming with real conversation ID...")
                    try:
                        stream_response = await client.post(
                            f"http://localhost:8000/api/v1/conversations/{conversation_id}/reply/stream",
                            headers=headers
                        )
                        print(f"   Streaming status: {stream_response.status_code}")
                        print(f"   Streaming headers: {dict(stream_response.headers)}")
                        
                        if stream_response.status_code == 200:
                            print("   ✅ Streaming endpoint working!")
                            # Try to read the response
                            content = stream_response.text
                            print(f"   Response preview: {content[:200]}...")
                            
                            # Check if it's actually streaming
                            if 'text/event-stream' in stream_response.headers.get('content-type', ''):
                                print("   ✅ Response is actually streaming (SSE)")
                            else:
                                print("   ⚠️ Response is not streaming (not SSE)")
                        else:
                            print(f"   ❌ Streaming failed: {stream_response.status_code}")
                            print(f"   Response: {stream_response.text}")
                    except Exception as e:
                        print(f"   ❌ Streaming error: {e}")
                else:
                    print("   ⚠️ No conversations found, creating one...")
                    
                    # Step 3b: Create a new conversation
                    try:
                        conv_response = await client.post(
                            "http://localhost:8000/api/v1/conversations/",
                            headers=headers,
                            json={"title": "Test Conversation"}
                        )
                        print(f"   Create conversation status: {conv_response.status_code}")
                        
                        if conv_response.status_code == 201:
                            new_conv = conv_response.json()
                            new_conv_id = new_conv.get('id')
                            print(f"   ✅ Created conversation: {new_conv_id}")
                            
                            # Test streaming with new conversation
                            print("\n3️⃣ Testing streaming with new conversation...")
                            stream_response = await client.post(
                                f"http://localhost:8000/api/v1/conversations/{new_conv_id}/reply/stream",
                                headers=headers
                            )
                            print(f"   Streaming status: {stream_response.status_code}")
                            
                            if stream_response.status_code == 200:
                                print("   ✅ Streaming endpoint working!")
                                content = stream_response.text
                                print(f"   Response preview: {content[:200]}...")
                            else:
                                print(f"   ❌ Streaming failed: {stream_response.status_code}")
                                print(f"   Response: {stream_response.text}")
                        else:
                            print(f"   ❌ Failed to create conversation: {conv_response.status_code}")
                            print(f"   Response: {conv_response.text}")
                    except Exception as e:
                        print(f"   ❌ Create conversation error: {e}")
            else:
                print(f"   ❌ Failed to get conversations: {response.status_code}")
                print(f"   Response: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Get conversations error: {e}")
    
    return True

if __name__ == "__main__":
    asyncio.run(test_real_conversations())
