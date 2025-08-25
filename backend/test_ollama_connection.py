import httpx
import json

print("=== Testing Ollama Connection ===")

# Test the exact endpoint the backend is trying to use
base_url = "http://localhost:11434/v1"
model = "llama3.1:8b"

print(f"Testing connection to: {base_url}")
print(f"Using model: {model}")

try:
    # Test 1: Check if Ollama is responding
    print("\n1. Testing Ollama availability...")
    with httpx.Client(base_url=base_url, timeout=10.0) as client:
        resp = client.get("models")
        print(f"Models endpoint status: {resp.status_code}")
        if resp.status_code == 200:
            models = resp.json()
            print(f"Available models: {[m['id'] for m in models.get('data', [])]}")
        else:
            print(f"Failed to get models: {resp.text}")
    
    # Test 2: Try a simple chat completion
    print("\n2. Testing chat completion...")
    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": "Hello, how are you?"}
        ],
        "temperature": 0.7,
        "max_tokens": 50,
        "stream": False
    }
    
    with httpx.Client(base_url=base_url, timeout=30.0) as client:
        resp = client.post("chat/completions", json=payload)
        print(f"Chat completion status: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            choices = data.get("choices", [])
            if choices:
                content = choices[0].get("message", {}).get("content", "")
                print(f"✅ Success! Response: {content}")
            else:
                print(f"❌ No choices in response: {data}")
        else:
            print(f"❌ Chat completion failed: {resp.text}")
            
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

