from __future__ import annotations
from typing import Optional
from pydantic import ValidationError
from app.schemas.calendar_intent import CalendarIntent
from app.core.llm import generate_with_together

EXTRACTION_SYSTEM = (
    "You are a calendar intent extractor. Return ONLY compact JSON matching the schema. "
    "No prose."
)

EXTRACTION_USER_TMPL = (
    "Extract a calendar intent from the user's message and return JSON matching this schema.\n\n"
    "Schema (JSON):\n"
    "{\n"
    "  \"action\": \"create|delete|list\",\n"
    "  \"title\": string|null,\n"
    "  \"time\": HH:MM 24h|string|null,\n"
    "  \"duration_minutes\": number|null,\n"
    "  \"timezone_hint\": string|null,\n"
    "  \"window\": { \"mode\": \"next_week|next_7_days|date_range\", \"start_date\": YYYY-MM-DD|null, \"end_date\": YYYY-MM-DD|null }|null,\n"
    "  \"recurrence\": { \"type\": \"none|daily|weekdays\", \"count\": number|null }|null,\n"
    "  \"confidence\": number|null\n"
    "}\n\n"
    "User: \n{user_text}\n"
)


def extract_calendar_intent(user_text: str) -> Optional[CalendarIntent]:
    prompt = EXTRACTION_USER_TMPL.format(user_text=user_text)
    try:
        raw = generate_with_together(system=EXTRACTION_SYSTEM, user=prompt, max_tokens=256, temperature=0.2)
        # raw is expected to be JSON text or contain a JSON block; try to locate braces
        txt = raw.strip()
        start = txt.find("{")
        end = txt.rfind("}")
        if start != -1 and end != -1 and end > start:
            txt = txt[start : end + 1]
        return CalendarIntent.model_validate_json(txt)
    except ValidationError:
        return None
    except Exception:
        return None
