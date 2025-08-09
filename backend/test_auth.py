import requests
import json

# Test registration
print("Testing registration...")
try:
    register_data = {
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User"
    }
    register_response = requests.post(
        "http://localhost:8000/register",
        json=register_data
    )
    print(f"Register Status: {register_response.status_code}")
    print("Register Response:", register_response.text)
except Exception as e:
    print(f"Error during registration: {str(e)}")

print("\nTesting login...")
# Test login
try:
    login_data = {
        "username": "test@example.com",
        "password": "testpassword123",
        "grant_type": "password"
    }
    login_response = requests.post(
        "http://localhost:8000/token",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    print(f"Login Status: {login_response.status_code}")
    print("Login Response:", login_response.text)
    
    # If login successful, test protected endpoint
    if login_response.status_code == 200:
        token = login_response.json().get("access_token")
        print("\nTesting protected endpoint...")
        user_response = requests.get(
            "http://localhost:8000/users/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"User Status: {user_response.status_code}")
        print("User Response:", user_response.text)
        
except Exception as e:
    print(f"Error during login: {str(e)}")
