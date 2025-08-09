from fastapi import FastAPI, Depends, HTTPException, status, Request, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any, AsyncGenerator
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import create_engine, Column, Integer, String, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import os
import traceback
import together
from dotenv import load_dotenv
import asyncio
import json
import httpx

# Load environment variables
load_dotenv()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
DATABASE_URL = "sqlite:///./minimal.db"
TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")

if not TOGETHER_API_KEY:
    raise ValueError("TOGETHER_API_KEY environment variable not set")

# Initialize Together client - using environment variable directly
# The together package will automatically use TOGETHER_API_KEY from environment
import together

# Database setup
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    role = Column(String)  # 'user' or 'assistant'
    content = Column(Text)
    timestamp = Column(String, default=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Pydantic models
class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True

class ChatMessageIn(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    model: str = "gpt-3.5-turbo"
    stream: bool = False

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Helper functions
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_user(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(request: Request, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    print("\n=== DEBUG: get_current_user called ===")
    print(f"Request headers: {dict(request.headers)}")
    print(f"Token received: {token}")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        print("ERROR: No token provided in Authorization header")
        raise credentials_exception
        
    try:
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:].strip()
            print(f"Token after removing 'Bearer' prefix: {token}")
            
        print(f"Decoding token with SECRET_KEY: {SECRET_KEY[:5]}...")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"Decoded payload: {payload}")
        
        email: str = payload.get("sub")
        if not email:
            print("ERROR: No 'sub' claim in token")
            raise credentials_exception
            
        print(f"Token email (sub): {email}")
        token_data = TokenData(email=email)
        
        user = get_user(db, email=token_data.email)
        if not user:
            print(f"ERROR: User with email {token_data.email} not found")
            raise credentials_exception
            
        print(f"Found user in DB: {user.email}, ID: {user.id}")
        
        # Convert SQLAlchemy model to dict for better serialization
        user_dict = {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active
        }
        print("Successfully authenticated user")
        print(f"User data: {user_dict}")
        return user_dict
        
    except JWTError as e:
        print(f"JWT Error: {str(e)}")
        print(traceback.format_exc())
        raise credentials_exception
    except Exception as e:
        print(f"Unexpected error in get_current_user: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# FastAPI app
app = FastAPI(title="Minimal AI Companion API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Range"],
)

# Routes
@app.post("/register", response_model=UserInDB)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = get_user(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/chat", response_model=Dict[str, Any])
async def chat_endpoint(
    chat_request: ChatRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Handle chat completion requests"""
    if not chat_request.messages:
        raise HTTPException(status_code=400, detail="No messages provided")
    
    if chat_request.stream:
        return StreamingResponse(
            get_chat_completion(chat_request.messages, chat_request.model),
            media_type="text/event-stream"
        )
    
    try:
        # Format messages for Together AI
        prompt = ""
        for msg in chat_request.messages:
            if msg["role"] == "user":
                prompt += f"[INST] {msg['content']} [/INST]"
            else:
                prompt += msg["content"]
        
        # Call Together AI API
        response = together.Complete.create(
            prompt=prompt,
            model=chat_request.model,
            max_tokens=1024,
            temperature=0.7,
            top_p=0.9,
            top_k=50,
            repetition_penalty=1.1,
            stop=["</s>", "[INST]"]  # Stop generation at these tokens
        )
        
        # Log the full response for debugging
        print(f"Together AI Response: {response}")
        
        # Get the generated text - handle different response formats
        if 'output' in response and 'choices' in response['output']:
            # Old format
            ai_response = response['output']['choices'][0]['text']
        elif 'choices' in response and len(response['choices']) > 0:
            # New format
            ai_response = response['choices'][0]['text']
        elif 'output' in response and isinstance(response['output'], str):
            # Direct output format
            ai_response = response['output']
        else:
            # Fallback to raw response if format is unexpected
            ai_response = str(response)
        
        # Save the conversation to the database
        for msg in chat_request.messages:
            db_msg = ChatMessage(
                user_id=current_user["id"],
                role=msg["role"],
                content=msg["content"]
            )
            db.add(db_msg)
        
        # Save AI response
        ai_db_msg = ChatMessage(
            user_id=current_user["id"],
            role="assistant",
            content=ai_response
        )
        db.add(ai_db_msg)
        
        db.commit()
        
        return {"response": {"role": "assistant", "content": ai_response}}
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"=== ERROR in chat_endpoint ===\n{error_details}")
        
        # Log the request data that caused the error
        print(f"Request data: {chat_request.dict()}")
        
        # Return more detailed error information in development
        raise HTTPException(
            status_code=500, 
            detail={
                "error": str(e),
                "type": type(e).__name__,
                "traceback": error_details if "dev" in os.getenv("ENV", "").lower() else None
            }
        )

@app.get("/users/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return {
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "is_active": current_user["is_active"]
    }

@app.get("/")
async def root():
    return {"message": "Welcome to Minimal AI Companion API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
