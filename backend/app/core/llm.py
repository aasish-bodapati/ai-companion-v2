"""
Simplified LLM module for AI Companion V2.
Removes complex fallback layers for easier debugging.
"""

import time
import logging
import httpx
from typing import List, Dict, Optional, Any
from functools import wraps

from .config import settings

logger = logging.getLogger(__name__)

# Global state for debugging
LAST_USED_STUB = False
LAST_ERROR = None

def log_llm_call(func):
    """Decorator to log LLM calls for debugging."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        global LAST_USED_STUB, LAST_ERROR
        start_time = time.time()
        
        try:
            result = func(*args, **kwargs)
            duration = (time.time() - start_time) * 1000
            
            # Log the call
            logger.info(f"LLM call successful: {func.__name__}, duration: {duration:.2f}ms")
            LAST_ERROR = None
            return result
            
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            LAST_ERROR = str(e)
            logger.error(f"LLM call failed: {func.__name__}, error: {e}, duration: {duration:.2f}ms")
            raise
    
    return wrapper

class SimpleLLMClient:
    """Simplified LLM client with clear, predictable behavior."""
    
    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        self.dev_mode = settings.LLM_DEV_MODE
        logger.info(f"Initialized LLM client with provider: {self.provider}, dev_mode: {self.dev_mode}")
    
    @log_llm_call
    def generate_response(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        max_tokens: int = 2048,
        temperature: float = 0.7,
        model: Optional[str] = None
    ) -> str:
        """Generate a response using the configured LLM provider."""
        
        if self.provider == "stub":
            return self._stub_response(system_prompt, messages, max_tokens)
        
        # Use real LLM providers
        if self.provider == "openrouter":
            return self._openrouter_response(system_prompt, messages, max_tokens, temperature, model)
        
        # Fallback to stub for unknown providers
        logger.warning(f"Unknown LLM provider {self.provider}, falling back to stub")
        return self._stub_response(system_prompt, messages, max_tokens)
    
    def _stub_response(self, system_prompt: str, messages: List[Dict[str, str]], max_tokens: int) -> str:
        """Generate a stub response for development and testing."""
        global LAST_USED_STUB
        LAST_USED_STUB = True
        
        # Extract the last user message
        last_user_message = ""
        for msg in reversed(messages):
            if msg.get("role") == "user":
                last_user_message = msg.get("content", "").strip().lower()
                break
        
        # If no user message found, this might be a duplicate/race condition call
        if not last_user_message:
            print(f"🔍 DEBUG: No user message found in messages: {messages}")
            return "I'm here to help! What would you like to know or discuss?"
        
        # Handle specific queries that should NOT hallucinate information
        if "what is my name" in last_user_message or "my name" in last_user_message:
            return "I don't have your name stored in my memory yet. Could you tell me your name?"
        
        if "hello" in last_user_message or "hi" in last_user_message:
            return "Hello! How can I help you today?"
        
        if "what do you know about my work" in last_user_message or "my job" in last_user_message:
            return "I don't have information about your work stored yet. Could you tell me about your job?"
        
        if "what are my interests" in last_user_message or "what do i like" in last_user_message:
            return "I don't have information about your interests stored yet. Could you tell me what you enjoy?"
        
        # Default response for other queries
        return "I'm here to help! What would you like to know or discuss?"
    
    def _openrouter_response(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        max_tokens: int = 2048,
        temperature: float = 0.7,
        model: Optional[str] = None
    ) -> str:
        """Generate a response using OpenRouter API."""
        global LAST_ERROR
        
        try:
            # Use the model from settings if not specified
            model = model or settings.LLM_MODEL_DEFAULT
            
            # Prepare the request payload
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    *messages
                ],
                "max_tokens": max_tokens,
                "temperature": temperature,
                "top_p": settings.LLM_TOP_P,
                "frequency_penalty": settings.LLM_FREQUENCY_PENALTY,
                "presence_penalty": settings.LLM_PRESENCE_PENALTY,
                "stream": False
            }
            
            headers = {
                "Authorization": f"Bearer {settings.LLM_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "AI Companion V2"
            }
            
            # Make the API call
            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    f"{settings.LLM_BASE_URL}/chat/completions",
                    json=payload,
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    LAST_ERROR = None
                    return content
                else:
                    error_msg = f"OpenRouter API error: {response.status_code} - {response.text}"
                    logger.error(error_msg)
                    LAST_ERROR = error_msg
                    # Fallback to stub response on API error
                    return self._stub_response(system_prompt, messages, max_tokens)
                    
        except Exception as e:
            error_msg = f"OpenRouter request failed: {str(e)}"
            logger.error(error_msg)
            LAST_ERROR = error_msg
            # Fallback to stub response on exception
            return self._stub_response(system_prompt, messages, max_tokens)
    
    def get_status(self) -> Dict[str, Any]:
        """Get the current status of the LLM client for debugging."""
        return {
            "provider": self.provider,
            "dev_mode": self.dev_mode,
            "last_used_stub": LAST_USED_STUB,
            "last_error": LAST_ERROR,
            "status": "healthy" if LAST_ERROR is None else "error"
        }

# Global LLM client instance
llm_client = SimpleLLMClient()

# Convenience functions for backward compatibility
def generate_response(*args, **kwargs) -> str:
    """Generate a response using the global LLM client."""
    return llm_client.generate_response(*args, **kwargs)

def get_llm_status() -> Dict[str, Any]:
    """Get the current LLM status for debugging."""
    return llm_client.get_status()

def generate_response_stream(
    system_prompt: str,
    messages: List[Dict[str, str]],
    max_tokens: int = 2048,
    temperature: float = 0.7,
    model: Optional[str] = None
) -> str:
    """Generate a streaming response using the global LLM client.
    
    For now, this returns a complete response since the stub doesn't support streaming.
    In production, this would yield chunks of the response.
    """
    return llm_client.generate_response(
        system_prompt=system_prompt,
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature,
        model=model
    )
