"""
Consolidated health logging enums.
Eliminates duplication of enum definitions across health logging schemas.
"""

from enum import Enum


class ActivityType(str, Enum):
    """Types of physical activities."""
    RUNNING = "running"
    WALKING = "walking"
    CYCLING = "cycling"
    WEIGHTLIFTING = "weightlifting"
    YOGA = "yoga"
    PILATES = "pilates"
    SWIMMING = "swimming"
    DANCING = "dancing"
    HIKING = "hiking"
    CARDIO = "cardio"
    STRENGTH_TRAINING = "strength_training"
    FLEXIBILITY = "flexibility"
    SPORTS = "sports"
    OTHER = "other"


class IntensityLevel(str, Enum):
    """Exercise intensity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class MealType(str, Enum):
    """Types of meals."""
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    SNACK = "snack"


class MoodLevel(str, Enum):
    """Mood rating levels."""
    VERY_LOW = "very_low"
    LOW = "low"
    NEUTRAL = "neutral"
    HIGH = "high"
    VERY_HIGH = "very_high"


class LogType(str, Enum):
    """Types of health logs."""
    FITNESS = "fitness"
    NUTRITION = "nutrition"
    WATER = "water"
    MOOD = "mood"
    WEIGHT = "weight"
    SLEEP = "sleep"


class Priority(str, Enum):
    """Priority levels for goals and recommendations."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Status(str, Enum):
    """Status values for various entities."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    PAUSED = "paused"


class GoalCategory(str, Enum):
    """Categories for health goals."""
    FITNESS = "fitness"
    NUTRITION = "nutrition"
    WEIGHT = "weight"
    SLEEP = "sleep"
    MENTAL_HEALTH = "mental_health"
    GENERAL = "general"


class LoggingCategory(str, Enum):
    """Categories for exercise logging."""
    BODYWEIGHT = "bodyweight"
    WEIGHTED = "weighted"
    CARDIO_DURATION = "cardio_duration"
    HOLD_STATIC = "hold_static"
    REPETITION_ONLY = "repetition_only"
    DISTANCE_BASED = "distance_based"


class WaterLogType(str, Enum):
    """Types of water logging."""
    MANUAL = "manual"
    GOAL = "goal"
    REMINDER = "reminder"


class TimePeriod(str, Enum):
    """Time periods for data analysis."""
    DAY = "day"
    WEEK = "week"
    MONTH = "month"
    QUARTER = "quarter"
    YEAR = "year"
    ALL = "all"
    CUSTOM = "custom"


class UnitSystem(str, Enum):
    """Unit systems for measurements."""
    METRIC = "metric"
    IMPERIAL = "imperial"


class WeightUnit(str, Enum):
    """Weight measurement units."""
    KG = "kg"
    LBS = "lbs"
    POUNDS = "pounds"


class DistanceUnit(str, Enum):
    """Distance measurement units."""
    KM = "km"
    MILES = "miles"
    METERS = "meters"
    FEET = "feet"


class TemperatureUnit(str, Enum):
    """Temperature measurement units."""
    CELSIUS = "celsius"
    FAHRENHEIT = "fahrenheit"


class VolumeUnit(str, Enum):
    """Volume measurement units."""
    ML = "ml"
    OZ = "oz"
    CUPS = "cups"
    LITERS = "liters"


class Gender(str, Enum):
    """Gender options."""
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class BodyType(str, Enum):
    """Body type categories."""
    ECTOMORPH = "ectomorph"
    MESOMORPH = "mesomorph"
    ENDOMORPH = "endomorph"
    UNKNOWN = "unknown"


class ActivityLevel(str, Enum):
    """Activity level categories."""
    SEDENTARY = "sedentary"
    LIGHTLY_ACTIVE = "lightly_active"
    MODERATELY_ACTIVE = "moderately_active"
    VERY_ACTIVE = "very_active"
    EXTRA_ACTIVE = "extra_active"


class SleepQuality(str, Enum):
    """Sleep quality ratings."""
    VERY_POOR = "very_poor"
    POOR = "poor"
    FAIR = "fair"
    GOOD = "good"
    EXCELLENT = "excellent"


class StressLevel(str, Enum):
    """Stress level ratings."""
    VERY_LOW = "very_low"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    VERY_HIGH = "very_high"


class EnergyLevel(str, Enum):
    """Energy level ratings."""
    VERY_LOW = "very_low"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    VERY_HIGH = "very_high"


class DifficultyLevel(str, Enum):
    """Difficulty levels for exercises and routines."""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class Frequency(str, Enum):
    """Frequency options for routines and goals."""
    DAILY = "daily"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    CUSTOM = "custom"


class NotificationType(str, Enum):
    """Types of notifications."""
    REMINDER = "reminder"
    ACHIEVEMENT = "achievement"
    GOAL_UPDATE = "goal_update"
    STREAK_UPDATE = "streak_update"
    TIP = "tip"
    WARNING = "warning"


class InsightType(str, Enum):
    """Types of insights and recommendations."""
    TREND = "trend"
    RECOMMENDATION = "recommendation"
    ACHIEVEMENT = "achievement"
    WARNING = "warning"
    TIP = "tip"
    CORRELATION = "correlation"
