# HealthLog AI API Examples

## Overview

This document provides comprehensive examples for using the HealthLog AI API endpoints. All examples assume the API is running on `http://localhost:8000` and include proper authentication headers.

## Authentication

All API endpoints require authentication via JWT token. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

## Health Logging Endpoints

### Fitness Logging

#### Create a Fitness Log

```bash
curl -X POST "http://localhost:8000/api/v1/health/logging/fitness" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "activity_type": "weightlifting",
    "activity_name": "Chest and Triceps Day",
    "duration_minutes": 60,
    "intensity": "high",
    "calories_burned": 300,
    "weight_kg": 80,
    "reps": 10,
    "sets": 3,
    "notes": "Great workout, felt strong today",
    "location": "Home Gym"
  }'
```

**Response:**
```json
{
  "id": 123,
  "user_id": 456,
  "activity_type": "weightlifting",
  "activity_name": "Chest and Triceps Day",
  "duration_minutes": 60,
  "intensity": "high",
  "calories_burned": 300,
  "weight_kg": 80,
  "reps": 10,
  "sets": 3,
  "notes": "Great workout, felt strong today",
  "location": "Home Gym",
  "activity_date": "2024-01-15T10:30:00Z",
  "created_at": "2024-01-15T10:35:00Z",
  "updated_at": "2024-01-15T10:35:00Z"
}
```

#### Get Fitness Logs

```bash
curl -X GET "http://localhost:8000/api/v1/health/logging/fitness?skip=0&limit=10" \
  -H "Authorization: Bearer <token>"
```

#### Update a Fitness Log

```bash
curl -X PUT "http://localhost:8000/api/v1/health/logging/fitness/123" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "duration_minutes": 65,
    "calories_burned": 320,
    "notes": "Updated: Added extra set"
  }'
```

### Nutrition Logging

#### Create a Nutrition Log

```bash
curl -X POST "http://localhost:8000/api/v1/health/logging/nutrition" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "meal_type": "breakfast",
    "meal_name": "Protein Oatmeal",
    "total_calories": 450,
    "protein_g": 25,
    "carbs_g": 45,
    "fat_g": 12,
    "food_items": "[{\"name\": \"Oats\", \"quantity\": \"1 cup\", \"calories\": 300, \"protein_g\": 10, \"carbs_g\": 54, \"fat_g\": 6}, {\"name\": \"Protein Powder\", \"quantity\": \"1 scoop\", \"calories\": 120, \"protein_g\": 20, \"carbs_g\": 3, \"fat_g\": 1}, {\"name\": \"Banana\", \"quantity\": \"1 medium\", \"calories\": 30, \"protein_g\": 1, \"carbs_g\": 8, \"fat_g\": 0}]",
    "notes": "Pre-workout meal"
  }'
```

#### Get Nutrition Logs

```bash
curl -X GET "http://localhost:8000/api/v1/health/logging/nutrition?skip=0&limit=10" \
  -H "Authorization: Bearer <token>"
```

### Mood Logging

#### Create a Mood Log

```bash
curl -X POST "http://localhost:8000/api/v1/health/logging/mood" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "mood_rating": 8,
    "energy_level": 7,
    "activities": "[\"workout\", \"work\", \"social\"]",
    "notes": "Great day! Had an amazing workout and productive work session"
  }'
```

#### Get Mood Logs

```bash
curl -X GET "http://localhost:8000/api/v1/health/logging/mood?skip=0&limit=10" \
  -H "Authorization: Bearer <token>"
```

## Routine Management Endpoints

### Simple Routines

#### Get All Routines

```bash
curl -X GET "http://localhost:8000/api/v1/health/simple-routines" \
  -H "Authorization: Bearer <token>"
```

#### Create a Custom Routine

```bash
curl -X POST "http://localhost:8000/api/v1/health/simple-routines/with-workout-plan" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "routine_data": {
      "name": "My Custom Workout",
      "description": "A personalized routine",
      "difficulty": "intermediate",
      "duration_weeks": 6,
      "tags": ["strength", "cardio"]
    },
    "workout_days": [
      {
        "day": "Monday",
        "workout_name": "Push Day",
        "description": "Chest, shoulders, triceps",
        "workouts": [
          {
            "activity_name": "Bench Press",
            "sets": 4,
            "reps": "8-12"
          },
          {
            "activity_name": "Overhead Press",
            "sets": 3,
            "reps": "10-15"
          }
        ]
      }
    ]
  }'
```

#### Start Following a Routine

```bash
curl -X POST "http://localhost:8000/api/v1/health/simple-routines/{routine_id}/start" \
  -H "Authorization: Bearer <token>"
```

#### Log Workout Completion

```bash
curl -X POST "http://localhost:8000/api/v1/health/simple-routines/{routine_id}/log-workout" \
  -H "Authorization: Bearer <token>"
```

### Nutrition Routines

#### Get Nutrition Routines

```bash
curl -X GET "http://localhost:8000/api/v1/health/nutrition-routines" \
  -H "Authorization: Bearer <token>"
```

#### Create Nutrition Routine

```bash
curl -X POST "http://localhost:8000/api/v1/health/nutrition-routines/with-meal-plans" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "routine_data": {
      "name": "High Protein Diet",
      "description": "Muscle building nutrition plan",
      "difficulty": "intermediate",
      "duration_weeks": 8
    },
    "meal_plans": [
      {
        "day_name": "Monday",
        "meals": [
          {
            "meal_type": "breakfast",
            "meal_name": "Protein Oatmeal",
            "total_calories": 450,
            "protein_g": 25,
            "carbs_g": 45,
            "fat_g": 12
          }
        ]
      }
    ]
  }'
```

## Health Insights Endpoints

### Get Daily Summary

```bash
curl -X GET "http://localhost:8000/api/v1/health/logging/daily-summary" \
  -H "Authorization: Bearer <token>"
```

### Get Analytics

```bash
# Daily analytics
curl -X GET "http://localhost:8000/api/v1/health/logging/analytics/daily" \
  -H "Authorization: Bearer <token>"

# Weekly analytics
curl -X GET "http://localhost:8000/api/v1/health/logging/analytics/weekly" \
  -H "Authorization: Bearer <token>"
```

### Get AI Insights

```bash
curl -X GET "http://localhost:8000/api/v1/health/logging/insights" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "period": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z",
    "days": 30
  },
  "fitness_insights": {
    "total_activities": 20,
    "total_duration_minutes": 1200,
    "total_calories_burned": 6000,
    "average_duration": 60,
    "most_common_activity": "weightlifting",
    "consistency_score": 0.85,
    "activity_distribution": {
      "weightlifting": 12,
      "running": 5,
      "yoga": 3
    }
  },
  "nutrition_insights": {
    "total_meals": 90,
    "total_calories": 45000,
    "average_daily_calories": 1500,
    "macro_totals": {
      "protein_g": 2250,
      "carbs_g": 4500,
      "fat_g": 1500
    },
    "macro_ratios": {
      "protein_percent": 20,
      "carbs_percent": 50,
      "fat_percent": 30
    }
  },
  "mood_insights": {
    "total_entries": 30,
    "average_mood": 7.5,
    "average_energy": 7.2,
    "mood_range": {"min": 5, "max": 10},
    "mood_consistency": 0.8
  },
  "correlations": {
    "exercise_mood": {
      "exercise_days_avg_mood": 8.2,
      "non_exercise_days_avg_mood": 6.8,
      "mood_difference": 1.4
    },
    "nutrition_mood": {
      "calorie_mood_correlation": 0.3,
      "high_calorie_days_avg_mood": 7.8,
      "low_calorie_days_avg_mood": 7.1
    }
  },
  "recommendations": [
    {
      "category": "fitness",
      "type": "consistency",
      "priority": "medium",
      "message": "Your workout consistency is good. Consider adding more variety to your routine.",
      "action": "Try incorporating different types of exercises"
    },
    {
      "category": "nutrition",
      "type": "macro_balance",
      "priority": "low",
      "message": "Your macro ratios look balanced. Consider increasing protein slightly for muscle building.",
      "action": "Add a protein shake post-workout"
    }
  ]
}
```

### Get Health Summary

```bash
curl -X GET "http://localhost:8000/api/v1/insights/summary?days=7" \
  -H "Authorization: Bearer <token>"
```

### Get Health Trends

```bash
# Get mood trends
curl -X GET "http://localhost:8000/api/v1/insights/trends?metric=mood&days=14" \
  -H "Authorization: Bearer <token>"

# Get calorie trends
curl -X GET "http://localhost:8000/api/v1/insights/trends?metric=calories&days=14" \
  -H "Authorization: Bearer <token>"
```

## AI Assistant Integration

### Chat with Health Context

```bash
# Send a message to a conversation
curl -X POST "http://localhost:8000/api/v1/chat/messages/{conversation_id}/messages" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "How am I doing with my fitness goals?",
    "message_type": "user"
  }'
```

### Get AI Reply

```bash
# Get AI response for a conversation
curl -X POST "http://localhost:8000/api/v1/chat/messages/{conversation_id}/reply" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "How am I doing with my fitness goals?",
    "message_type": "user"
  }'
```

### Conversation Management

```bash
# Get all conversations
curl -X GET "http://localhost:8000/api/v1/chat/conversations" \
  -H "Authorization: Bearer <token>"

# Create new conversation
curl -X POST "http://localhost:8000/api/v1/chat/conversations/new" \
  -H "Authorization: Bearer <token>"

# Get specific conversation with messages
curl -X GET "http://localhost:8000/api/v1/chat/conversations/{conversation_id}" \
  -H "Authorization: Bearer <token>"
```

The AI assistant will automatically have access to your health data and can provide personalized insights based on your logged activities.

## Error Handling

### Common Error Responses

#### 401 Unauthorized
```json
{
  "type": "about:blank",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Not authenticated",
  "message": "Not authenticated"
}
```

#### 404 Not Found
```json
{
  "type": "about:blank",
  "title": "Not Found",
  "status": 404,
  "detail": "Fitness log not found"
}
```

#### 422 Validation Error
```json
{
  "type": "about:blank",
  "title": "Unprocessable Entity",
  "status": 422,
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "activity_type"],
      "msg": "Field required",
      "input": {}
    }
  ]
}
```

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Health Logging**: 100 requests per hour per user
- **Health Insights**: 20 requests per hour per user
- **General API**: 1000 requests per hour per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Webhook Integration

### Health Goal Achievements

```bash
# Configure webhook for goal achievements
curl -X POST "http://localhost:8000/api/v1/webhooks/goals" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/health-goals",
    "events": ["goal_achieved", "milestone_reached", "streak_broken"]
  }'
```

## SDK Examples

### Python SDK Example

```python
import requests
from datetime import datetime

class HealthLogAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    
    def log_fitness(self, activity_type, duration_minutes, **kwargs):
        data = {
            "activity_type": activity_type,
            "duration_minutes": duration_minutes,
            **kwargs
        }
        response = requests.post(
            f"{self.base_url}/api/v1/logging/fitness",
            headers=self.headers,
            json=data
        )
        return response.json()
    
    def get_insights(self, days=30):
        response = requests.get(
            f"{self.base_url}/api/v1/insights/insights",
            headers=self.headers,
            params={"days": days}
        )
        return response.json()

# Usage
api = HealthLogAPI("http://localhost:8000", "your-jwt-token")

# Log a workout
workout = api.log_fitness(
    activity_type="running",
    duration_minutes=30,
    calories_burned=250,
    intensity="medium"
)

# Get insights
insights = api.get_insights(days=7)
print(f"Average mood: {insights['mood_insights']['average_mood']}")
```

### JavaScript SDK Example

```javascript
class HealthLogAPI {
    constructor(baseUrl, token) {
        this.baseUrl = baseUrl;
        this.headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
    
    async logMood(moodRating, energyLevel, activities = []) {
        const response = await fetch(`${this.baseUrl}/api/v1/logging/mood`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({
                mood_rating: moodRating,
                energy_level: energyLevel,
                activities: activities
            })
        });
        return response.json();
    }
    
    async getHealthSummary(days = 7) {
        const response = await fetch(`${this.baseUrl}/api/v1/insights/summary?days=${days}`, {
            headers: this.headers
        });
        return response.json();
    }
}

// Usage
const api = new HealthLogAPI('http://localhost:8000', 'your-jwt-token');

// Log mood
api.logMood(8, 7, ['workout', 'work', 'social'])
    .then(result => console.log('Mood logged:', result));

// Get summary
api.getHealthSummary(14)
    .then(summary => console.log('Health summary:', summary));
```

## Testing with Demo Data

Run the demo scenario to populate test data:

```bash
cd backend
python demo_health_scenarios.py
```

This will create a demo user with 30 days of realistic health data for testing the API endpoints.

## Best Practices

1. **Batch Operations**: When logging multiple entries, consider batching them in a single request
2. **Error Handling**: Always check response status codes and handle errors gracefully
3. **Rate Limiting**: Implement exponential backoff for rate limit errors
4. **Data Validation**: Validate data on the client side before sending to the API
5. **Caching**: Cache insights data to reduce API calls
6. **Webhooks**: Use webhooks for real-time updates instead of polling

## Support

For API support and questions:
- Check the API documentation at `http://localhost:8000/docs`
- Review the health logging guide in `docs/HEALTH_LOGGING.md`
- Contact support through the chat interface

