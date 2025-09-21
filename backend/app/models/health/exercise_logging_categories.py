"""
Exercise Logging Categories - Based on logging attributes rather than body parts
"""

from sqlalchemy import Column, String, Integer, Float, Text, Boolean, JSON, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import uuid
import enum

class ExerciseLoggingCategoryEnum(str, enum.Enum):
    """Exercise categories based on logging attributes"""
    bodyweight = "bodyweight"           # Sets, Reps, Notes
    weighted = "weighted"               # Sets, Reps, Weight, Weight Unit, Notes
    cardio_duration = "cardio_duration" # Duration, Distance (optional), Intensity, Heart Rate (optional), Notes
    hold_static = "hold_static"         # Duration, Difficulty Level, Notes
    repetition_only = "repetition_only" # Total Reps, Notes
    distance_based = "distance_based"   # Distance, Time, Pace, Notes

class ExerciseLoggingCategory(Base):
    """Exercise logging category definitions with their required attributes"""

    __tablename__ = "exercise_logging_categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Basic info
    name = Column(String(50), nullable=False, unique=True)  # "Bodyweight", "Weighted", etc.
    category = Column(Enum(ExerciseLoggingCategoryEnum), nullable=False, index=True)
    display_name = Column(String(100), nullable=False)  # "Bodyweight Exercises"
    description = Column(Text, nullable=True)
    
    # Logging attributes schema - defines what fields are required/optional
    logging_attributes = Column(JSON, nullable=False)
    
    # UI/UX metadata
    icon = Column(String(50), nullable=True)  # Icon name for UI
    color = Column(String(20), nullable=True)  # Color theme for UI
    
    # Tracking
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0)  # For UI ordering
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<ExerciseLoggingCategory(id={self.id}, name={self.name}, category={self.category})>"

# Predefined logging attribute schemas for each category
LOGGING_ATTRIBUTES_SCHEMAS = {
    ExerciseLoggingCategoryEnum.bodyweight: {
        "required": [
            {"name": "sets", "type": "number", "label": "Sets", "min": 1, "max": 50},
            {"name": "reps", "type": "number", "label": "Reps", "min": 1, "max": 1000}
        ],
        "optional": [
            {"name": "notes", "type": "text", "label": "Notes", "max_length": 500}
        ]
    },
    ExerciseLoggingCategoryEnum.weighted: {
        "required": [
            {"name": "sets", "type": "number", "label": "Sets", "min": 1, "max": 50},
            {"name": "reps", "type": "number", "label": "Reps", "min": 1, "max": 1000},
            {"name": "weight", "type": "number", "label": "Weight", "min": 0, "max": 1000}
        ],
        "optional": [
            {"name": "weight_unit", "type": "select", "label": "Weight Unit", "options": ["lbs", "kg"]},
            {"name": "notes", "type": "text", "label": "Notes", "max_length": 500}
        ]
    },
    ExerciseLoggingCategoryEnum.cardio_duration: {
        "required": [
            {"name": "duration", "type": "number", "label": "Duration (minutes)", "min": 1, "max": 600}
        ],
        "optional": [
            {"name": "distance", "type": "number", "label": "Distance", "min": 0, "max": 1000},
            {"name": "distance_unit", "type": "select", "label": "Distance Unit", "options": ["miles", "km", "meters"]},
            {"name": "intensity", "type": "select", "label": "Intensity", "options": ["low", "medium", "high"]},
            {"name": "heart_rate", "type": "number", "label": "Heart Rate (bpm)", "min": 40, "max": 220},
            {"name": "notes", "type": "text", "label": "Notes", "max_length": 500}
        ]
    },
    ExerciseLoggingCategoryEnum.hold_static: {
        "required": [
            {"name": "duration", "type": "number", "label": "Hold Time (seconds)", "min": 1, "max": 3600}
        ],
        "optional": [
            {"name": "difficulty", "type": "select", "label": "Difficulty", "options": ["beginner", "intermediate", "advanced"]},
            {"name": "notes", "type": "text", "label": "Notes", "max_length": 500}
        ]
    },
    ExerciseLoggingCategoryEnum.repetition_only: {
        "required": [
            {"name": "total_reps", "type": "number", "label": "Total Reps", "min": 1, "max": 10000}
        ],
        "optional": [
            {"name": "notes", "type": "text", "label": "Notes", "max_length": 500}
        ]
    },
    ExerciseLoggingCategoryEnum.distance_based: {
        "required": [
            {"name": "distance", "type": "number", "label": "Distance", "min": 0.1, "max": 1000},
            {"name": "time", "type": "number", "label": "Time (minutes)", "min": 1, "max": 600}
        ],
        "optional": [
            {"name": "distance_unit", "type": "select", "label": "Distance Unit", "options": ["miles", "km", "meters"]},
            {"name": "pace", "type": "text", "label": "Pace (e.g., 8:30/mile)", "max_length": 20},
            {"name": "notes", "type": "text", "label": "Notes", "max_length": 500}
        ]
    }
}

# Category metadata for UI
CATEGORY_METADATA = {
    ExerciseLoggingCategoryEnum.bodyweight: {
        "display_name": "Bodyweight Exercises",
        "description": "Exercises using only your body weight",
        "icon": "user",
        "color": "blue"
    },
    ExerciseLoggingCategoryEnum.weighted: {
        "display_name": "Weighted Exercises", 
        "description": "Exercises with external weights",
        "icon": "dumbbell",
        "color": "red"
    },
    ExerciseLoggingCategoryEnum.cardio_duration: {
        "display_name": "Cardio & Duration",
        "description": "Cardiovascular exercises tracked by time",
        "icon": "heart",
        "color": "green"
    },
    ExerciseLoggingCategoryEnum.hold_static: {
        "display_name": "Hold & Static",
        "description": "Static holds and isometric exercises",
        "icon": "clock",
        "color": "purple"
    },
    ExerciseLoggingCategoryEnum.repetition_only: {
        "display_name": "Repetition Only",
        "description": "Simple repetition-based exercises",
        "icon": "repeat",
        "color": "orange"
    },
    ExerciseLoggingCategoryEnum.distance_based: {
        "display_name": "Distance Based",
        "description": "Exercises tracked by distance and time",
        "icon": "map",
        "color": "teal"
    }
}
