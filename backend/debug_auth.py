import requests
import json
import sys

def test_registration():
    print("=== Testing Registration ===")
    url = "http://localhost:8000/register"
    headers = {"Content-Type": "application/json"}
    data = {
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User"
    }
    
    try:
        print(f"Sending POST request to {url}")
        print(f"Request data: {json.dumps(data, indent=2)}")
        response = requests.post(url, json=data, headers=headers, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print("Response Headers:")
        for header, value in response.headers.items():
            print(f"  {header}: {value}")
            
        try:
            print("Response Body:")
            print(json.dumps(response.json(), indent=2))
        except ValueError:
            print(f"Response (raw): {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {str(e)}")
        print("Make sure the server is running and accessible at http://localhost:8000")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response status: {e.response.status_code}")
            print(f"Response text: {e.response.text}")
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_registration()
