"""
Exercise Logging Categories - Simplified structure without complex JSON schemas
"""

from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime
from sqlalchemy.sql import func
from app.db.base_class import Base
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
    """Simplified exercise logging category definitions"""

    __tablename__ = "exercise_logging_categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Basic info
    name = Column(String(50), nullable=False, unique=True)  # "bodyweight", "weighted", etc.
    display_name = Column(String(100), nullable=False)  # "Bodyweight Exercises"
    description = Column(Text, nullable=True)
    
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
        return f"<ExerciseLoggingCategory(id={self.id}, name={self.name}, display_name={self.display_name})>"

# Simplified form field definitions for each category
# These are now defined in code for easier maintenance
FORM_FIELDS = {
    ExerciseLoggingCategoryEnum.bodyweight: {
        "required": ["sets", "reps"],
        "optional": ["notes"]
    },
    ExerciseLoggingCategoryEnum.weighted: {
        "required": ["sets", "reps", "weight"],
        "optional": ["weight_unit", "notes"]
    },
    ExerciseLoggingCategoryEnum.cardio_duration: {
        "required": ["duration"],
        "optional": ["distance", "distance_unit", "intensity", "heart_rate", "notes"]
    },
    ExerciseLoggingCategoryEnum.hold_static: {
        "required": ["duration"],
        "optional": ["difficulty", "notes"]
    },
    ExerciseLoggingCategoryEnum.repetition_only: {
        "required": ["total_reps"],
        "optional": ["notes"]
    },
    ExerciseLoggingCategoryEnum.distance_based: {
        "required": ["distance", "time"],
        "optional": ["distance_unit", "pace", "notes"]
    }
}

# Field definitions for form generation
FIELD_DEFINITIONS = {
    "sets": {"type": "number", "label": "Sets", "min": 1, "max": 50},
    "reps": {"type": "number", "label": "Reps", "min": 1, "max": 1000},
    "weight": {"type": "number", "label": "Weight", "min": 0, "max": 1000},
    "weight_unit": {"type": "select", "label": "Weight Unit", "options": ["lbs", "kg"]},
    "duration": {"type": "number", "label": "Duration (minutes)", "min": 1, "max": 600},
    "distance": {"type": "number", "label": "Distance", "min": 0, "max": 1000},
    "distance_unit": {"type": "select", "label": "Distance Unit", "options": ["miles", "km", "meters"]},
    "intensity": {"type": "select", "label": "Intensity", "options": ["low", "medium", "high"]},
    "heart_rate": {"type": "number", "label": "Heart Rate (bpm)", "min": 40, "max": 220},
    "difficulty": {"type": "select", "label": "Difficulty", "options": ["beginner", "intermediate", "advanced"]},
    "total_reps": {"type": "number", "label": "Total Reps", "min": 1, "max": 10000},
    "time": {"type": "number", "label": "Time (minutes)", "min": 1, "max": 600},
    "pace": {"type": "text", "label": "Pace (e.g., 8:30/mile)", "max_length": 20},
    "notes": {"type": "text", "label": "Notes", "max_length": 500}
}

def get_form_schema(category: ExerciseLoggingCategoryEnum) -> dict:
    """Get the form schema for a specific exercise category"""
    if category not in FORM_FIELDS:
        return {"required": [], "optional": []}
    
    required_fields = []
    optional_fields = []
    
    for field in FORM_FIELDS[category]["required"]:
        if field in FIELD_DEFINITIONS:
            required_fields.append({
                "name": field,
                **FIELD_DEFINITIONS[field]
            })
    
    for field in FORM_FIELDS[category]["optional"]:
        if field in FIELD_DEFINITIONS:
            optional_fields.append({
                "name": field,
                **FIELD_DEFINITIONS[field]
            })
    
    return {
        "required": required_fields,
        "optional": optional_fields
    }
