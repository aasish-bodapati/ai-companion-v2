"""
Action Detection Service for AI Companion Chat
Automatically detects when users want to perform actions and executes them seamlessly.
"""

import re
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from app.actions.router import router as action_router
from app.actions.registry import ExecuteActionRequest
from app.api.deps import get_db
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class ActionDetector:
    """Detects action intents in user messages and executes them."""
    
    def __init__(self):
        self.action_patterns = self._build_action_patterns()
    
    def _build_action_patterns(self) -> Dict[str, List[Dict[str, Any]]]:
        """Build patterns for detecting different action types."""
        return {
            "fitness": [
                {
                    "patterns": [
                        r"log\s+(?:my\s+)?workout",
                        r"record\s+(?:my\s+)?workout",
                        r"add\s+(?:my\s+)?workout",
                        r"track\s+(?:my\s+)?workout",
                        r"save\s+(?:my\s+)?workout",
                        r"i\s+(?:just\s+)?worked\s+out",
                        r"i\s+(?:just\s+)?finished\s+(?:my\s+)?workout",
                        r"workout\s+complete",
                        r"workout\s+done",
                        r"i\s+(?:just\s+)?did\s+(?:a\s+)?(?:workout|exercise|training)",
                        r"i\s+(?:just\s+)?completed\s+(?:a\s+)?(?:workout|exercise|training)",
                        r"i\s+(?:just\s+)?finished\s+(?:a\s+)?(?:workout|exercise|training)",
                        r"i\s+(?:just\s+)?ran\s+(?:for\s+)?\d+\s+minutes?",
                        r"i\s+(?:just\s+)?did\s+\d+\s+sets?\s+of",
                        r"i\s+(?:just\s+)?did\s+(?:yoga|cardio|strength\s+training)",
                        r"i\s+(?:just\s+)?worked\s+out\s+for\s+\d+\s+minutes?",
                        r"i\s+did\s+\d+\s+minutes?\s+of\s+(?:cardio|strength|training)",
                        r"i\s+did\s+\d+\s+sets?\s+of\s+(?:push-ups|squats|deadlifts)",
                        r"i\s+completed\s+\d+\s+minutes?\s+of\s+(?:workout|exercise)",
                        r"i\s+finished\s+\d+\s+minutes?\s+of\s+(?:workout|exercise)",
                        r"i\s+completed\s+\d+\s+minutes?\s+of\s+(?:workout|exercise)",
                        r"i\s+just\s+completed\s+\d+\s+minutes?\s+of\s+(?:workout|exercise)",
                        r"i\s+just\s+finished\s+\d+\s+minutes?\s+of\s+(?:workout|exercise)",
                        r"i\s+just\s+completed\s+a\s+\d+\s+minute\s+(?:workout|exercise)",
                        r"i\s+just\s+finished\s+a\s+\d+\s+minute\s+(?:workout|exercise)",
                        r"i\s+just\s+completed\s+a\s+\d+\s+minute\s+(?:workout|exercise)",
                        r"i\s+just\s+completed\s+a\s+\d+\s+minute\s+(?:hiit|workout|exercise)",
                        r"i\s+just\s+finished\s+a\s+\d+\s+minute\s+(?:hiit|workout|exercise)",
                        r"i\s+just\s+completed\s+a\s+\d+\s+minute\s+(?:hiit|workout|exercise)",
                        r"i\s+just\s+completed\s+\d+\s+minutes?\s+of\s+(?:hiit|workout|exercise)",
                        r"i\s+just\s+finished\s+\d+\s+minutes?\s+of\s+(?:hiit|workout|exercise)",
                        r"i\s+just\s+completed\s+\d+\s+minutes?\s+of\s+(?:hiit|workout|exercise)",
                        r"i.*completed.*\d+\s+minute.*(?:hiit|workout|exercise)",
                        r"i.*finished.*\d+\s+minute.*(?:hiit|workout|exercise)",
                        r"i.*completed.*\d+\s+minute.*hiit.*workout",
                        r"i.*finished.*\d+\s+minute.*hiit.*workout",
                        r"i.*completed.*\d+\s+minute.*hiit.*workout.*with.*rounds",
                        r"i.*finished.*\d+\s+minute.*hiit.*workout.*with.*rounds",
                        r"i.*completed.*\d+\s+minute.*hiit.*workout",
                        r"i.*finished.*\d+\s+minute.*hiit.*workout",
                        r"i.*completed.*\d+\s+minute.*workout.*with.*rounds",
                        r"i.*finished.*\d+\s+minute.*workout.*with.*rounds",
                        r"i.*completed.*\d+\s+minute.*workout",
                        r"i.*finished.*\d+\s+minute.*workout",
                        r"i.*completed.*\d+.*minute.*workout",
                        r"i.*finished.*\d+.*minute.*workout",
                        r"i.*completed.*\d+\s+minute.*exercise",
                        r"i.*finished.*\d+\s+minute.*exercise",
                        r"next\s+week\s+i\s+['']?ll\s+do\s+(?:the\s+same\s+)?routine",
                        r"next\s+week\s+i\s+['']?ll\s+do\s+(?:the\s+same\s+)?workout",
                        r"next\s+week\s+i\s+['']?ll\s+increase\s+([^.]+)",
                        r"next\s+week\s+i\s+['']?ll\s+do\s+([^.]+)",
                        r"next\s+week\s+i\s+['']?ll\s+do\s+(?:the\s+same\s+)?routine\s+but\s+increase",
                        r"next\s+week\s+i\s+['']?ll\s+do\s+(?:the\s+same\s+)?workout\s+but\s+increase",
                        r"i\s+['']?m\s+running\s+late\s+today\s+so\s+i\s+['']?ll\s+do\s+a\s+shorter\s+(\d+)-minute\s+workout",
                        r"i\s+['']?ll\s+do\s+a\s+shorter\s+(\d+)-minute\s+workout",
                        r"shorter\s+(\d+)-minute\s+workout"
                    ],
                    "action": "fitness.log_workout",
                    "confidence": 0.9,
                    "requires_params": True
                },
                {
                    "patterns": [
                        r"create\s+(?:a\s+)?(?:fitness\s+)?goal",
                        r"set\s+(?:a\s+)?(?:fitness\s+)?goal",
                        r"add\s+(?:a\s+)?(?:fitness\s+)?goal",
                        r"i\s+want\s+to\s+(?:get\s+)?(?:stronger|fitter|faster|more\s+flexible)",
                        r"my\s+goal\s+is\s+to\s+(?:get\s+)?(?:stronger|fitter|faster|more\s+flexible)"
                    ],
                    "action": "fitness.create_goal",
                    "confidence": 0.8,
                    "requires_params": True
                }
            ],
            "nutrition": [
                {
                    "patterns": [
                        r"log\s+(?:my\s+)?meal",
                        r"record\s+(?:my\s+)?meal",
                        r"add\s+(?:my\s+)?meal",
                        r"track\s+(?:my\s+)?meal",
                        r"i\s+(?:just\s+)?ate",
                        r"i\s+(?:just\s+)?had\s+(?:breakfast|lunch|dinner|snack)",
                        r"meal\s+complete",
                        r"meal\s+done",
                        r"i\s+(?:just\s+)?ate\s+(?:a\s+)?(?:protein\s+shake|oatmeal|salad|chicken|salmon)",
                        r"i\s+(?:just\s+)?had\s+(?:a\s+)?(?:protein\s+shake|oatmeal|salad|chicken|salmon)",
                        r"i\s+(?:just\s+)?finished\s+(?:breakfast|lunch|dinner|snack)",
                        r"i\s+(?:just\s+)?completed\s+(?:breakfast|lunch|dinner|snack)",
                        r"breakfast\s+(?:was|is)\s+(?:oatmeal|protein|eggs)",
                        r"lunch\s+(?:was|is)\s+(?:salad|chicken|sandwich)",
                        r"dinner\s+(?:was|is)\s+(?:salmon|steak|pasta)",
                        r"i\s+ate\s+(?:a\s+)?(?:protein\s+shake|oatmeal|salad|chicken|salmon)",
                        r"i\s+had\s+(?:a\s+)?(?:protein\s+shake|oatmeal|salad|chicken|salmon)",
                        r"i\s+finished\s+(?:breakfast|lunch|dinner|snack)",
                        r"i\s+completed\s+(?:breakfast|lunch|dinner|snack)",
                        r"now\s+i\s+['']?m\s+having\s+(?:breakfast|lunch|dinner|snack)",
                        r"i\s+['']?m\s+having\s+(?:breakfast|lunch|dinner|snack)",
                        r"i\s+['']?m\s+eating\s+(?:breakfast|lunch|dinner|snack)",
                        r"i\s+['']?m\s+having\s+(?:breakfast|lunch|dinner|snack)\s*-\s*",
                        r"i\s+['']?m\s+eating\s+(?:breakfast|lunch|dinner|snack)\s*-\s*",
                        r"now\s+i\s+['']?m\s+having",
                        r"i\s+['']?m\s+having",
                        r"i\s+['']?m\s+eating",
                        r"i\s+['\u2019]?m\s+having",
                        r"i\s+['\u2019]?m\s+eating",
                        r"i\s+['\u2019]?m\s+having\s+(?:breakfast|lunch|dinner|snack)",
                        r"i\s+['\u2019]?m\s+eating\s+(?:breakfast|lunch|dinner|snack)",
                        r"i\s+['\u0027]?m\s+having\s+(?:breakfast|lunch|dinner|snack)",
                        r"i\s+['\u0027]?m\s+eating\s+(?:breakfast|lunch|dinner|snack)",
                        r"i\s+['\u0027]?m\s+having",
                        r"i\s+['\u0027]?m\s+eating",
                        r"i\s+['\x27]?m\s+having\s+(?:breakfast|lunch|dinner|snack)",
                        r"i\s+['\x27]?m\s+eating\s+(?:breakfast|lunch|dinner|snack)",
                        r"i\s+['\x27]?m\s+having",
                        r"i\s+['\x27]?m\s+eating",
                        r"i.*m.*having\s+(?:breakfast|lunch|dinner|snack)",
                        r"i.*m.*eating\s+(?:breakfast|lunch|dinner|snack)",
                        r"i.*m.*having",
                        r"i.*m.*eating",
                        r"i\s+skipped\s+(?:my\s+)?(?:afternoon\s+)?(?:snack|meal)",
                        r"can\s+you\s+update\s+my\s+nutrition\s+log",
                        r"update\s+my\s+nutrition\s+log",
                        r"(?:breakfast|lunch|dinner|snack)\s+(?:was|is)\s+([^.]+)",
                        r"for\s+(?:breakfast|lunch|dinner|snack)\s+i\s+had\s+([^.]+)",
                        r"(?:breakfast|lunch|dinner|snack)\s+(?:was|is)\s+([^.]+)"
                    ],
                    "action": "nutrition.log_meal",
                    "confidence": 0.9,
                    "requires_params": True
                },
                {
                    "patterns": [
                        r"set\s+(?:my\s+)?nutrition\s+plan",
                        r"update\s+(?:my\s+)?nutrition\s+plan",
                        r"change\s+(?:my\s+)?nutrition\s+plan",
                        r"my\s+nutrition\s+goals\s+are"
                    ],
                    "action": "nutrition.set_current_plan",
                    "confidence": 0.8,
                    "requires_params": True
                }
            ],
            "calendar": [
                {
                    "patterns": [
                        r"add\s+(?:to\s+)?(?:my\s+)?calendar",
                        r"schedule\s+(?:in\s+)?(?:my\s+)?calendar",
                        r"put\s+(?:in\s+)?(?:my\s+)?calendar",
                        r"remind\s+me\s+(?:to\s+)?(?:about\s+)?",
                        r"set\s+a\s+reminder",
                        r"add\s+reminder",
                        r"remind\s+me\s+about",
                        r"can\s+you\s+add\s+(?:to\s+)?(?:my\s+)?calendar",
                        r"can\s+you\s+schedule",
                        r"can\s+you\s+add\s+(?:my\s+)?(?:workout\s+time|breakfast\s+time|routine)\s+to\s+(?:my\s+)?calendar",
                        r"can\s+you\s+add\s+(?:my\s+)?(?:workout|breakfast|routine)\s+time\s+to\s+(?:my\s+)?calendar",
                        r"i\s+have\s+(?:a\s+)?(?:meeting|appointment|call)\s+(?:tomorrow|on\s+\w+)",
                        r"add\s+(?:my\s+)?(?:gym\s+session|workout|appointment)\s+to\s+(?:my\s+)?calendar",
                        r"add\s+something\s+to\s+(?:my\s+)?calendar",
                        r"add\s+.*\s+to\s+(?:my\s+)?calendar",
                        r"add\s+(?:my\s+)?(?:workout\s+time|breakfast\s+time|routine)\s+to\s+(?:my\s+)?calendar",
                        r"can\s+you\s+add\s+(?:my\s+)?(?:workout|breakfast|routine)\s+time\s+to\s+(?:my\s+)?calendar",
                        r"schedule\s+(?:a\s+)?(?:doctor\s+)?appointment",
                        r"schedule\s+(?:a\s+)?(?:team\s+)?meeting",
                        r"schedule\s+(?:a\s+)?call",
                        r"schedule\s+(?:my\s+)?(?:breakfast|workout|gym\s+session|meal\s+prep)",
                        r"put\s+(?:my\s+)?(?:workout|breakfast|lunch\s+break|dentist\s+appointment)\s+in\s+(?:my\s+)?calendar",
                        r"put\s+(?:my\s+)?(?:workout|breakfast|lunch\s+break|dentist\s+appointment)\s+to\s+(?:my\s+)?calendar",
                        r"can\s+you\s+schedule",
                        r"can\s+you\s+book",
                        r"throw\s+(?:this\s+)?in\s+(?:my\s+)?calendar",
                        r"i\s+need\s+(?:this\s+)?on\s+my\s+schedule",
                        r"book\s+me\s+for",
                        r"pencil\s+(?:this\s+)?in",
                        r"add\s+(?:this\s+)?to\s+my\s+agenda",
                        r"put\s+(?:this\s+)?on\s+my\s+plate",
                        r"add\s+a\s+reminder\s+to\s+([^.]+)",
                        r"schedule\s+(?:my\s+)?(?:progress\s+)?review",
                        r"schedule\s+(?:my\s+)?(?:meal\s+prep|lunch\s+break|evening\s+walk)",
                        r"schedule\s+(?:my\s+)?(?:dentist|doctor)\s+appointment",
                        r"schedule\s+(?:my\s+)?(?:lunch\s+break|breakfast|dinner)",
                        r"schedule\s+(?:my\s+)?(?:workout|gym\s+session|training)\s+in\s+(?:my\s+)?calendar",
                        r"add\s+(?:my\s+)?(?:workout|breakfast|lunch\s+break|gym\s+session)\s+to\s+(?:my\s+)?calendar\s+(?:every|daily|weekly|on\s+weekdays)",
                        r"schedule\s+(?:my\s+)?(?:workout|breakfast|lunch\s+break|gym\s+session)\s+(?:every|daily|weekly|on\s+weekdays)",
                        r"put\s+(?:my\s+)?(?:workout|breakfast|lunch\s+break|gym\s+session)\s+in\s+(?:my\s+)?calendar\s+(?:every|daily|weekly|on\s+weekdays)",
                        r"schedule\s+(?:my\s+)?(?:progress\s+)?review\s+(?:every|daily|weekly|monthly)",
                        r"add\s+(?:my\s+)?(?:progress\s+)?review\s+to\s+(?:my\s+)?calendar\s+(?:every|daily|weekly|monthly)",
                        r"schedule\s+(?:my\s+)?(?:meal\s+prep|meal\s+planning)\s+(?:every|daily|weekly|monthly)",
                        r"add\s+(?:my\s+)?(?:meal\s+prep|meal\s+planning)\s+to\s+(?:my\s+)?calendar\s+(?:every|daily|weekly|monthly)",
                        r"add\s+(?:my\s+)?workout\s+time\s+to\s+(?:my\s+)?calendar",
                        r"add\s+(?:my\s+)?workout\s+to\s+(?:my\s+)?calendar\s+at\s+\d+:\d+\s+(?:am|pm)?",
                        r"add\s+(?:my\s+)?workout\s+to\s+(?:my\s+)?calendar\s+(?:every|daily|weekly|on\s+weekdays)",
                        r"schedule\s+(?:my\s+)?workout\s+in\s+(?:my\s+)?calendar",
                        r"schedule\s+(?:my\s+)?workout\s+to\s+(?:my\s+)?calendar",
                        r"put\s+(?:my\s+)?workout\s+in\s+(?:my\s+)?calendar",
                        r"put\s+(?:my\s+)?workout\s+to\s+(?:my\s+)?calendar",
                        r"can\s+you\s+add\s+(?:my\s+)?workout\s+(?:time\s+)?to\s+(?:my\s+)?calendar",
                        r"add\s+(?:my\s+)?breakfast\s+time\s+to\s+(?:my\s+)?calendar",
                        r"add\s+(?:my\s+)?breakfast\s+to\s+(?:my\s+)?calendar\s+at\s+\d+:\d+\s+(?:am|pm)?",
                        r"add\s+(?:my\s+)?breakfast\s+to\s+(?:my\s+)?calendar\s+(?:every|daily|weekly)",
                        r"schedule\s+(?:my\s+)?breakfast\s+in\s+(?:my\s+)?calendar",
                        r"schedule\s+(?:my\s+)?breakfast\s+to\s+(?:my\s+)?calendar",
                        r"put\s+(?:my\s+)?breakfast\s+in\s+(?:my\s+)?calendar",
                        r"put\s+(?:my\s+)?breakfast\s+to\s+(?:my\s+)?calendar",
                        r"can\s+you\s+add\s+(?:my\s+)?breakfast\s+(?:time\s+)?to\s+(?:my\s+)?calendar",
                        r"can\s+you\s+schedule\s+(?:my\s+)?breakfast\s+in\s+(?:my\s+)?calendar",
                        r"add\s+(?:my\s+)?progress\s+check\s+to\s+(?:my\s+)?calendar",
                        r"add\s+(?:my\s+)?progress\s+check\s+in\s+(?:my\s+)?calendar",
                        r"put\s+(?:my\s+)?progress\s+check\s+in\s+(?:my\s+)?calendar",
                        r"put\s+(?:my\s+)?progress\s+check\s+to\s+(?:my\s+)?calendar",
                        r"can\s+you\s+schedule\s+(?:my\s+)?workout\s+in\s+(?:my\s+)?calendar",
                        r"schedule\s+(?:a\s+)?(?:call|meeting|appointment)\s+for\s+(?:tomorrow|next\s+\w+|at\s+\d+:\d+)",
                        r"i\s+have\s+(?:a\s+)?(?:meeting|appointment|call)\s+(?:tomorrow|on\s+\w+|at\s+\d+:\d+)",
                        r"i\s+have\s+(?:a\s+)?(?:meeting|appointment|call)",
                        r"i\s+have\s+(?:a\s+)?doctor\s+appointment",
                        r"i\s+have\s+(?:a\s+)?dentist\s+appointment",
                        r"schedule\s+(?:my\s+)?(?:workout|breakfast|lunch\s+break|gym\s+session)\s+for\s+(?:tomorrow|next\s+\w+|at\s+\d+:\d+)",
                        r"add\s+(?:my\s+)?(?:workout|breakfast|lunch\s+break|gym\s+session)\s+to\s+(?:my\s+)?calendar\s+for\s+(?:tomorrow|next\s+\w+|at\s+\d+:\d+)",
                        r"put\s+(?:my\s+)?(?:workout|breakfast|lunch\s+break|gym\s+session)\s+in\s+(?:my\s+)?calendar\s+for\s+(?:tomorrow|next\s+\w+|at\s+\d+:\d+)",
                        r"schedule\s+(?:my\s+)?(?:workout|breakfast|lunch\s+break|gym\s+session)\s+at\s+\d+:\d+\s+(?:am|pm)?",
                        r"add\s+(?:my\s+)?(?:workout|breakfast|lunch\s+break|gym\s+session)\s+to\s+(?:my\s+)?calendar\s+at\s+\d+:\d+\s+(?:am|pm)?",
                        r"i\s+have\s+a\s+busy\s+week\s+coming\s+up.*add.*to\s+(?:my\s+)?calendar",
                        r"can\s+you\s+add.*to\s+(?:my\s+)?calendar",
                        r"i\s+want\s+to\s+track.*better.*add.*to\s+(?:my\s+)?calendar",
                        r"i\s+['']?m\s+going\s+on\s+vacation.*add.*to\s+(?:my\s+)?calendar",
                        r"please\s+add.*to\s+(?:my\s+)?calendar",
                        r"i\s+need.*added\s+to\s+(?:my\s+)?calendar",
                        r"add.*to\s+(?:my\s+)?calendar.*(?:every|daily|weekly|monthly)",
                        r"schedule.*to\s+(?:my\s+)?calendar.*(?:every|daily|weekly|monthly)",
                        r"workout.*calendar",
                        r"calendar.*workout",
                        r"add.*workout.*calendar",
                        r"schedule.*workout.*calendar",
                        r"put.*workout.*calendar",
                        r"workout.*to.*calendar",
                        r"workout.*in.*calendar",
                        r"workout.*for.*calendar",
                        r"breakfast.*calendar",
                        r"calendar.*breakfast",
                        r"add.*breakfast.*calendar",
                        r"schedule.*breakfast.*calendar",
                        r"progress.*check.*calendar",
                        r"calendar.*progress.*check",
                        r"workout\s+time\s+to\s+calendar",
                        r"workout\s+to\s+calendar\s+at\s+\d+:\d+",
                        r"workout\s+to\s+calendar\s+every",
                        r"workout\s+to\s+calendar\s+daily",
                        r"workout\s+to\s+calendar\s+weekly",
                        r"workout\s+to\s+calendar\s+on\s+weekdays",
                        r"breakfast\s+time\s+at\s+\d+:\d+\s+daily",
                        r"breakfast\s+time\s+to\s+calendar",
                        r"breakfast\s+to\s+calendar\s+at\s+\d+:\d+",
                        r"breakfast\s+to\s+calendar\s+daily",
                        r"breakfast\s+to\s+calendar\s+weekly",
                        r"breakfast\s+time\s+at\s+\d+:\d+\s+daily",
                        r"breakfast\s+time\s+to\s+calendar",
                        r"breakfast\s+to\s+calendar\s+at\s+\d+:\d+",
                        r"breakfast\s+to\s+calendar\s+daily",
                        r"breakfast\s+to\s+calendar\s+weekly",
                        r"breakfast\s+time\s+8:00\s+AM\s+daily",
                        r"breakfast\s+time\s+at\s+8:00\s+AM\s+daily",
                        r"breakfast\s+time\s+8\s+AM\s+daily",
                        r"breakfast\s+time\s+at\s+8\s+AM\s+daily",
                        r"breakfast\s+time.*daily",
                        r"breakfast.*daily",
                        r"breakfast\s+time.*calendar",
                        r"breakfast.*calendar",
                        r"progress\s+check\s+in\s+calendar\s+every",
                        r"progress\s+check\s+to\s+calendar\s+every"
                    ],
                    "action": "calendar.create_event",
                    "confidence": 0.9,
                    "requires_params": True
                }
            ],
            "goals": [
                {
                    "patterns": [
                        r"create\s+(?:a\s+)?goal",
                        r"set\s+(?:a\s+)?goal",
                        r"add\s+(?:a\s+)?goal",
                        r"my\s+goal\s+is",
                        r"i\s+want\s+to\s+(?:get|become|achieve|improve|build|develop)",
                        r"i\s+want\s+to\s+(?:eat|drink|consume|have|make|prepare)",
                        r"i\s+aim\s+to",
                        r"can\s+you\s+create\s+(?:a\s+)?(?:weekly|monthly)?\s+progress\s+report",
                        r"can\s+you\s+track\s+my\s+progress",
                        r"track\s+my\s+progress",
                        r"create\s+(?:a\s+)?progress\s+report"
                    ],
                    "action": "coaching.create_goal",
                    "confidence": 0.8,
                    "requires_params": True
                }
            ],
            "journal": [
                {
                    "patterns": [
                        r"log\s+(?:in\s+)?(?:my\s+)?journal",
                        r"add\s+(?:to\s+)?(?:my\s+)?journal",
                        r"write\s+(?:in\s+)?(?:my\s+)?journal",
                        r"journal\s+entry",
                        r"i\s+want\s+to\s+remember",
                        r"i\s+want\s+to\s+remember\s+([^.]+)",
                        r"i\s+want\s+to\s+remember\s+that\s+([^.]+)",
                        r"i\s+want\s+to\s+remember\s+([^.]+)\s+this\s+week",
                        r"i\s+want\s+to\s+remember\s+([^.]+)\s+this\s+month",
                        r"i\s+felt\s+([^.]+)\s+after\s+(?:my\s+)?workout",
                        r"i'm\s+feeling\s+\w+",
                        r"i\s+feel\s+\w+",
                        r"feeling\s+\w+",
                        r"emotion",
                        r"mood",
                        r"reflection",
                        r"thoughts",
                        r"today\s+i",
                        r"motivated",
                        r"inspired",
                        r"grateful",
                        r"excited",
                        r"proud"
                    ],
                    "action": "journal.add_entry",
                    "confidence": 0.9,
                    "requires_params": True
                }
            ]
        }
    
    def detect_action_intent(self, user_message: str, context: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
        """Detect if user message contains an action intent."""
        if not user_message:
            return None
        
        user_message_lower = user_message.lower().strip()
        
        # Check for calendar-specific keywords first (priority override)
        calendar_keywords = ["calendar", "schedule", "remind", "appointment", "meeting", "agenda"]
        has_calendar_keywords = any(keyword in user_message_lower for keyword in calendar_keywords)
        
        # Check each action category
        for category, patterns in self.action_patterns.items():
            for pattern_info in patterns:
                for pattern in pattern_info["patterns"]:
                    if re.search(pattern, user_message_lower, re.IGNORECASE):
                        # If this is a calendar action and we have calendar keywords, prioritize it
                        if has_calendar_keywords and pattern_info["action"] == "calendar.create_event":
                            return {
                                "category": category,
                                "action": pattern_info["action"],
                                "confidence": pattern_info["confidence"],
                                "requires_params": pattern_info["requires_params"],
                                "raw_message": user_message,
                                "detected_pattern": pattern
                            }
                        # If this is a fitness action but we have calendar keywords, skip it
                        elif has_calendar_keywords and pattern_info["action"] == "fitness.log_workout":
                            continue
                        # Otherwise, return the first match
                        else:
                            return {
                                "category": category,
                                "action": pattern_info["action"],
                                "confidence": pattern_info["confidence"],
                                "requires_params": pattern_info["requires_params"],
                                "raw_message": user_message,
                                "detected_pattern": pattern
                            }
        
        return None
    
    def extract_action_params(self, user_message: str, action_info: Dict[str, Any]) -> Dict[str, Any]:
        """Extract parameters for the detected action from user message."""
        params = {}
        # message_lower = user_message.lower()
        
        if action_info["action"] == "fitness.log_workout":
            # Extract workout details
            params = self._extract_workout_params(user_message)
        elif action_info["action"] == "nutrition.log_meal":
            # Extract meal details
            params = self._extract_meal_params(user_message)
        elif action_info["action"] == "calendar.create_event":
            # Extract calendar event details
            params = self._extract_calendar_params(user_message)
        elif action_info["action"] == "coaching.create_goal":
            # Extract goal details
            params = self._extract_goal_params(user_message)
        elif action_info["action"] == "journal.add_entry":
            # Extract journal entry details
            params = self._extract_journal_params(user_message)
        
        return params
    
    def _extract_workout_params(self, message: str) -> Dict[str, Any]:
        """Extract workout parameters from user message."""
        params = {
            "exercises": [],
            "when": datetime.now(timezone.utc).isoformat(),
            "idempotency_key": f"workout_{datetime.now().timestamp()}"
        }
        
        # Extract exercises (simple pattern matching)
        exercise_patterns = [
            r"(\d+)\s*(?:sets?|reps?)\s*(?:of\s+)?([^,]+)",
            r"([^,]+)\s*(\d+)\s*(?:sets?|reps?)",
            r"([^,]+)\s*(\d+)\s*(?:kg|pounds?|lbs?)",
        ]
        
        for pattern in exercise_patterns:
            matches = re.finditer(pattern, message, re.IGNORECASE)
            for match in matches:
                exercise_name = match.group(2) if "sets" in pattern else match.group(1)
                exercise_name = exercise_name.strip()
                
                if exercise_name and len(exercise_name) > 2:
                    exercise = {"name": exercise_name}
                    
                    # Try to extract sets/reps
                    if "sets" in pattern:
                        exercise["sets"] = int(match.group(1))
                        exercise["reps"] = 10  # Default reps
                    elif "reps" in pattern:
                        exercise["reps"] = int(match.group(2))
                        exercise["sets"] = 3  # Default sets
                    
                    params["exercises"].append(exercise)
        
        # Extract duration if mentioned
        duration_match = re.search(r"(\d+)\s*(?:min|minutes?)", message, re.IGNORECASE)
        if duration_match:
            params["duration_min"] = int(duration_match.group(1))
        
        # Extract workout name
        workout_name_match = re.search(r"(?:my\s+)?(?:workout|training|exercise)\s+(?:was\s+)?([^,]+)", message, re.IGNORECASE)
        if workout_name_match:
            params["workout_name"] = workout_name_match.group(1).strip()
        
        return params
    
    def _extract_meal_params(self, message: str) -> Dict[str, Any]:
        """Extract meal parameters from user message."""
        params = {
            "when": datetime.now(timezone.utc).isoformat(),
            "items": [],
            "idempotency_key": f"meal_{datetime.now().timestamp()}"
        }
        
        # Extract food items
        food_patterns = [
            r"i\s+(?:just\s+)?ate\s+([^.]+)",
            r"i\s+(?:just\s+)?had\s+([^.]+)",
            r"meal\s+was\s+([^.]+)",
            r"food\s+was\s+([^.]+)"
        ]
        
        for pattern in food_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                food_text = match.group(1).strip()
                # Split by common separators
                items = re.split(r"[,;]|\sand\s", food_text)
                params["items"] = [item.strip() for item in items if item.strip()]
                break
        
        # Extract calories if mentioned
        calorie_match = re.search(r"(\d+)\s*(?:cal|calories?)", message, re.IGNORECASE)
        if calorie_match:
            params["est_kcal"] = int(calorie_match.group(1))
        
        # Extract protein if mentioned
        protein_match = re.search(r"(\d+)\s*(?:g|grams?)\s*(?:of\s+)?protein", message, re.IGNORECASE)
        if protein_match:
            params["est_protein_g"] = int(protein_match.group(1))
        
        return params
    
    def _extract_calendar_params(self, message: str) -> Dict[str, Any]:
        """Extract calendar event parameters from user message."""
        params = {
            "title": "",
            "start": datetime.now(timezone.utc).isoformat(),
            "idempotency_key": f"calendar_{datetime.now().timestamp()}"
        }
        
        # Extract event title
        title_patterns = [
            r"remind\s+me\s+(?:to\s+)?(?:about\s+)?([^.]+)",
            r"add\s+(?:to\s+)?(?:my\s+)?calendar\s+([^.]+)",
            r"schedule\s+(?:in\s+)?(?:my\s+)?calendar\s+([^.]+)"
        ]
        
        for pattern in title_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                params["title"] = match.group(1).strip()
                break
        
        # Extract recurring patterns
        recurring_patterns = [
            r"(every|daily|weekly|monthly)",
            r"(?:every\s+)?(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)",
            r"(?:on\s+)?weekdays",
            r"(?:on\s+)?weekends"
        ]
        
        for pattern in recurring_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                params["recurring"] = match.group(1).strip()
                break
        
        # Extract time if mentioned
        time_patterns = [
            r"(\d{1,2}):(\d{2})\s*(am|pm)?",
            r"(\d{1,2})\s*(am|pm)",
            r"tomorrow\s+at\s+(\d{1,2}):(\d{2})",
            r"next\s+week\s+at\s+(\d{1,2}):(\d{2})",
            r"at\s+(\d{1,2}):(\d{2})\s*(am|pm)?",
            r"(\d{1,2}):(\d{2})\s*(am|pm)?\s*(?:daily|weekly|every\s+day)"
        ]
        
        for pattern in time_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                # Basic time extraction - could be enhanced with date parsing
                params["start"] = datetime.now(timezone.utc).isoformat()
                break
        
        # Extract duration if mentioned
        duration_match = re.search(r"(\d+)\s*(?:min|minutes?)", message, re.IGNORECASE)
        if duration_match:
            params["duration_min"] = int(duration_match.group(1))
        
        # Extract time range if mentioned
        time_range_match = re.search(r"from\s+(\d{1,2}):(\d{2})\s*(?:am|pm)?\s*to\s+(\d{1,2}):(\d{2})\s*(?:am|pm)?", message, re.IGNORECASE)
        if time_range_match:
            params["start"] = datetime.now(timezone.utc).isoformat()
            params["end"] = datetime.now(timezone.utc).isoformat()
        
        # Extract specific days
        day_patterns = [
            r"(?:next\s+)?(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)",
            r"(?:next\s+)?(?:week|month)",
            r"tomorrow",
            r"today"
        ]
        
        for pattern in day_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                params["day"] = match.group(0).strip()
                break
        
        return params
    
    def _extract_goal_params(self, message: str) -> Dict[str, Any]:
        """Extract goal parameters from user message."""
        params = {
            "name": "",
            "category": "other",
            "idempotency_key": f"goal_{datetime.now().timestamp()}"
        }
        
        # Extract goal name
        goal_patterns = [
            r"my\s+goal\s+is\s+(?:to\s+)?([^.]+)",
            r"i\s+want\s+to\s+([^.]+)",
            r"i\s+aim\s+to\s+([^.]+)",
            r"create\s+(?:a\s+)?goal\s+(?:to\s+)?([^.]+)"
        ]
        
        for pattern in goal_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                params["name"] = match.group(1).strip()
                break
        
        # Determine category based on content
        if any(word in message.lower() for word in ["workout", "exercise", "fitness", "strength", "cardio"]):
            params["category"] = "fitness"
        elif any(word in message.lower() for word in ["eat", "nutrition", "diet", "food", "meal"]):
            params["category"] = "nutrition"
        elif any(word in message.lower() for word in ["mood", "happiness", "mental", "emotional"]):
            params["category"] = "mood"
        
        return params
    
    def _extract_journal_params(self, message: str) -> Dict[str, Any]:
        """Extract journal entry parameters from user message."""
        params = {
            "content": "",
            "idempotency_key": f"journal_{datetime.now().timestamp()}"
        }
        
        # Extract journal content
        journal_patterns = [
            r"i\s+want\s+to\s+remember\s+([^.]+)",
            r"log\s+(?:in\s+)?(?:my\s+)?journal\s+([^.]+)",
            r"add\s+(?:to\s+)?(?:my\s+)?journal\s+([^.]+)"
        ]
        
        for pattern in journal_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                params["content"] = match.group(1).strip()
                break
        
        # If no specific pattern, use the whole message as content
        if not params["content"]:
            params["content"] = message.strip()
        
        return params
    
    def execute_action(self, action_name: str, params: Dict[str, Any], user_id: str, conversation_id: str = None, db: Session = None) -> Dict[str, Any]:
        """Execute the detected action."""
        try:
            # Get database session if not provided
            if db is None:
                db = next(get_db())
            
            # Use executors directly for better control
            from app.actions.executors import action_executors
            
            if action_name == "fitness.log_workout":
                result = action_executors.execute_fitness_log_workout(db, user_id, params)
            elif action_name == "nutrition.log_meal":
                result = action_executors.execute_nutrition_log_meal(db, user_id, params)
            elif action_name == "calendar.create_event":
                result = action_executors.execute_calendar_create_event(db, user_id, params)
            elif action_name == "coaching.create_goal":
                result = action_executors.execute_coaching_create_goal(db, user_id, params)
            elif action_name == "journal.add_entry":
                result = action_executors.execute_journal_add_entry(db, user_id, params)
            else:
                # Fallback to router for other actions
                request = ExecuteActionRequest(
                    action=action_name,
                    params=params,
                    user_id=user_id,
                    conversation_id=conversation_id,
                    client_action_id=params.get("idempotency_key")
                )
                
                router_result = action_router.execute(request)
                
                if router_result.ok:
                    result = {
                        "success": True,
                        "result": router_result.result,
                        "message": f"Successfully executed {action_name}"
                    }
                else:
                    result = {
                        "success": False,
                        "error": router_result.error,
                        "message": f"Failed to execute {action_name}: {router_result.error}"
                    }
            
            # Add action name to result
            result["action"] = action_name
            return result
                
        except Exception as e:
            logger.error(f"Error executing action {action_name}: {str(e)}")
            return {
                "success": False,
                "action": action_name,
                "error": str(e),
                "message": f"Error executing {action_name}: {str(e)}"
            }


# Global instance
action_detector = ActionDetector()
