from __future__ import annotations
from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime, timedelta
import re
from dateutil import parser as dateparser


@dataclass
class ParsedEvent:
    title: str
    start: datetime
    end: Optional[datetime]
    description: Optional[str] = None
    all_day: bool = False


_ISO_RANGE = re.compile(
    r"^(?P<date>\d{4}-\d{2}-\d{2})\s+(?P<start>\d{1,2}:\d{2})\s*-\s*(?P<end>\d{1,2}:\d{2})\s+(?P<title>.+)$"
)


def parse_line(line: str, now: Optional[datetime] = None) -> Optional[ParsedEvent]:
    s = line.strip()
    if not s:
        return None

    # Case 1: ISO-like: 2025-08-13 09:00-10:00 Title
    m = _ISO_RANGE.match(s)
    if m:
        d = m.group("date")
        ts = f"{d} {m.group('start')}"
        te = f"{d} {m.group('end')}"
        start = dateparser.parse(ts)
        end = dateparser.parse(te)
        title = m.group("title").strip()
        return ParsedEvent(title=title, start=start, end=end)

    # Case 2: Free-form like: "Tue 3-4pm Call with Alice" or "Tomorrow 9:00-10:00 Standup"
    # Heuristic: split into datetime-ish prefix and title suffix
    parts = s.split(" ")
    if len(parts) >= 3:
        # Try growing datetime prefix
        for i in range(len(parts) - 1, 0, -1):
            dt_prefix = " ".join(parts[:i])
            title = " ".join(parts[i:])
            try:
                # Replace hyphen range with 'to' to help parser
                dt_prefix_norm = re.sub(r"(\d)\s*-\s*(\d)", r"\1 to \2", dt_prefix)

                # Normalize simple relative keywords to concrete dates
                # Example: "tomorrow 1pm" -> "2025-08-15 1pm"
                if now is None:
                    now = datetime.now()
                word_boundary = r"(?i)\b{}\b"
                if re.search(word_boundary.format("tomorrow"), dt_prefix_norm):
                    dt_prefix_norm = re.sub(
                        word_boundary.format("tomorrow"),
                        (now + timedelta(days=1)).strftime("%Y-%m-%d"),
                        dt_prefix_norm,
                    )
                if re.search(word_boundary.format("today"), dt_prefix_norm):
                    dt_prefix_norm = re.sub(
                        word_boundary.format("today"), now.strftime("%Y-%m-%d"), dt_prefix_norm
                    )

                dt = dateparser.parse(dt_prefix_norm, default=now)
                # If we detected a range like '3 to 4pm', synthesize end
                rng = re.search(
                    r"(?P<s>\d{1,2}(:\d{2})?)\s*to\s*(?P<e>\d{1,2}(:\d{2})?\s*(am|pm)?)",
                    dt_prefix_norm,
                    re.IGNORECASE,
                )
                end: Optional[datetime] = None
                if rng:
                    try:
                        end = dateparser.parse(rng.group("e"), default=dt)
                    except Exception:
                        end = None
                return ParsedEvent(title=title.strip(), start=dt, end=end)
            except Exception:
                continue

    # Case 3: All-day: "2025-08-13 All-day Offsite" or "Aug 13 Offsite"
    m2 = re.match(r"^(?P<date>.+?)\s+All-day\s+(?P<title>.+)$", s, re.IGNORECASE)
    if m2:
        start = dateparser.parse(m2.group("date"))
        return ParsedEvent(title=m2.group("title").strip(), start=start, end=None, all_day=True)

    return None


def parse_block(text: str) -> List[ParsedEvent]:
    events: List[ParsedEvent] = []
    now = datetime.now()
    for raw in text.splitlines():
        pe = parse_line(raw, now=now)
        if pe:
            events.append(pe)
    return events
