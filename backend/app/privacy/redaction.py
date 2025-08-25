from __future__ import annotations
from typing import Any, Dict, Tuple
import re
import json

from app.core.config import settings

_email_re = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
_phone_re = re.compile(r"\b(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4})\b")
_cc_re = re.compile(r"\b(?:\d[ -]*?){13,19}\b")
_ssn_re = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")

# Simple IBAN-like long alphanumeric strings (very conservative)
_iban_like_re = re.compile(r"\b[A-Z]{2}[0-9A-Z]{11,30}\b")

_REPLACEMENTS = {
    "email": (lambda: bool(getattr(settings, "PRIVACY_REDACT_EMAIL", True)), _email_re, "[REDACTED_EMAIL]"),
    "phone": (lambda: bool(getattr(settings, "PRIVACY_REDACT_PHONE", True)), _phone_re, "[REDACTED_PHONE]"),
    "credit_card": (lambda: bool(getattr(settings, "PRIVACY_REDACT_CREDIT_CARD", True)), _cc_re, "[REDACTED_CARD]"),
    "ssn": (lambda: bool(getattr(settings, "PRIVACY_REDACT_SSN", True)), _ssn_re, "[REDACTED_SSN]"),
    "iban": (lambda: bool(getattr(settings, "PRIVACY_REDACT_IBAN", True)), _iban_like_re, "[REDACTED_IBAN]"),
}


def _redact_string(s: str) -> Tuple[str, Dict[str, int]]:
    stats: Dict[str, int] = {}
    if not s:
        return s, stats
    out = s
    for key, (is_enabled, pattern, token) in _REPLACEMENTS.items():
        try:
            if not is_enabled():
                continue
            matches = list(pattern.finditer(out))
            if not matches:
                continue
            stats[key] = stats.get(key, 0) + len(matches)
            out = pattern.sub(token, out)
        except Exception:
            continue
    return out, stats


def redact_text(text: str) -> Tuple[str, Dict[str, Any]]:
    """Redact PII from free text. Returns (redacted_text, info).

    info contains per-type counts and a total count.
    Controlled by settings.PRIVACY_REDACTION_ENABLED.
    """
    if not getattr(settings, "PRIVACY_REDACTION_ENABLED", True):
        return text, {"enabled": False, "total": 0}
    red, stats = _redact_string(text or "")
    total = sum(stats.values())
    return red, {"enabled": True, "total": int(total), **stats}


def redact_metadata(meta: Dict[str, Any]) -> Dict[str, Any]:
    """Best-effort redaction on metadata values.
    - Traverses shallow dict and redacts string values
    - If nested dict/list present, redacts string leaves up to limited depth
    """
    if not isinstance(meta, dict):
        return meta
    if not getattr(settings, "PRIVACY_REDACTION_ENABLED", True):
        return meta

    def _walk(v: Any, depth: int = 0) -> Any:
        if depth > 2:
            return v
        if isinstance(v, str):
            red, _ = _redact_string(v)
            return red
        if isinstance(v, dict):
            return {k: _walk(val, depth + 1) for k, val in v.items()}
        if isinstance(v, list):
            return [_walk(it, depth + 1) for it in v]
        return v

    try:
        return {k: _walk(v, 0) for k, v in meta.items()}
    except Exception:
        return meta
