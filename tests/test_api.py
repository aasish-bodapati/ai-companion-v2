import requests
import json

session = requests.Session()
base_url = 'http://localhost:8000'

# Login
login_response = session.post(f'{base_url}/api/v1/login/access-token',
    data={'username': 'test@example.com', 'password': 'testpassword'})
print(f'Login status: {login_response.status_code}')

if login_response.status_code == 200:
    # Test one message
    response = session.post(f'{base_url}/api/v1/conversation/chat',
        json={'message': 'I need help with my fitness routine', 'conversation_history': []})
    print(f'Chat status: {response.status_code}')
    if response.status_code == 200:
        data = response.json()
        print(f'Response: {data.get("message", "No message")[:100]}...')
        print(f'Context: {data.get("context_analysis", {})}')
        print(f'Has context continuity: {data.get("has_context_continuity", False)}')
    else:
        print(f'Error: {response.text}')
else:
    print(f'Login failed: {login_response.text}')
