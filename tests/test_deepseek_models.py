#!/usr/bin/env python3
"""
Test script to discover available DeepSeek models and test with correct names

Security: This script no longer contains hardcoded API keys.
Provide your key via environment variable OPENROUTER_API_KEY (preferred)
or configure app.core.config.settings.LLM_KEY.
"""

import os
import httpx
import json

def _get_api_key() -> str | None:
    # Prefer explicit env var to avoid importing app at test-discovery time
    key = os.environ.get("OPENROUTER_API_KEY")
    if key:
        return key
    # Fallback to app settings if available
    try:
        from app.core.config import settings  # type: ignore
        return settings.LLM_KEY or None
    except Exception:
        return None

def discover_models():
    """Discover what models are actually available on DeepSeek"""
    api_key = _get_api_key()
    
    print("🔍 Discovering Available DeepSeek Models...")
    print("=" * 60)
    
    # Test 1: Try to get models list (this should work even with auth issues)
    print("\n1. Testing models endpoint without authentication...")
    try:
        response = httpx.get("https://api.deepseek.com/v1/models", timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Models endpoint accessible without auth")
            models = response.json()
            print(f"   Available models: {len(models.get('data', []))}")
            for model in models.get('data', [])[:10]:  # Show first 10 models
                model_id = model.get('id', 'Unknown')
                model_name = model.get('name', 'Unknown')
                print(f"     - ID: {model_id}")
                print(f"       Name: {model_name}")
        else:
            print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Try with authentication (only if key available)
    print("\n2. Testing models endpoint with authentication...")
    if not api_key:
        print("   ⚠️  Skipping authenticated tests: OPENROUTER_API_KEY not set")
    else:
        try:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            response = httpx.get("https://api.deepseek.com/v1/models", headers=headers, timeout=10)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                print("✅ Authentication successful!")
                models = response.json()
                print(f"   Available models: {len(models.get('data', []))}")
                
                # Categorize models
                chat_models = []
                vision_models = []
                other_models = []
                
                for model in models.get('data', []):
                    model_id = model.get('id', '').lower()
                    if 'chat' in model_id:
                        chat_models.append(model)
                    elif 'vision' in model_id:
                        vision_models.append(model)
                    else:
                        other_models.append(model)
                
                print(f"\n   Chat Models ({len(chat_models)}):")
                for model in chat_models[:5]:
                    print(f"     - {model.get('id')}")
                
                print(f"\n   Vision Models ({len(vision_models)}):")
                for model in vision_models[:5]:
                    print(f"     - {model.get('id')}")
                
                print(f"\n   Other Models ({len(other_models)}):")
                for model in other_models[:5]:
                    print(f"     - {model.get('id')}")
                    
            else:
                print(f"   Response: {response.text[:200]}...")
                
        except Exception as e:
            print(f"❌ Error: {e}")
    
    # Test 3: Try common DeepSeek model names (only if key available)
    print("\n3. Testing common DeepSeek model names...")
    if not api_key:
        print("   ⚠️  Skipping model invocation tests: OPENROUTER_API_KEY not set")
        return
    
    common_models = [
        "deepseek-chat",
        "deepseek-vision", 
        "deepseek-coder",
        "deepseek-llm-7b-chat",
        "deepseek-llm-67b-chat",
        "deepseek-coder-6.7b-instruct",
        "deepseek-coder-33b-instruct"
    ]
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    for model_name in common_models:
        print(f"\n   Testing model: {model_name}")
        try:
            payload = {
                "model": model_name,
                "messages": [
                    {"role": "user", "content": "Say 'Hello'"}
                ],
                "max_tokens": 10
            }
            
            response = httpx.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=20
            )
            
            if response.status_code == 200:
                print(f"     ✅ {model_name} works!")
                data = response.json()
                if data.get("choices") and data["choices"][0].get("message"):
                    content = data["choices"][0]["message"]["content"]
                    print(f"       Response: {content}")
            elif response.status_code == 400:
                print(f"     ⚠️  {model_name} - Bad request (model not found)")
            elif response.status_code == 401:
                print(f"     ❌ {model_name} - Authentication failed")
            else:
                print(f"     ❌ {model_name} - Status {response.status_code}")
                
        except Exception as e:
            print(f"     ❌ {model_name} - Error: {e}")

if __name__ == "__main__":
    discover_models()
    print("\n" + "=" * 60)
    print("🎯 Model discovery completed!")
    print("   This will help us identify the correct model names to use.")
