#!/usr/bin/env python3
"""
Test script to debug streaming chat responses
"""
import os
import sys
import asyncio
import httpx
import json

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.core.config import settings
from app.core.llm import generate_with_openrouter_stream

async def test_streaming():
    print("🧪 Testing Streaming Chat Response")
    print("=" * 50)
    
    # Test 1: Check environment
    print(f"✅ LLM Model: {settings.LLM_MODEL_DEFAULT}")
    print(f"✅ LLM Base URL: {settings.LLM_BASE_URL}")
    print(f"✅ LLM Key exists: {'Yes' if settings.LLM_KEY else 'No'}")
    print(f"✅ LLM Key preview: {settings.LLM_KEY[:20]}..." if settings.LLM_KEY else "❌ No LLM Key")
    
    # Test 2: Direct LLM streaming
    print("\n🔥 Testing Direct LLM Streaming:")
    try:
        chunks = []
        for chunk in generate_with_openrouter_stream(
            model=settings.LLM_MODEL_DEFAULT,
            system_prompt="You are a helpful assistant.",
            messages=[{"role": "user", "content": "Say hello"}],
            max_tokens=50
        ):
            chunks.append(chunk)
            print(f"  Chunk: '{chunk}'")
        
        full_response = "".join(chunks)
        print(f"✅ Full response: '{full_response}'")
        
        if not full_response or full_response.startswith("(stub)"):
            print("❌ LLM streaming failed or returned stub response")
            return False
        else:
            print("✅ LLM streaming working correctly")
            
    except Exception as e:
        print(f"❌ LLM streaming error: {e}")
        return False
    
    # Test 3: Test API endpoint directly
    print("\n🌐 Testing API Endpoint:")
    try:
        async with httpx.AsyncClient() as client:
            # First create a user and get a token (simplified)
            print("  Testing server connectivity...")
            response = await client.get("http://localhost:8000/docs")
            if response.status_code == 200:
                print("  ✅ Server is accessible")
            else:
                print(f"  ❌ Server not accessible: {response.status_code}")
                return False
                
    except Exception as e:
        print(f"❌ Server connectivity error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    result = asyncio.run(test_streaming())
    if result:
        print("\n🎉 All tests passed!")
    else:
        print("\n💥 Some tests failed!")
        sys.exit(1)
