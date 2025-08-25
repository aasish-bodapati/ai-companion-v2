# Direct Command Execution Architecture

Source of truth for implementing chat-first direct command execution without agentic complexity.

## Vision Alignment
User wants a chat-first interface where they tell the assistant what to do and it executes immediately with minimal friction, like a human assistant. No autonomous planning or proactive features.

## Core Pattern
```
User Message → Intent Detection → Parameter Extraction → Immediate Execution → Auto-Memory → Response
```

## Execution Policy
- **Immediate execution** for logging actions (workouts, meals, journal entries)
- **No confirmation** for simple data entry commands
- **Auto-memory** save all relevant data silently
- **Simple success/error** responses with toasts

## Action Categories

### Immediate Execution (No Confirmation)
- `fitness.log_workout` - "I did 3 sets of bench press at 50kg"
- `nutrition.log_meal` - "Had eggs and toast for breakfast"
- `journal.add_entry` - "Feeling great today"
- `hydration.log_water` - "Drank 500ml water"
- `mood.log_checkin` - "Feeling energetic today"

### Simple Creation (No Confirmation)
- `fitness.create_goal` - "My goal is to deadlift 100kg by December"
- `routine.set_schedule` - "I want to workout Monday, Wednesday, Friday"

### Data Retrieval (Instant)
- `fitness.get_workouts` - "Show my recent workouts"
- `nutrition.get_meals` - "What did I eat yesterday?"
- `goals.get_progress` - "How am I doing on my deadlift goal?"

## Natural Language Processing
- Extract exercise names, weights, reps, sets from casual speech
- Parse meal descriptions into structured data
- Identify temporal references (today, yesterday, last week)
- Handle units (kg, lbs, ml, cups) automatically

## Memory Integration
- Auto-save all logged data to memory system
- No manual "Remember this" required
- Context-aware responses using memory
- Track progress and PRs automatically

## Response Format
```
✅ Logged bench press workout (3 sets, 50kg)
📈 New PR! Previous best was 45kg
```

## Error Handling
- Simple error messages in chat
- No complex error recovery flows
- Graceful degradation for parsing failures

## Implementation Priority
1. Backend Actions Registry with immediate execution
2. Frontend direct execution in ChatArea
3. Enhanced NL parsing for fitness/nutrition
4. Auto-memory integration
5. Simple data views
6. Remove agentic UI components

## Feature Flags
- `DIRECT_EXECUTION_ENABLED` - gate the new system
- `AGENT_PLAN_PROGRESS_ENABLED=false` - disable agentic features

## Security
- All actions require JWT authentication
- Validate user_id from token
- Standard error responses per `22_error_response_standard.md`
- No secrets in logs
