"""
Action Feedback System for AI Companion Chat
Generates user-friendly confirmation messages for executed actions.
"""

from typing import Dict, Any
from datetime import datetime


class ActionFeedbackGenerator:
    """Generates user-friendly feedback messages for executed actions."""
    
    @staticmethod
    def generate_success_feedback(action_result: Dict[str, Any]) -> str:
        """Generate success feedback message for executed action."""
        action_name = action_result.get("action", "unknown")
        
        if action_name == "fitness.log_workout":
            return ActionFeedbackGenerator._generate_workout_feedback(action_result)
        elif action_name == "nutrition.log_meal":
            return ActionFeedbackGenerator._generate_meal_feedback(action_result)
        elif action_name == "calendar.create_event":
            return ActionFeedbackGenerator._generate_calendar_feedback(action_result)
        elif action_name == "coaching.create_goal":
            return ActionFeedbackGenerator._generate_goal_feedback(action_result)
        elif action_name == "fitness.create_goal":
            return ActionFeedbackGenerator._generate_goal_feedback(action_result)
        elif action_name == "journal.add_entry":
            return ActionFeedbackGenerator._generate_journal_feedback(action_result)
        else:
            return f"✅ Action '{action_name}' executed successfully!"
    
    @staticmethod
    def generate_failure_feedback(action_result: Dict[str, Any]) -> str:
        """Generate failure feedback message for failed action."""
        action_name = action_result.get("action", "unknown")
        error = action_result.get("error", "Unknown error")
        
        return f"❌ Failed to execute '{action_name}': {error}"
    
    @staticmethod
    def _generate_workout_feedback(action_result: Dict[str, Any]) -> str:
        """Generate workout-specific feedback."""
        result = action_result.get("result", {})
        workout_name = result.get("workout_name", "workout")
        duration = result.get("duration_min")
        exercises = result.get("exercises", [])
        
        feedback = "💪 Workout logged successfully!"
        
        if workout_name and workout_name != "workout":
            feedback += f" Name: {workout_name}"
        
        if duration:
            feedback += f" Duration: {duration} minutes"
        
        if exercises:
            exercise_names = [ex.get("name", "") for ex in exercises if ex.get("name")]
            if exercise_names:
                feedback += f" Exercises: {', '.join(exercise_names)}"
        
        feedback += "\n\nWould you like me to track your progress or set fitness goals?"
        return feedback
    
    @staticmethod
    def _generate_meal_feedback(action_result: Dict[str, Any]) -> str:
        """Generate meal-specific feedback."""
        result = action_result.get("result", {})
        items = result.get("items", [])
        calories = result.get("est_kcal")
        protein = result.get("est_protein_g")
        
        feedback = "🍽️ Meal logged successfully!"
        
        if items:
            feedback += f" Items: {', '.join(items)}"
        
        if calories:
            feedback += f" Calories: {calories} kcal"
        
        if protein:
            feedback += f" Protein: {protein}g"
        
        feedback += "\n\nWould you like me to analyze your nutrition or suggest meal improvements?"
        return feedback
    
    @staticmethod
    def _generate_calendar_feedback(action_result: Dict[str, Any]) -> str:
        """Generate calendar-specific feedback."""
        result = action_result.get("result", {})
        title = result.get("title", "")
        start = result.get("start")
        recurring = result.get("recurring")
        day = result.get("day")
        
        feedback = "📅 Calendar event created successfully!"
        
        if title:
            feedback += f" Event: {title}"
        
        if start:
            try:
                start_time = datetime.fromisoformat(start.replace('Z', '+00:00'))
                feedback += f" Time: {start_time.strftime('%B %d at %I:%M %p')}"
            except Exception:
                pass
        
        if recurring:
            feedback += f" Recurring: {recurring}"
        
        if day:
            feedback += f" Day: {day}"
        
        feedback += "\n\nWould you like me to set reminders or add more events to your calendar?"
        return feedback
    
    @staticmethod
    def _generate_goal_feedback(action_result: Dict[str, Any]) -> str:
        """Generate goal-specific feedback."""
        result = action_result.get("result", {})
        name = result.get("name", "")
        category = result.get("category", "")
        
        feedback = "🎯 Goal created successfully!"
        
        if name:
            feedback += f" Goal: {name}"
        
        if category:
            feedback += f" Category: {category.title()}"
        
        feedback += "\n\nWould you like me to help you track progress toward this goal?"
        return feedback
    
    @staticmethod
    def _generate_journal_feedback(action_result: Dict[str, Any]) -> str:
        """Generate journal-specific feedback."""
        result = action_result.get("result", {})
        content = result.get("content", "")
        
        feedback = "📝 Journal entry saved successfully!"
        
        if content and len(content) > 50:
            feedback += f" Entry: {content[:50]}..."
        elif content:
            feedback += f" Entry: {content}"
        
        feedback += "\n\nWould you like me to help you reflect on this entry or set related goals?"
        return feedback
    
    @staticmethod
    def generate_action_summary(action_result: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a summary of the executed action for the AI context."""
        action_name = action_result.get("action", "unknown")
        success = action_result.get("success", False)
        
        summary = {
            "action_executed": action_name,
            "success": success,
            "timestamp": datetime.now().isoformat()
        }
        
        if success:
            summary["status"] = "ACTION EXECUTED SUCCESSFULLY"
            summary["user_feedback"] = ActionFeedbackGenerator.generate_success_feedback(action_result)
            
            # Add specific context based on action type
            if action_name == "fitness.log_workout":
                summary["context"] = "The user just logged a workout. Acknowledge this achievement and ask if they want to track progress, set goals, or discuss their fitness routine."
            elif action_name == "nutrition.log_meal":
                summary["context"] = "The user just logged a meal. Acknowledge this and ask if they want to analyze their nutrition, track calories, or get meal suggestions."
            elif action_name == "calendar.create_event":
                summary["context"] = "The user just created a calendar event. Acknowledge this and ask if they want to set reminders, add more events, or discuss their schedule."
            elif action_name == "coaching.create_goal":
                summary["context"] = "The user just created a goal. Acknowledge this and ask if they want to track progress, set milestones, or discuss strategies to achieve it."
            elif action_name == "fitness.create_goal":
                summary["context"] = "The user just created a fitness goal. Acknowledge this and ask if they want to track progress, set milestones, or discuss strategies to achieve it."
            elif action_name == "journal.add_entry":
                summary["context"] = "The user just added a journal entry. Acknowledge this and ask if they want to reflect on it, set related goals, or discuss their thoughts."
        else:
            summary["status"] = "ACTION FAILED"
            summary["user_feedback"] = ActionFeedbackGenerator.generate_failure_feedback(action_result)
            summary["context"] = "The user's action failed to execute. Apologize for the error and offer to help them try again or suggest an alternative approach."
        
        return summary


# Global instance
action_feedback = ActionFeedbackGenerator()
