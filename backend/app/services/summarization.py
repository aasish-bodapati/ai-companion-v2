from __future__ import annotations

from typing import List, Dict
from uuid import UUID, uuid4
import logging
import time

from sqlalchemy.orm import Session

from app.core.llm import generate_with_openrouter
from app.core.config import settings
from app import crud

logger = logging.getLogger(__name__)


# Model can be overridden via env: settings.LLM_MODEL_SUMMARY or fallback to default
MODEL = (
    getattr(settings, "LLM_MODEL_SUMMARY", None)
    or getattr(settings, "LLM_MODEL_DEFAULT", None)
    or "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free"
).strip()
TEMPERATURE = 0.7
MAX_TOKENS = 1024  # enforced in core.llm.generate_with_openrouter


def _build_system_prompt(user_id: str, conversation_id: str) -> str:
    # Include required identifiers to comply with AI Integration Rules
    return (
        "You are an AI assistant generating a concise conversation summary.\n"
        "- Always consider safety and do not fabricate content.\n"
        "- Keep it objective and short (3-6 bullet points or ~120-180 words).\n"
        "- Highlight goals, decisions, and follow-ups.\n"
        f"- user_id: {user_id}\n"
        f"- conversation_id: {conversation_id}\n"
    )


def _build_messages(transcript: List[Dict[str, str]]) -> List[Dict[str, str]]:
    # transcript is expected as [{"role": "user"|"assistant", "content": str}, ...]
    # We add a final instruction to summarize.
    messages = list(transcript)
    messages.append(
        {
            "role": "user",
            "content": (
                "Summarize the above conversation for my records. "
                "Include key topics, decisions, and next steps."
            ),
        }
    )
    return messages


def generate_conversation_summary(
    db: Session,
    *,
    conversation_id: UUID,
    user_id: UUID,
    limit_messages: int = 30,
) -> str:
    """
    Create an LLM summary from the last N messages of a conversation.
    Ensures user_id and conversation_id are passed (in system prompt) per rules.
    Returns a non-empty string; falls back to a deterministic stub if LLM unavailable.
    """
    # Load recent messages (most recent first -> ensure chronological order)
    trace_id = uuid4().hex
    msgs = crud.message.get_by_conversation(
        db, conversation_id=conversation_id, skip=0, limit=limit_messages
    )
    if not msgs:
        logger.info(
            "summary.skip_empty trace_id=%s user_id=%s conversation_id=%s",
            trace_id,
            user_id,
            conversation_id,
        )
        return "(empty) No messages to summarize."

    # Sort by created order if needed (assuming CRUD returns chronological already)
    # Build transcript in chat format
    transcript: List[Dict[str, str]] = []
    for m in msgs[-limit_messages:]:
        role = "assistant" if m.role == "assistant" else "user"
        content = (m.content or "").strip()
        if not content:
            continue
        # Cap any extremely long content chunks to control token usage
        if len(content) > 4000:
            content = content[:4000] + " …"
        transcript.append({"role": role, "content": content})

    system_prompt = _build_system_prompt(user_id=str(user_id), conversation_id=str(conversation_id))
    try:
        logger.info(
            "summary.call.start trace_id=%s user_id=%s conversation_id=%s model=%s msgs=%d",
            trace_id,
            user_id,
            conversation_id,
            MODEL,
            len(transcript) + 1,  # +1 for the summarization instruction
        )
        start = time.perf_counter()
        summary = generate_with_openrouter(
            model=MODEL,
            system_prompt=system_prompt,
            messages=_build_messages(transcript),
        )
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        summary = (summary or "").strip()
        if not summary:
            logger.warning(
                "summary.call.empty trace_id=%s user_id=%s conversation_id=%s elapsed_ms=%d",
                trace_id,
                user_id,
                conversation_id,
                elapsed_ms,
            )
            return "(stub) Summarization returned empty content."
        logger.info(
            "summary.call.ok trace_id=%s user_id=%s conversation_id=%s "
            "elapsed_ms=%d content_len=%d",
            trace_id,
            user_id,
            conversation_id,
            elapsed_ms,
            len(summary),
        )
        return summary
    except Exception as e:
        logger.error(
            "summary.call.error trace_id=%s user_id=%s conversation_id=%s err=%s",
            trace_id,
            user_id,
            conversation_id,
            str(e),
            exc_info=True,
        )
        return "(stub) Summarization failed; using fallback."
