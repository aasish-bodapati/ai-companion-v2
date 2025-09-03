from __future__ import annotations

from typing import List, Dict, Optional, Tuple
from uuid import UUID, uuid4
import logging
import time
from dataclasses import dataclass
from enum import Enum

from sqlalchemy.orm import Session

from app.core.llm import generate_response
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
MAX_TOKENS = 1024  # enforced in core.llm.generate_response


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
        summary = generate_response(
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


class SummaryType(Enum):
    """Types of summaries for different use cases."""
    CONVERSATION_OVERVIEW = "conversation_overview"
    TOPIC_SUMMARY = "topic_summary"
    KEY_POINTS = "key_points"
    ACTION_ITEMS = "action_items"


@dataclass
class ConversationSummary:
    """Structured conversation summary."""
    summary_type: SummaryType
    content: str
    message_count: int
    time_range: Optional[Tuple[str, str]] = None
    topics: List[str] = None
    key_decisions: List[str] = None
    action_items: List[str] = None


class IntelligentSummarizer:
    """Enhanced summarization service with multiple summary types."""
    
    def __init__(self):
        self.model = MODEL
        self.temperature = TEMPERATURE
        self.max_tokens = MAX_TOKENS

    def generate_topic_summary(
        self,
        db: Session,
        conversation_id: UUID,
        user_id: UUID,
        topic_keywords: List[str],
        limit_messages: int = 20
    ) -> str:
        """Generate a summary focused on a specific topic."""
        try:
            messages = crud.message.get_by_conversation(
                db, conversation_id, limit=limit_messages
            )
            
            if not messages:
                return "(empty) No messages to summarize."
            
            # Filter messages related to the topic
            topic_messages = self._filter_messages_by_topic(messages, topic_keywords)
            
            if not topic_messages:
                return f"No messages found related to: {', '.join(topic_keywords)}"
            
            transcript = self._build_transcript(topic_messages)
            
            system_prompt = (
                f"You are summarizing a conversation about: {', '.join(topic_keywords)}\n"
                f"Focus on key points, decisions, and outcomes related to this topic.\n"
                f"Keep it concise (2-4 bullet points, ~80-120 words).\n"
                f"- user_id: {user_id}\n"
                f"- conversation_id: {conversation_id}\n"
            )
            
            summary = generate_response(
                model=self.model,
                system_prompt=system_prompt,
                messages=self._build_messages(transcript)
            )
            
            return (summary or "").strip() or "(stub) Topic summary failed."
            
        except Exception as e:
            logger.error(f"Error generating topic summary: {e}")
            return "(stub) Topic summary failed."

    def generate_key_points_summary(
        self,
        db: Session,
        conversation_id: UUID,
        user_id: UUID,
        limit_messages: int = 30
    ) -> ConversationSummary:
        """Generate a structured summary with key points and decisions."""
        try:
            messages = crud.message.get_by_conversation(
                db, conversation_id, limit=limit_messages
            )
            
            if not messages:
                return ConversationSummary(
                    summary_type=SummaryType.KEY_POINTS,
                    content="(empty) No messages to summarize.",
                    message_count=0
                )
            
            transcript = self._build_transcript(messages)
            
            system_prompt = (
                "Extract key points, decisions, and important information from this conversation.\n"
                "Format as:\n"
                "KEY POINTS:\n"
                "- Point 1\n"
                "- Point 2\n\n"
                "DECISIONS:\n"
                "- Decision 1\n"
                "- Decision 2\n\n"
                "ACTION ITEMS:\n"
                "- Action 1\n"
                "- Action 2\n"
                f"- user_id: {user_id}\n"
                f"- conversation_id: {conversation_id}\n"
            )
            
            summary = generate_response(
                model=self.model,
                system_prompt=system_prompt,
                messages=self._build_messages(transcript)
            )
            
            # Parse the structured summary
            parsed = self._parse_structured_summary(summary or "")
            
            return ConversationSummary(
                summary_type=SummaryType.KEY_POINTS,
                content=summary or "(stub) Key points summary failed.",
                message_count=len(messages),
                topics=parsed.get("topics", []),
                key_decisions=parsed.get("decisions", []),
                action_items=parsed.get("actions", [])
            )
            
        except Exception as e:
            logger.error(f"Error generating key points summary: {e}")
            return ConversationSummary(
                summary_type=SummaryType.KEY_POINTS,
                content="(stub) Key points summary failed.",
                message_count=0
            )

    def generate_conversation_overview(
        self,
        db: Session,
        conversation_id: UUID,
        user_id: UUID,
        limit_messages: int = 50
    ) -> ConversationSummary:
        """Generate a high-level overview of the entire conversation."""
        try:
            messages = crud.message.get_by_conversation(
                db, conversation_id, limit=limit_messages
            )
            
            if not messages:
                return ConversationSummary(
                    summary_type=SummaryType.CONVERSATION_OVERVIEW,
                    content="(empty) No messages to summarize.",
                    message_count=0
                )
            
            transcript = self._build_transcript(messages)
            
            system_prompt = (
                "Provide a high-level overview of this conversation.\n"
                "Include:\n"
                "- Main topics discussed\n"
                "- Overall tone and purpose\n"
                "- Key outcomes or conclusions\n"
                "Keep it concise (3-5 sentences, ~100-150 words).\n"
                f"- user_id: {user_id}\n"
                f"- conversation_id: {conversation_id}\n"
            )
            
            summary = generate_response(
                model=self.model,
                system_prompt=system_prompt,
                messages=self._build_messages(transcript)
            )
            
            # Extract topics from the summary
            topics = self._extract_topics_from_summary(summary or "")
            
            return ConversationSummary(
                summary_type=SummaryType.CONVERSATION_OVERVIEW,
                content=summary or "(stub) Overview summary failed.",
                message_count=len(messages),
                topics=topics
            )
            
        except Exception as e:
            logger.error(f"Error generating conversation overview: {e}")
            return ConversationSummary(
                summary_type=SummaryType.CONVERSATION_OVERVIEW,
                content="(stub) Overview summary failed.",
                message_count=0
            )

    def _filter_messages_by_topic(
        self, 
        messages: List, 
        topic_keywords: List[str]
    ) -> List:
        """Filter messages that are relevant to the given topic keywords."""
        if not topic_keywords:
            return messages
        
        topic_lower = [kw.lower() for kw in topic_keywords]
        relevant_messages = []
        
        for msg in messages:
            content = (msg.content or "").lower()
            if any(keyword in content for keyword in topic_lower):
                relevant_messages.append(msg)
        
        return relevant_messages

    def _build_transcript(self, messages: List) -> List[Dict[str, str]]:
        """Build transcript from messages."""
        transcript = []
        for msg in messages:
            role = "assistant" if msg.role == "assistant" else "user"
            content = (msg.content or "").strip()
            if content:
                # Cap extremely long content
                if len(content) > 4000:
                    content = content[:4000] + " …"
                transcript.append({"role": role, "content": content})
        
        return transcript

    def _parse_structured_summary(self, summary: str) -> Dict[str, List[str]]:
        """Parse a structured summary into components."""
        result = {
            "topics": [],
            "decisions": [],
            "actions": []
        }
        
        if not summary:
            return result
        
        lines = summary.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            if line.upper().startswith('KEY POINTS'):
                current_section = "topics"
            elif line.upper().startswith('DECISIONS'):
                current_section = "decisions"
            elif line.upper().startswith('ACTION ITEMS'):
                current_section = "actions"
            elif line.startswith('-') and current_section:
                item = line[1:].strip()
                if item:
                    result[current_section].append(item)
        
        return result

    def _extract_topics_from_summary(self, summary: str) -> List[str]:
        """Extract topic keywords from a summary."""
        if not summary:
            return []
        
        # Simple keyword extraction - in production, you might use more sophisticated NLP
        common_topics = [
            "work", "project", "health", "fitness", "food", "travel", "family",
            "technology", "programming", "learning", "goals", "plans", "ideas"
        ]
        
        summary_lower = summary.lower()
        found_topics = [topic for topic in common_topics if topic in summary_lower]
        
        return found_topics[:5]  # Limit to 5 topics


# Create global instance
intelligent_summarizer = IntelligentSummarizer()
