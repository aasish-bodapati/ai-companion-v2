#!/usr/bin/env python3
"""
Test script to verify backend configuration loads correctly with OpenRouter
"""

import sys
from pathlib import Path

# Add backend to path so we can import config
sys.path.append(str(Path(__file__).parent / "backend"))

def test_backend_config():
    """Test if backend can load the new OpenRouter configuration"""
    print("🔧 Testing Backend Configuration with OpenRouter...")
    print("=" * 60)
    
    try:
        # Try to import and load config
        from backend.app.core.config import settings
        
        print("✅ Configuration loaded successfully")
        print(f"   LLM Base URL: {settings.LLM_BASE_URL}")
        print(f"   Default Model: {settings.LLM_MODEL_DEFAULT}")
        print(f"   Vision Model: {settings.LLM_MODEL_VISION}")
        print(f"   Summary Model: {settings.LLM_MODEL_SUMMARY}")
        print(f"   API Key Present: {'Yes' if settings.LLM_KEY else 'No'}")
        
        # Check which provider we're using
        if "openrouter.ai" in settings.LLM_BASE_URL:
            print("✅ Configuration is set to use OpenRouter")
        elif "api.deepseek.com" in settings.LLM_BASE_URL:
            print("⚠️  Configuration is set to use DeepSeek directly")
        elif "localhost:11434" in settings.LLM_BASE_URL:
            print("⚠️  Configuration is set to use local Llama")
        else:
            print("⚠️  Configuration is set to use unknown provider")
            
        # Check model names
        if "deepseek/" in settings.LLM_MODEL_DEFAULT:
            print("✅ Using DeepSeek models through OpenRouter")
        else:
            print("⚠️  Not using DeepSeek models")
            
    except Exception as e:
        print(f"❌ Failed to load configuration: {e}")
        return False
    
    return True

if __name__ == "__main__":
    test_backend_config()
    print("\n" + "=" * 60)
    print("🎯 Backend configuration test completed!")
