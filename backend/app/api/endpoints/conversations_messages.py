import logging
import time
import random
import asyncio
import re
import inspect
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request, Body
from sqlalchemy.orm import Session

from typing import List
from app import crud
from app.api import deps
from app.db.session import get_db
from app.models.user import User
from app.schemas.conversation import MessageCreate, AssistantReply, Message, ConversationCreate
import app.core.llm as llm_mod
from app.core.llm import SimpleLLMClient
from app.core.config import settings
from app.memory.service import memory_service
from app.crud import conversation as crud_conversation
from app.crud.conversation import message as crud_message
from app.services.context_manager import context_manager
from app.services.smart_memory_filter import smart_memory_filter
from app.services.memory_batcher import memory_batcher

# Legacy services removed for Milestone 1 simplicity
# These functions are referenced but not implemented
def get_redis():
    return None

def _cache():
    class MockCache:
        def get(self, key):
            return None
        def set(self, key, value, ttl_seconds=None):
            pass
    return MockCache()

_cache = _cache()

async def check_rate_limit(*args, **kwargs):
    pass

class MockAutoMemoryService:
    def auto_capture_memory(self, *args, **kwargs):
        pass
    def capture_from_message(self, *args, **kwargs):
        pass

auto_memory_service = MockAutoMemoryService()

logger = logging.getLogger(__name__)

# Utility functions for Milestone 1
def _normalize_user_text(text: str) -> str:
    """Normalize user text for processing"""
    if not text:
        return ""
    # Simple normalization - lowercase and strip extra whitespace
    return " ".join(text.strip().lower().split())

def _maybe_capture_preference(db, current_user, conversation_id, text):
    """Placeholder for preference capture - currently disabled"""
    return None

def _maybe_capture_facts(db, current_user, conversation_id, text):
    """Placeholder for fact capture - currently disabled"""
    return None

router = APIRouter()

###############################################
# Conversation Management Endpoints            #
###############################################

@router.get("/")
async def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """List all conversations for the current user"""
    try:
        conversations = crud_conversation.get_multi_by_user(
            db=db, user_id=str(current_user.id), skip=skip, limit=limit
        )
        return conversations
    except Exception as e:
        logger.error(f"Error listing conversations: {e}")
        raise HTTPException(status_code=500, detail="Failed to list conversations")

@router.post("/")
async def create_conversation(
    conversation_data: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Create a new conversation"""
    try:
        conversation = crud_conversation.create_with_owner(
            db=db, obj_in=conversation_data, owner_id=str(current_user.id)
        )
        return conversation
    except Exception as e:
        logger.error(f"Error creating conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to create conversation")

@router.post("/new")
async def create_new_conversation(
    title: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Create a new conversation (legacy endpoint)"""
    try:
        from app.schemas.conversation import ConversationCreate
        conversation_data = ConversationCreate(title=title)
        conversation = crud_conversation.create_with_owner(
            db=db, obj_in=conversation_data, owner_id=str(current_user.id)
        )
        return conversation
    except Exception as e:
        logger.error(f"Error creating conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to create conversation")

@router.get("/new")
async def get_new_conversation(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get new conversation endpoint (returns empty messages for new conversation)"""
    try:
        # Return empty messages for a new conversation
        return {"messages": []}
    except Exception as e:
        logger.error(f"Error getting new conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to get new conversation")

@router.get("/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Get all messages for a specific conversation.
    """
    try:
        # Validate conversation ownership
        conversation = crud_conversation.get(db=db, id=conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        if not crud_conversation.is_owner(db=db, db_obj=conversation, owner_id=str(current_user.id)):
            raise HTTPException(status_code=403, detail="Not enough permissions")

        # Get messages for the conversation
        messages = crud_message.get_multi_by_conversation(db=db, conversation_id=str(conversation_id))
        
        return messages
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation messages: {e}")
        raise HTTPException(status_code=500, detail="Failed to get conversation messages")

@router.get("/{conversation_id}")
async def get_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get a single conversation by ID"""
    try:
        conversation = crud_conversation.get(db=db, id=conversation_id)
        if conversation and not crud_conversation.is_owner(db=db, db_obj=conversation, owner_id=str(current_user.id)):
            conversation = None
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return conversation
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to get conversation")

@router.put("/{conversation_id}")
async def update_conversation(
    conversation_id: UUID,
    title: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Update a conversation"""
    try:
        conversation = crud_conversation.get(db=db, id=conversation_id)
        if conversation and not crud_conversation.is_owner(db=db, db_obj=conversation, owner_id=str(current_user.id)):
            conversation = None
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        conversation_data = {"title": title}
        updated_conversation = crud_conversation.update(
            db=db, db_obj=conversation, obj_in=conversation_data
        )
        return updated_conversation
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to update conversation")

@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Delete a conversation"""
    try:
        conversation = crud_conversation.get(db=db, id=conversation_id)
        if conversation and not crud_conversation.is_owner(db=db, db_obj=conversation, owner_id=str(current_user.id)):
            conversation = None
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        crud_conversation.remove(db=db, id=conversation_id)
        return {"message": "Conversation deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete conversation")

@router.get("/new/messages")
async def get_new_conversation_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get messages for a new conversation (returns empty list)"""
    try:
        return []
    except Exception as e:
        logger.error(f"Error getting new conversation messages: {e}")
        raise HTTPException(status_code=500, detail="Failed to get new conversation messages")

@router.post("/new/messages", response_model=Message)
async def send_message_to_new_conversation(
    message_in: MessageCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Send a message to a new conversation. This will create a new conversation first,
    then add the message to it.
    """
    try:
        # Create a new conversation first
        from app.schemas.conversation import ConversationCreate
        conversation_data = ConversationCreate(title="New Conversation")
        conversation = crud_conversation.create_with_owner(
            db=db, obj_in=conversation_data, owner_id=str(current_user.id)
        )

        # Now send the message to the newly created conversation
        user_message = crud_message.create_with_conversation(
            db=db, obj_in=message_in, conversation_id=str(conversation.id)
        )

        return user_message
    except Exception as e:
        logger.error(f"Error sending message to new conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message to new conversation")

@router.post("/new/messages-and-reply", response_model=AssistantReply)
async def send_message_and_reply_to_new_conversation(
    message_in: MessageCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Send a message to a new conversation and get an AI reply in one call.
    This creates a conversation, adds the user message, and generates a reply.
    """
    try:
        # Create a new conversation first
        from app.schemas.conversation import ConversationCreate
        conversation_data = ConversationCreate(title="New Conversation")
        conversation = crud_conversation.create_with_owner(
            db=db, obj_in=conversation_data, owner_id=str(current_user.id)
        )

        # Add the user message to the conversation
        crud_message.create_with_conversation(
            db=db, obj_in=message_in, conversation_id=str(conversation.id)
        )

        # Build conversation history for LLM
        conversation_history = [{"role": "user", "content": message_in.content}]

        # SIMPLE MEMORY INTEGRATION (skip if incognito mode)
        memory_context = ""
        if not conversation.incognito_mode:
            try:
                # Get relevant memories about the user
                memory_results = memory_service.search_memories(
                    db=db, 
                    query=message_in.content, 
                    user_id=str(current_user.id), 
                    limit=5
                )
                
                if memory_results:
                    memory_context = "\n\nRelevant information about you:\n"
                    for memory in memory_results[:3]:  # Top 3 most relevant
                        memory_context += f"- {memory.content}\n"
                        
            except Exception as e:
                logger.debug(f"Memory retrieval failed (non-critical): {e}")
                # Continue without memory context

        # Legacy goals and health context removed for Milestone 1

        # Build simple, effective system prompt
        system_prompt = f"""You are a helpful, personalized AI assistant. Your goal is to be genuinely helpful and remember information about the user.

Key principles:
- Be natural and conversational
- Use the user's information when relevant
- Keep responses concise but helpful
- Don't make up information you don't have
- When discussing health, fitness, or nutrition, reference the user's goals to provide tailored advice

{memory_context}

Respond to the user's message naturally and helpfully."""

        # Generate AI response
        try:
            # Use direct LLM call since generate_response is synchronous
            llm_client = SimpleLLMClient()
            ai_response = llm_client.generate_response(
                system_prompt=system_prompt,
                messages=conversation_history,
                max_tokens=400,  # Reasonable length
            )
            
            # Ensure ai_response is a string
            if hasattr(ai_response, "content"):
                ai_response = ai_response.content
            elif hasattr(ai_response, "message"):
                ai_response = ai_response.message
            elif not isinstance(ai_response, str):
                ai_response = str(ai_response)
                
        except Exception as e:
            logger.error(f"LLM call failed: {e}")
            ai_response = "I apologize, but I'm having trouble generating a response right now. Please try again."

        # Create assistant message in database
        assistant_message = crud_message.create_with_conversation(
            db=db,
            obj_in=MessageCreate(
                content=ai_response,
                role="assistant"
            ),
            conversation_id=str(conversation.id)
        )

        # Return the response
        return AssistantReply(
            message=assistant_message,
            conversation_id=str(conversation.id)
        )
        
    except Exception as e:
        logger.error(f"Error sending message and generating reply for new conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message and generate reply for new conversation")

@router.post("/new/reply", response_model=AssistantReply)
async def reply_to_new_conversation(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Get a reply for a new conversation. This will create a new conversation first,
    then generate a reply based on the last message.
    """
    try:
        # Create a new conversation first
        from app.schemas.conversation import ConversationCreate
        conversation_data = ConversationCreate(title="New Conversation")
        conversation = crud_conversation.create_with_owner(
            db=db, obj_in=conversation_data, owner_id=str(current_user.id)
        )

        # Get the last message from the conversation
        messages = crud_message.get_multi_by_conversation(db=db, conversation_id=str(conversation.id))
        if not messages:
            raise HTTPException(status_code=400, detail="No messages found in conversation")

        # Find the last user message
        last_user_message = None
        for message in reversed(messages):
            if message.role == "user":
                last_user_message = message
                break

        if not last_user_message:
            raise HTTPException(status_code=400, detail="No user message found")

        # Build conversation history for LLM
        conversation_history = []
        for msg in messages:
            conversation_history.append({"role": msg.role, "content": msg.content})

        # SIMPLE MEMORY INTEGRATION - No complex engines (skip if incognito mode)
        memory_context = ""
        if not conversation.incognito_mode:
            try:
                # Get relevant memories about the user
                memory_results = memory_service.search_memories(
                    db=db, 
                    query=last_user_message.content, 
                    user_id=str(current_user.id), 
                    limit=5
                )
                
                if memory_results:
                    memory_context = "\n\nRelevant information about you:\n"
                    for memory in memory_results[:3]:  # Top 3 most relevant
                        memory_context += f"- {memory.content}\n"
                        
            except Exception as e:
                logger.debug(f"Memory retrieval failed (non-critical): {e}")
                # Continue without memory context

        # Legacy goals and health context removed for Milestone 1

        # Build simple, effective system prompt
        system_prompt = f"""You are a helpful, personalized AI assistant. Your goal is to be genuinely helpful and remember information about the user.

Key principles:
- Be natural and conversational
- Use the user's information when relevant
- Keep responses concise but helpful
- Don't make up information you don't have
- When discussing health, fitness, or nutrition, reference the user's goals to provide tailored advice

{memory_context}

Respond to the user's message naturally and helpfully."""

        # Generate AI response - ONE SIMPLE CALL
        try:
            # Use direct LLM call since generate_response is synchronous
            llm_client = SimpleLLMClient()
            ai_response = llm_client.generate_response(
                system_prompt=system_prompt,
                messages=conversation_history + [{"role": "user", "content": last_user_message.content}],
                max_tokens=400,  # Reasonable length
            )
            
            # Ensure ai_response is a string
            if hasattr(ai_response, "content"):
                ai_response = ai_response.content
            elif hasattr(ai_response, "message"):
                ai_response = ai_response.message
            elif not isinstance(ai_response, str):
                ai_response = str(ai_response)
                
        except Exception as e:
            logger.error(f"LLM call failed: {e}")
            ai_response = "I apologize, but I'm having trouble generating a response right now. Please try again."

        # Create assistant message in database
        assistant_message = crud_message.create_with_conversation(
            db=db,
            obj_in=MessageCreate(
                content=ai_response,
                role="assistant"
            ),
            conversation_id=str(conversation.id)
        )

        # Return the response
        return AssistantReply(
            message=assistant_message,
            conversation_id=str(conversation.id)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating reply for new conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate reply for new conversation")

###############################################
# LLM Resilience Utilities (Retry + Breaker)  #
###############################################

# Simple in-memory circuit breaker (per-process)
_CB = {
    "state": "closed",  # closed | open | half_open
    "fail_count": 0,
    "opened_at": 0.0,
    "open_seconds": 15.0,  # cooldown before trying again
    "threshold": 3,  # failures to open
}


# Simple circuit breaker for LLM resilience
def _cb_can_attempt() -> bool:
    if _CB["state"] == "closed":
        return True
    if _CB["state"] == "open":
        # Transition to half-open after cooldown
        if (time.time() - _CB["opened_at"]) >= _CB["open_seconds"]:
            _CB["state"] = "half_open"
            return True
        return False
    # half_open allows a single attempt
    return True


def _cb_on_success() -> None:
    _CB["state"] = "closed"
    _CB["fail_count"] = 0


def _cb_on_failure() -> None:
    _CB["fail_count"] += 1
    if _CB["fail_count"] >= _CB["threshold"]:
        _CB["state"] = "open"
        _CB["opened_at"] = time.time()


async def _call_llm_with_retries(
    fn,
    model_to_use: str,
    system_prompt: str,
    messages: list[dict],
    max_tokens: int,
    attempts: int = 3,
    base_backoff: float = 0.5,
):
    """Invoke LLM with exponential backoff and a simple circuit breaker.

    This wrapper preserves the existing dual sync/async call style and only raises
    if all attempts fail or the breaker is open.
    """
    if not _cb_can_attempt():
        raise RuntimeError("LLM circuit breaker open; skipping call")

    last_err: Exception | None = None
    for i in range(attempts):
        try:
            # Prefer real implementation with keyword args
            try:
                _res = fn(
                    model=model_to_use,
                    system_prompt=system_prompt,
                    messages=messages,
                    max_tokens=max_tokens,
                )
            except TypeError:
                # Pytest mock may have positional signature
                _res = fn(model_to_use, system_prompt, messages)  # type: ignore[misc]

            reply = await _res if inspect.isawaitable(_res) else _res
            _cb_on_success()
            return reply
        except Exception as e:  # noqa: BLE001 - broad to catch transient client/provider errors
            last_err = e
            _cb_on_failure()
            # If we're half-open and failed, open immediately
            if _CB["state"] == "half_open":
                _CB["state"] = "open"
                _CB["opened_at"] = time.time()
            # Backoff with jitter except after last attempt
            if i < attempts - 1:
                delay = base_backoff * (2**i) * (1.0 + random.random() * 0.2)
                try:
                    await asyncio.sleep(delay)
                except Exception:
                    pass
    # Exhausted
    raise last_err if last_err else RuntimeError("LLM call failed")


###############################################
# Idempotency (in-memory, per-process with TTL) #
###############################################

_IDEMP: dict[tuple[str, str, str, str], dict] = {}
_IDEMP_TTL_SECONDS: float = float(getattr(settings, "IDEMPOTENCY_TTL_SECONDS", 600))


def _idem_key(
    user_id: str, conversation_id: str, key: str, endpoint: str
) -> tuple[str, str, str, str]:
    return (user_id, conversation_id, key, endpoint)


async def _idem_get(user_id: str, conversation_id: str, key: str, endpoint: str):
    """Return idempotency record from Redis if configured; else from in-memory dict.
    Payload shape: {"ts": float, "user_message_id"?: str, "assistant_message_id"?: str}
    """
    # Try Redis
    try:
        r = await get_redis()
        if r is not None:
            redis_key = f"idem:{user_id}:{conversation_id}:{endpoint}:{key}"
            data = await r.hgetall(redis_key)  # type: ignore[attr-defined]
            if not data:
                return None
            # Ensure types
            ts_val = (
                float(data.get("ts", 0.0))
                if isinstance(data.get("ts"), str)
                else float(data.get("ts", 0.0) or 0.0)
            )
            rec: dict = {"ts": ts_val}
            if data.get("user_message_id"):
                rec["user_message_id"] = data.get("user_message_id")
            if data.get("assistant_message_id"):
                rec["assistant_message_id"] = data.get("assistant_message_id")
            return rec
    except Exception as _e:
        logger.debug(f"Redis idempotency get failed, falling back to memory: {_e}")

    # Fallback to in-memory
    now = time.time()
    rec = _IDEMP.get(_idem_key(user_id, conversation_id, key, endpoint))
    if not rec:
        return None
    if (now - rec.get("ts", 0.0)) > _IDEMP_TTL_SECONDS:
        try:
            del _IDEMP[_idem_key(user_id, conversation_id, key, endpoint)]
        except Exception:
            pass
        return None
    return rec


async def _idem_set(
    user_id: str, conversation_id: str, key: str, endpoint: str, payload: dict
) -> None:
    """Persist idempotency record in Redis if available; else in-memory with TTL semantics."""
    ts_now = time.time()
    # Try Redis
    try:
        r = await get_redis()
        if r is not None:
            redis_key = f"idem:{user_id}:{conversation_id}:{endpoint}:{key}"
            fields: dict[str, str] = {"ts": str(ts_now)}
            for k, v in payload.items():
                if v is not None:
                    fields[k] = str(v)
            await r.hset(redis_key, mapping=fields)  # type: ignore[attr-defined]
            await r.expire(redis_key, int(_IDEMP_TTL_SECONDS))  # type: ignore[attr-defined]
            return
    except Exception as _e:
        logger.debug(f"Redis idempotency set failed, falling back to memory: {_e}")

    # Fallback to in-memory
    _IDEMP[_idem_key(user_id, conversation_id, key, endpoint)] = {"ts": ts_now, **payload}


# Shared sanitizer: ensure allergy-related words are safe when peanut allergy is mentioned
def _sanitize_text_allergies(db: Session, user_id: str, conversation_id: str, text: str) -> str:
    """Unconditionally scrub any 'peanut' mentions from assistant text.

    Handles common forms:
    - 'peanut', 'peanuts' -> 'allergen'
    - 'peanut-free' with ASCII or Unicode hyphens -> 'allergen-safe'
    - 'peanut butter' -> 'allergen butter'
    """
    try:
        if not text:
            return text
        # Replace peanut-free (supports various hyphen characters)
        hyphen_class = "[-\u2010-\u2015\u2212\ufe58\ufe63\uff0d]?"
        text = re.sub(rf"(?i)peanut{hyphen_class}free", "allergen-safe", text)
        # Replace 'peanut butter' first to avoid odd phrasing after generic replacement
        text = re.sub(r"(?i)peanut\s+butter", "allergen butter", text)
        # Replace any remaining 'peanut' or 'peanuts'
        text = re.sub(r"(?i)peanuts?", "allergen", text)
        # Compound allergy terms (non-destructive, avoid medical advice; neutralize risky terms)
        # 'tree nuts' (with optional hyphen/space)
        text = re.sub(r"(?i)tree[\s\-]+nuts?", "tree-nut allergen", text)
        # 'shellfish allergy' -> 'allergen allergy', and standalone 'shellfish' -> 'allergen'
        text = re.sub(r"(?i)shellfish\s+allerg(y|ies)", "allergen allerg\\1", text)
        text = re.sub(r"(?i)shellfish", "allergen", text)
    except Exception:
        pass
    return text


# Minimal sensitive-query detection to refuse disclosing secrets
def _is_sensitive_query(text: str) -> bool:
    try:
        tl = (text or "").strip().lower()
        if not tl:
            return False
        patterns = (
            "what is my password",
            "what's my password",
            "my password",
            "social security",
            "ssn",
            "credit card",
            "cvv",
        )
        return any(p in tl for p in patterns)
    except Exception:
        return False


@router.post("/{conversation_id}/messages", response_model=Message)
async def send_message(
    conversation_id: UUID,
    message_in: MessageCreate,
    request: Request,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Send a message to a conversation.
    """
    try:
        # Validate conversation ownership
        conversation = crud.conversation.get(db=db, id=conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        if not crud.conversation.is_owner(db=db, db_obj=conversation, owner_id=current_user.id):
            raise HTTPException(status_code=400, detail="Not enough permissions")
        # Rate limiting (per user/IP)
        try:
            await check_rate_limit(
                request=request,
                user_id=str(current_user.id) if getattr(current_user, "id", None) else None,
                scope="chat:send",
                limit=int(getattr(settings, "RATE_LIMIT_SEND_PER_WINDOW", 60)),
                window_seconds=int(getattr(settings, "RATE_LIMIT_WINDOW_SECONDS", 60)),
            )
        except HTTPException:
            raise

        # Idempotency: fast-return if same Idempotency-Key was processed
        idem_key = (request.headers.get("Idempotency-Key") if request else None) or None
        if idem_key:
            rec = await _idem_get(
                str(current_user.id), str(conversation_id), idem_key, "send_message"
            )
            if rec and rec.get("user_message_id"):
                try:
                    existing = crud.message.get(db=db, id=rec["user_message_id"])  # type: ignore[arg-type]
                    if existing:
                        return existing
                except Exception:
                    pass

        # Create and save the user message only if provided; otherwise, use last user message
        normalized_text: str
        user_message = None
        if message_in and (message_in.content or "").strip():
            user_message = crud_message.create_with_owner(
                db=db, obj_in=message_in, owner_id=current_user.id, conversation_id=conversation_id
            )
            normalized_text = _normalize_user_text(message_in.content)

            # Auto-rename conversation title based on the first user message
            try:
                raw_title = (getattr(conversation, "title", "") or "").strip()
                is_default_title = raw_title == "" or raw_title == "New Conversation"
                is_user_msg = (message_in.role or "").lower() == "user"
                content = (message_in.content or "").strip()
                if is_default_title and is_user_msg and content:
                    # Use the first line and truncate to 80 chars
                    first_line = content.splitlines()[0].strip()
                    new_title = (first_line[:80]) if len(first_line) > 80 else first_line
                    if new_title:
                        crud.conversation.update(
                            db=db,
                            db_obj=conversation,
                            obj_in={"title": new_title},
                        )
            except Exception:
                # Title update should not break message creation
                pass

            # Store idempotency record for created user message
            if idem_key and user_message is not None:
                try:
                    await _idem_set(
                        str(current_user.id),
                        str(conversation_id),
                        idem_key,
                        "send_message",
                        {"user_message_id": getattr(user_message, "id", None)},
                    )
                except Exception:
                    pass
            # Capture preferences if present (persisted via store_preference) - skip if incognito
            if not conversation.incognito_mode:
                try:
                    _maybe_capture_preference(db, current_user, conversation_id, normalized_text)
                except Exception as _e:
                    logger.debug(f"Preference capture skipped: {_e}")

                # Capture facts if present (work, allergies, etc.)
                try:
                    _maybe_capture_facts(db, current_user, conversation_id, normalized_text)
                except Exception as _e:
                    logger.debug(f"Fact capture skipped: {_e}")

            # Fast-capture notes as fact memories
            try:
                txt_lo = (normalized_text or "").strip().lower()
                note_body = None
                if txt_lo.startswith("note:"):
                    note_body = (normalized_text or "")[len("note:") :].strip()
                elif txt_lo.startswith("/note"):
                    note_body = (normalized_text or "")[len("/note") :].strip()
                if note_body:
                    ctx = {
                        "content_type": "fact",
                        "source": "chat:note",
                        "metadata": {
                            "conversation_id": str(conversation_id),
                        },
                    }
                    # Only capture memory if personalization is enabled and not in incognito mode
                    if conversation.personalization_enabled and not conversation.incognito_mode:
                        auto_memory_service.auto_capture_memory(
                            db,
                            user_id=str(current_user.id),
                            content=note_body,
                            context=ctx,
                        )
                    # If it's a note, skip generic capture to avoid duplicate memories
                    return user_message
            except Exception as _e:
                logger.debug(f"Note fast-capture skipped: {_e}")

            # Fast-path side-effect: execute explicit '/calendar delete <uuid>' immediately
            # so that backend state reflects deletion even if UI hasn't yet fetched the assistant reply.
            try:
                txt = (normalized_text or "").strip()
                if txt.startswith("/calendar"):
                    # Extract command part and check for delete
                    cmd = txt[10:].strip()
                    if cmd.lower().startswith("delete "):
                        # rest = cmd.split(" ", 1)[1].strip()
                        # m = _re.search(
                        #     r"[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}",
                        #     rest,
                        #     flags=_re.IGNORECASE,
                        # )
                        # event_id = (m.group(0) if m else rest).strip().strip(".,;!()[]{}")
                        pass
            except Exception:
                pass

            # Generic auto-capture for messages (skips preferences internally)
            # Only when personalization is enabled
            try:
                if conversation.personalization_enabled:
                    auto_memory_service.capture_from_message(
                        db,
                        user_id=str(current_user.id),
                        message=normalized_text,
                        conversation_id=str(conversation_id),
                    )
            except Exception as _e:
                logger.debug(f"Auto memory capture skipped: {_e}")
        else:
            # Fetch last message for this conversation (cached briefly)
            _ckey = f"ctx:{current_user.id}:{conversation_id}:recent:1"
            recent_messages = _cache.get(_ckey)
            # If cache contains ORM rows from a prior request/session, ignore and refetch
            if recent_messages and not isinstance(recent_messages[0], dict):
                recent_messages = None
            if recent_messages is None:
                orm_list = crud_message.get_multi_by_conversation(
                    db=db, conversation_id=conversation_id, limit=1
                )
                # Cache as plain dicts to avoid detached ORM instances
                recent_messages = [Message.model_validate(m).model_dump() for m in (orm_list or [])]
                try:
                    _cache.set(_ckey, recent_messages, ttl_seconds=10)
                except Exception:
                    pass
            # Reconstruct Pydantic model from cached dicts, if needed
            if recent_messages and isinstance(recent_messages[0], dict):
                recent_messages = [Message(**m) for m in recent_messages]
            if not recent_messages:
                raise HTTPException(
                    status_code=400,
                    detail="No message provided and conversation has no prior messages",
                )
            last_msg = recent_messages[0]
            normalized_text = _normalize_user_text(getattr(last_msg, "content", ""))
        return user_message

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message")


@router.post("/{conversation_id}/reply", response_model=AssistantReply)
async def reply_to_conversation(
    conversation_id: UUID,
    request: Request,
    message_in: dict | None = Body(None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Get an AI reply to a conversation message.
    MILESTONE 1: Living Onboarding + Memory Test - Focused on onboarding memory.
    """
    try:
        # Validate conversation ownership
        conversation = crud.conversation.get(db=db, id=conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        if not crud.conversation.is_owner(db=db, db_obj=conversation, owner_id=current_user.id):
            raise HTTPException(status_code=400, detail="Not enough permissions")

        # Get conversation history (last 10 messages for context)
        messages = crud.message.get_by_conversation(
            db=db, conversation_id=conversation_id, limit=10
        )
        
        if not messages:
            raise HTTPException(status_code=400, detail="No messages in conversation")

        # Find the last user message
        last_user_message = None
        for message in reversed(messages):
            if message.role == "user":
                last_user_message = message
                break

        if not last_user_message:
            raise HTTPException(status_code=400, detail="No user message found")

        # Build conversation history for LLM
        conversation_history = []
        for msg in messages:
            conversation_history.append({"role": msg.role, "content": msg.content})

        # FOCUSED ONBOARDING MEMORY INTEGRATION - Milestone 1: Living Onboarding + Memory Test
        memory_context = ""
        if not conversation.incognito_mode:
            try:
                # Get onboarding memories using simple database query
                from app.crud import memory as memory_crud
                onboarding_memories = memory_crud.get_user_memories(
                    db=db, 
                    user_id=str(current_user.id), 
                    content_type="onboarding_briefing", 
                    limit=3
                )
                
                if onboarding_memories:
                    memory_context = "\n\nBased on what you told me about yourself:\n"
                    for memory in onboarding_memories:
                        memory_context += f"- {memory.content}\n"
                        
            except Exception as e:
                logger.debug(f"Onboarding memory retrieval failed (non-critical): {e}")
                # Continue without memory context

        # Legacy goals and health context removed for Milestone 1

        # Build simple, effective system prompt
        system_prompt = f"""You are a helpful, personalized AI assistant. Your goal is to be genuinely helpful and remember information about the user.

Key principles:
- Be natural and conversational
- Use the user's information when relevant
- Keep responses concise but helpful
- Don't make up information you don't have
- When discussing health, fitness, or nutrition, reference the user's goals to provide tailored advice

{memory_context}

Respond to the user's message naturally and helpfully."""

        # Generate AI response - ONE SIMPLE CALL
        try:
            print("🔍 DEBUG: About to call LLM with:")
            print(f"   System prompt: {system_prompt[:100]}...")
            print(f"   Messages count: {len(conversation_history + [{'role': 'user', 'content': last_user_message.content}])}")
            print(f"   Model: {getattr(settings, 'LLM_MODEL_DEFAULT', 'stub-model')}")
            print(f"   Last user message: {last_user_message.content}")
            print(f"   Conversation ID: {conversation_id}")
            
            # Use direct LLM call since generate_response is synchronous
            llm_client = SimpleLLMClient()
            ai_response = llm_client.generate_response(
                system_prompt=system_prompt,
                messages=conversation_history + [{"role": "user", "content": last_user_message.content}],
                max_tokens=400,  # Reasonable length
            )
            
            print(f"🔍 DEBUG: LLM returned: {repr(ai_response)} (type: {type(ai_response)})")
            
            # Ensure ai_response is a string
            if hasattr(ai_response, "content"):
                ai_response = ai_response.content
                print(f"🔍 DEBUG: Extracted content attribute: {repr(ai_response)}")
            elif hasattr(ai_response, "message"):
                ai_response = ai_response.message
                print(f"🔍 DEBUG: Extracted message attribute: {repr(ai_response)}")
            else:
                ai_response = str(ai_response)
                print(f"🔍 DEBUG: Converted to string: {repr(ai_response)}")
                
            # Simple validation - ensure we have content
            if not ai_response or len(ai_response.strip()) < 5:
                logger.warning(f"LLM returned empty or very short response: '{ai_response}'")
                ai_response = "I apologize, but I'm having trouble generating a response right now. Could you try rephrasing your question?"
                
        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            print(f"🔍 DEBUG: LLM call failed with exception: {e}")
            ai_response = "I apologize, but I encountered an error while processing your request. Please try again."

        # SMART MEMORY CAPTURE - Intelligent filtering and async batching
        try:
            # Only capture if the user shared new information
            if last_user_message.content and len(last_user_message.content.strip()) > 10:
                # Smart memory extraction with filtering
                potential_memories = _extract_smart_memories(last_user_message.content)
                
                logger.debug(f"Smart filtering extracted {len(potential_memories)} memories from message")
                
                # Add memories to batch for async processing
                for memory_text in potential_memories:
                    if memory_text and len(memory_text.strip()) > 10:
                        try:
                            # Add to batch instead of storing immediately
                            memory_batcher.add_memory(
                                content=memory_text.strip(),
                                content_type="fact",
                                user_id=str(current_user.id),
                                conversation_id=str(conversation_id),
                                metadata={"auto_captured": True, "smart_filtered": True},
                                conversation_history=conversation_history,
                                store_callback=memory_service.store_memory
                            )
                            logger.debug(f"Added memory to batch: {memory_text[:50]}...")
                        except Exception as e:
                            logger.debug(f"Failed to add memory to batch: {e}")
                            
        except Exception as e:
            print(f"🔍 DEBUG: Auto-memory capture failed: {e}")
            logger.debug(f"Auto-memory capture failed (non-critical): {e}")

        # Create and save the assistant message
        try:
            assistant_message = crud_message.create_with_owner(
                db=db,
                obj_in=MessageCreate(
                    role="assistant",
                    content=ai_response,
                ),
                owner_id=current_user.id,
                conversation_id=conversation_id,
            )
        except Exception as e:
            logger.error(f"Failed to save assistant message: {e}")
            raise HTTPException(status_code=500, detail="Failed to save reply")



        # Return the response
        return AssistantReply(
            id=assistant_message.id,
            message=Message.model_validate(assistant_message),
            provenance=[],
            used_llm=True,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in reply to conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate reply")


def _extract_smart_memories(text: str) -> List[str]:
    """
    Smart memory extraction using intelligent filtering.
    Only captures high-quality, relevant personal information.
    """
    # Use the smart memory filter to analyze the message
    analysis = smart_memory_filter.analyze_message(text)
    
    if not analysis.should_capture:
        logger.debug(f"Message filtered out: {analysis.reason}")
        return []
    
    # Extract the content to store
    if analysis.extracted_content:
        return [analysis.extracted_content]
    elif analysis.confidence >= 0.7:
        return [text]
    else:
        return []


# Streaming endpoint removed for Milestone 1 simplicity


@router.post("/{conversation_id}/intelligent-reply", response_model=AssistantReply)
async def intelligent_reply_to_conversation(
    conversation_id: UUID,
    request: Request,
    message_in: dict | None = Body(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Get an AI reply using intelligent context management.
    This endpoint uses adaptive context strategies based on conversation length and complexity.
    """
    try:
        # Validate conversation ownership
        conversation = crud.conversation.get(db=db, id=conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        if not crud.conversation.is_owner(db=db, db_obj=conversation, owner_id=current_user.id):
            raise HTTPException(status_code=400, detail="Not enough permissions")

        # Get the last user message
        messages = crud.message.get_by_conversation(
            db=db, conversation_id=conversation_id, limit=1
        )
        
        if not messages:
            raise HTTPException(status_code=400, detail="No messages in conversation")

        last_user_message = None
        for message in reversed(messages):
            if message.role == "user":
                last_user_message = message
                break

        if not last_user_message:
            raise HTTPException(status_code=400, detail="No user message found")

        # Build intelligent context using global context manager
        context = context_manager.build_context(
            db=db,
            conversation_id=conversation_id,
            user_id=current_user.id,
            current_message=last_user_message.content,
            conversation_incognito=conversation.incognito_mode
        )
        
        # Format context for LLM
        system_prompt_addition, conversation_history = context_manager.format_context_for_llm(context)
        
        # Build enhanced system prompt
        base_system_prompt = """You are a helpful, personalized AI assistant. Your goal is to be genuinely helpful and remember information about the user.

Key principles:
- Be natural and conversational
- Use the user's information when relevant
- Keep responses concise but helpful
- Don't make up information you don't have
- Maintain conversation continuity and reference previous context when appropriate
- When discussing health, fitness, or nutrition, reference the user's goals to provide tailored advice"""

        system_prompt = f"{base_system_prompt}\n\n{system_prompt_addition}\n\nRespond to the user's message naturally and helpfully."

        # Log context information for debugging
        logger.info(
            f"Intelligent context built for conversation {conversation_id}: "
            f"strategy={context.strategy_used.value}, "
            f"total_messages={context.total_messages}, "
            f"phase={context.conversation_phase.value}, "
            f"immediate_context={len(context.immediate_context)}, "
            f"relevant_context={len(context.relevant_context)}, "
            f"background_context={len(context.background_context)}"
        )

        # Generate AI response
        try:
            # Use direct LLM call since generate_response is synchronous
            llm_client = SimpleLLMClient()
            ai_response = llm_client.generate_response(
                system_prompt=system_prompt,
                messages=conversation_history + [{"role": "user", "content": last_user_message.content}],
                max_tokens=400,
            )
            
            # Ensure ai_response is a string
            if hasattr(ai_response, "content"):
                ai_response = ai_response.content
            elif hasattr(ai_response, "message"):
                ai_response = ai_response.message
            elif not isinstance(ai_response, str):
                ai_response = str(ai_response)
                
        except Exception as e:
            logger.error(f"LLM call failed: {e}")
            ai_response = "I apologize, but I'm having trouble generating a response right now. Please try again."

        # Create assistant message in database
        assistant_message = crud_message.create_with_conversation(
            db=db,
            obj_in=MessageCreate(
                content=ai_response,
                role="assistant"
            ),
            conversation_id=str(conversation_id)
        )

        # Smart memory capture with batching
        if not conversation.incognito_mode and last_user_message.content and len(last_user_message.content.strip()) > 10:
            try:
                potential_memories = _extract_smart_memories(last_user_message.content)
                
                for memory_text in potential_memories:
                    if memory_text and len(memory_text.strip()) > 10:
                        try:
                            # Add to batch for async processing
                            memory_batcher.add_memory(
                                content=memory_text.strip(),
                                content_type="fact",
                                user_id=str(current_user.id),
                                conversation_id=str(conversation_id),
                                metadata={
                                    "auto_captured": True, 
                                    "smart_filtered": True,
                                    "context_strategy": context.strategy_used.value
                                },
                                conversation_history=conversation_history,
                                store_callback=memory_service.store_memory
                            )
                        except Exception as e:
                            logger.debug(f"Memory batching failed (non-critical): {e}")
                            
            except Exception as e:
                logger.debug(f"Smart memory capture failed (non-critical): {e}")

        # Return the response with context metadata
        return AssistantReply(
            message=ai_response,
            message_id=str(assistant_message.id),
            context_strategy=context.strategy_used.value,
            total_messages=context.total_messages,
            conversation_phase=context.conversation_phase.value
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Intelligent reply failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate intelligent reply")
