[pending] feature-fix-calendar-nl-001: Tighten calendar NL detection in 
backend/app/api/endpoints/conversations_calendar.py::_handle_calendar_nl()
 (sched verb+event/time or event+time; otherwise return None).
[pending] continuity-after-that-001: Add “after that” continuity heuristic in 
_handle_calendar_nl()
 using crud_calendar.get_user_events(...) to include the explicit time in reply.
[pending] fitness-preference-hook-001: Add post-processing in 
backend/app/api/endpoints/conversations_messages.py::reply_to_conversation()
 to prepend “We’ll avoid running and focus on alternatives.” when the user dislikes running but the reply suggests running.