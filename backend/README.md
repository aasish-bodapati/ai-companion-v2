# AI Companion - MVP Backend

This is the minimal viable product (MVP) backend for the AI Companion application, built with FastAPI.

## Features

- User registration
- User authentication with JWT tokens
- Protected user profile endpoint

## Getting Started

### Prerequisites

- Python 3.8+
- pip (Python package manager)

### Installation

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Running the Application

Start the development server:

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Register a new user

```http
POST /register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe"
}
```

### Login

```http
POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=password&username=user@example.com&password=securepassword
```

### Get current user profile

```http
GET /users/me
Authorization: Bearer <access_token>
```

## Project Structure

- `main.py` - Main application file with all routes and logic
- `requirements.txt` - Project dependencies
- `minimal.db` - SQLite database (created automatically)

## License

This project is proprietary and confidential.
