"""
Enhanced memory types and enums for the AI companion system.
Provides comprehensive categorization and relationship modeling.
"""

from enum import Enum
from typing import Dict, List, Optional, Set
from dataclasses import dataclass


class MemoryType(str, Enum):
    """Enhanced memory types with semantic meaning"""
    # Core types (existing)
    CONVERSATION = "conversation"
    PROFILE = "profile"
    PREFERENCE = "preference"
    FACT = "fact"
    MESSAGE = "message"
    ONBOARDING = "onboarding"
    
    # New semantic types
    GOAL = "goal"
    HABIT = "habit"
    ACHIEVEMENT = "achievement"
    CHALLENGE = "challenge"
    LEARNING = "learning"
    EMOTIONAL_STATE = "emotional_state"
    DECISION = "decision"
    PLANNING = "planning"
    REFLECTION = "reflection"
    FEEDBACK = "feedback"
    REMINDER = "reminder"
    MILESTONE = "milestone"
    ROUTINE = "routine"
    SKILL = "skill"
    RELATIONSHIP = "relationship"
    EVENT = "event"


class RelationshipType(str, Enum):
    """Types of relationships between memories"""
    # Logical relationships
    CONTRADICTS = "contradicts"
    SUPPORTS = "supports"
    ELABORATES = "elaborates"
    UPDATES = "updates"
    REPLACES = "replaces"
    CONFIRMS = "confirms"
    
    # Temporal relationships
    FOLLOWS = "follows"
    PRECEDES = "precedes"
    CONCURRENT = "concurrent"
    
    # Hierarchical relationships
    PARENT_OF = "parent_of"
    CHILD_OF = "child_of"
    SIBLING_OF = "sibling_of"
    
    # Causal relationships
    CAUSES = "causes"
    CAUSED_BY = "caused_by"
    ENABLES = "enables"
    PREVENTS = "prevents"
    
    # Contextual relationships
    RELATED_TO = "related_to"
    SIMILAR_TO = "similar_to"
    OPPOSITE_TO = "opposite_to"


class EvolutionType(str, Enum):
    """Types of memory evolution"""
    # Content changes
    CONSOLIDATION = "consolidation"
    CORRECTION = "correction"
    ENHANCEMENT = "enhancement"
    SIMPLIFICATION = "simplification"
    
    # Lifecycle changes
    REINFORCEMENT = "reinforcement"
    FORGETTING = "forgetting"
    REVIVAL = "revival"
    ARCHIVAL = "archival"
    
    # Structural changes
    MERGE = "merge"
    SPLIT = "split"
    CATEGORIZATION = "categorization"
    RECONTEXTUALIZATION = "recontextualization"


class PrivacyLevel(str, Enum):
    """Privacy levels for memories"""
    PUBLIC = "public"           # Can be shared publicly
    NORMAL = "normal"           # Default privacy level
    PRIVATE = "private"         # Personal information
    SENSITIVE = "sensitive"     # Highly sensitive data
    CONFIDENTIAL = "confidential"  # Maximum security


class MemoryCategory(str, Enum):
    """High-level memory categories"""
    # Personal categories
    PERSONAL_INFO = "personal_info"
    PREFERENCES = "preferences"
    GOALS_ASPIRATIONS = "goals_aspirations"
    HABITS_ROUTINES = "habits_routines"
    RELATIONSHIPS = "relationships"
    
    # Activity categories
    WORK_CAREER = "work_career"
    HEALTH_FITNESS = "health_fitness"
    LEARNING_EDUCATION = "learning_education"
    ENTERTAINMENT_LEISURE = "entertainment_leisure"
    TRAVEL_EXPERIENCES = "travel_experiences"
    
    # Cognitive categories
    DECISIONS_CHOICES = "decisions_choices"
    REFLECTIONS_INSIGHTS = "reflections_insights"
    PROBLEMS_SOLUTIONS = "problems_solutions"
    PLANNING_ORGANIZATION = "planning_organization"
    
    # Temporal categories
    DAILY_ACTIVITIES = "daily_activities"
    SIGNIFICANT_EVENTS = "significant_events"
    MILESTONES_ACHIEVEMENTS = "milestones_achievements"
    
    # Contextual categories
    LOCATION_BASED = "location_based"
    SOCIAL_INTERACTIONS = "social_interactions"
    EMOTIONAL_EXPERIENCES = "emotional_experiences"


class MemorySubcategory(str, Enum):
    """Detailed subcategories for fine-grained classification"""
    
    # Personal Info subcategories
    BASIC_DETAILS = "basic_details"
    CONTACT_INFO = "contact_info"
    BACKGROUND_HISTORY = "background_history"
    PERSONALITY_TRAITS = "personality_traits"
    VALUES_BELIEFS = "values_beliefs"
    
    # Preferences subcategories
    FOOD_DRINK = "food_drink"
    ENTERTAINMENT_MEDIA = "entertainment_media"
    COMMUNICATION_STYLE = "communication_style"
    WORK_ENVIRONMENT = "work_environment"
    LIFESTYLE_CHOICES = "lifestyle_choices"
    
    # Goals subcategories
    SHORT_TERM_GOALS = "short_term_goals"
    LONG_TERM_GOALS = "long_term_goals"
    CAREER_OBJECTIVES = "career_objectives"
    PERSONAL_DEVELOPMENT = "personal_development"
    HEALTH_TARGETS = "health_targets"
    
    # Work subcategories
    PROJECTS = "projects"
    MEETINGS = "meetings"
    SKILLS_COMPETENCIES = "skills_competencies"
    TEAM_DYNAMICS = "team_dynamics"
    PERFORMANCE_FEEDBACK = "performance_feedback"
    
    # Health subcategories
    PHYSICAL_ACTIVITY = "physical_activity"
    NUTRITION_DIET = "nutrition_diet"
    MENTAL_WELLBEING = "mental_wellbeing"
    MEDICAL_HEALTH = "medical_health"
    SLEEP_RECOVERY = "sleep_recovery"
    
    # Learning subcategories
    TECHNICAL_SKILLS = "technical_skills"
    SOFT_SKILLS = "soft_skills"
    ACADEMIC_SUBJECTS = "academic_subjects"
    CERTIFICATIONS = "certifications"
    KNOWLEDGE_GAPS = "knowledge_gaps"


class ContextType(str, Enum):
    """Context types for memory situations"""
    WORK = "work"
    HOME = "home"
    SOCIAL = "social"
    TRAVEL = "travel"
    EXERCISE = "exercise"
    LEARNING = "learning"
    ENTERTAINMENT = "entertainment"
    COMMUTE = "commute"
    MEETING = "meeting"
    PHONE_CALL = "phone_call"
    EMAIL = "email"
    CHAT = "chat"
    IN_PERSON = "in_person"


class MoodType(str, Enum):
    """Mood types for emotional context"""
    # Positive moods
    HAPPY = "happy"
    EXCITED = "excited"
    CONTENT = "content"
    GRATEFUL = "grateful"
    CONFIDENT = "confident"
    OPTIMISTIC = "optimistic"
    ENERGETIC = "energetic"
    PEACEFUL = "peaceful"
    
    # Negative moods
    SAD = "sad"
    ANGRY = "angry"
    FRUSTRATED = "frustrated"
    ANXIOUS = "anxious"
    STRESSED = "stressed"
    DISAPPOINTED = "disappointed"
    OVERWHELMED = "overwhelmed"
    LONELY = "lonely"
    
    # Neutral moods
    CALM = "calm"
    FOCUSED = "focused"
    TIRED = "tired"
    NEUTRAL = "neutral"
    CONTEMPLATIVE = "contemplative"
    CURIOUS = "curious"


class PriorityLevel(str, Enum):
    """Priority levels for memories"""
    CRITICAL = "critical"      # Immediate attention required
    HIGH = "high"             # Important, should be prioritized
    MEDIUM = "medium"         # Standard importance
    LOW = "low"              # Nice to have, low priority
    SOMEDAY = "someday"      # Future consideration


class SkillLevel(str, Enum):
    """Skill proficiency levels"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"
    MASTER = "master"


class VerificationStatus(str, Enum):
    """Verification status for memory content"""
    VERIFIED = "verified"        # Confirmed accurate
    UNVERIFIED = "unverified"    # Not yet confirmed
    DISPUTED = "disputed"        # Conflicting information exists
    OUTDATED = "outdated"        # No longer current
    UNCERTAIN = "uncertain"      # Confidence level low


@dataclass
class MemoryTypeMetadata:
    """Metadata about memory types"""
    type: MemoryType
    default_categories: List[MemoryCategory]
    default_subcategories: List[MemorySubcategory]
    typical_privacy_level: PrivacyLevel
    default_importance_range: tuple[int, int]  # (min, max) on 0-100 scale
    decay_half_life_days: int
    description: str


class MemoryTypeRegistry:
    """Registry of memory type metadata and relationships"""
    
    def __init__(self):
        self.type_metadata: Dict[MemoryType, MemoryTypeMetadata] = {
            MemoryType.PROFILE: MemoryTypeMetadata(
                type=MemoryType.PROFILE,
                default_categories=[MemoryCategory.PERSONAL_INFO],
                default_subcategories=[MemorySubcategory.BASIC_DETAILS, MemorySubcategory.PERSONALITY_TRAITS],
                typical_privacy_level=PrivacyLevel.PRIVATE,
                default_importance_range=(70, 95),
                decay_half_life_days=365,
                description="Core personal information and characteristics"
            ),
            MemoryType.PREFERENCE: MemoryTypeMetadata(
                type=MemoryType.PREFERENCE,
                default_categories=[MemoryCategory.PREFERENCES],
                default_subcategories=[MemorySubcategory.LIFESTYLE_CHOICES, MemorySubcategory.COMMUNICATION_STYLE],
                typical_privacy_level=PrivacyLevel.NORMAL,
                default_importance_range=(60, 85),
                decay_half_life_days=180,
                description="User preferences and choices"
            ),
            MemoryType.GOAL: MemoryTypeMetadata(
                type=MemoryType.GOAL,
                default_categories=[MemoryCategory.GOALS_ASPIRATIONS],
                default_subcategories=[MemorySubcategory.SHORT_TERM_GOALS, MemorySubcategory.LONG_TERM_GOALS],
                typical_privacy_level=PrivacyLevel.NORMAL,
                default_importance_range=(75, 95),
                decay_half_life_days=90,
                description="Goals, objectives, and aspirations"
            ),
            MemoryType.HABIT: MemoryTypeMetadata(
                type=MemoryType.HABIT,
                default_categories=[MemoryCategory.HABITS_ROUTINES],
                default_subcategories=[MemorySubcategory.LIFESTYLE_CHOICES],
                typical_privacy_level=PrivacyLevel.NORMAL,
                default_importance_range=(50, 75),
                decay_half_life_days=30,
                description="Regular behaviors and routines"
            ),
            MemoryType.LEARNING: MemoryTypeMetadata(
                type=MemoryType.LEARNING,
                default_categories=[MemoryCategory.LEARNING_EDUCATION],
                default_subcategories=[MemorySubcategory.TECHNICAL_SKILLS, MemorySubcategory.SOFT_SKILLS],
                typical_privacy_level=PrivacyLevel.NORMAL,
                default_importance_range=(65, 85),
                decay_half_life_days=60,
                description="Learning activities and educational content"
            ),
            MemoryType.DECISION: MemoryTypeMetadata(
                type=MemoryType.DECISION,
                default_categories=[MemoryCategory.DECISIONS_CHOICES],
                default_subcategories=[MemorySubcategory.PERSONAL_DEVELOPMENT],
                typical_privacy_level=PrivacyLevel.PRIVATE,
                default_importance_range=(60, 90),
                decay_half_life_days=120,
                description="Important decisions and their reasoning"
            ),
            MemoryType.REFLECTION: MemoryTypeMetadata(
                type=MemoryType.REFLECTION,
                default_categories=[MemoryCategory.REFLECTIONS_INSIGHTS],
                default_subcategories=[MemorySubcategory.PERSONAL_DEVELOPMENT],
                typical_privacy_level=PrivacyLevel.PRIVATE,
                default_importance_range=(55, 80),
                decay_half_life_days=90,
                description="Personal reflections and insights"
            ),
            MemoryType.ACHIEVEMENT: MemoryTypeMetadata(
                type=MemoryType.ACHIEVEMENT,
                default_categories=[MemoryCategory.MILESTONES_ACHIEVEMENTS],
                default_subcategories=[MemorySubcategory.PERSONAL_DEVELOPMENT, MemorySubcategory.CAREER_OBJECTIVES],
                typical_privacy_level=PrivacyLevel.NORMAL,
                default_importance_range=(80, 100),
                decay_half_life_days=365,
                description="Accomplishments and milestones"
            ),
            MemoryType.SKILL: MemoryTypeMetadata(
                type=MemoryType.SKILL,
                default_categories=[MemoryCategory.LEARNING_EDUCATION],
                default_subcategories=[MemorySubcategory.TECHNICAL_SKILLS, MemorySubcategory.SKILLS_COMPETENCIES],
                typical_privacy_level=PrivacyLevel.NORMAL,
                default_importance_range=(65, 85),
                decay_half_life_days=180,
                description="Skills and competencies"
            ),
            MemoryType.RELATIONSHIP: MemoryTypeMetadata(
                type=MemoryType.RELATIONSHIP,
                default_categories=[MemoryCategory.RELATIONSHIPS],
                default_subcategories=[MemorySubcategory.PERSONALITY_TRAITS, MemorySubcategory.COMMUNICATION_STYLE],
                typical_privacy_level=PrivacyLevel.PRIVATE,
                default_importance_range=(70, 90),
                decay_half_life_days=180,
                description="Information about relationships with others"
            )
        }
        
        # Add default metadata for legacy types
        for memory_type in MemoryType:
            if memory_type not in self.type_metadata:
                self.type_metadata[memory_type] = MemoryTypeMetadata(
                    type=memory_type,
                    default_categories=[MemoryCategory.PERSONAL_INFO],
                    default_subcategories=[MemorySubcategory.BASIC_DETAILS],
                    typical_privacy_level=PrivacyLevel.NORMAL,
                    default_importance_range=(40, 70),
                    decay_half_life_days=60,
                    description=f"General {memory_type.value} type memory"
                )

    def get_metadata(self, memory_type: MemoryType) -> MemoryTypeMetadata:
        """Get metadata for a memory type"""
        return self.type_metadata.get(memory_type, self.type_metadata[MemoryType.FACT])

    def get_compatible_types(self, memory_type: MemoryType) -> Set[MemoryType]:
        """Get memory types that are compatible for relationships"""
        compatibility_map = {
            MemoryType.GOAL: {MemoryType.HABIT, MemoryType.ACHIEVEMENT, MemoryType.LEARNING, MemoryType.SKILL},
            MemoryType.HABIT: {MemoryType.GOAL, MemoryType.ROUTINE, MemoryType.HEALTH_FITNESS},
            MemoryType.LEARNING: {MemoryType.SKILL, MemoryType.GOAL, MemoryType.ACHIEVEMENT},
            MemoryType.SKILL: {MemoryType.LEARNING, MemoryType.WORK_CAREER, MemoryType.ACHIEVEMENT},
            MemoryType.DECISION: {MemoryType.GOAL, MemoryType.REFLECTION, MemoryType.PLANNING},
            MemoryType.REFLECTION: {MemoryType.DECISION, MemoryType.EMOTIONAL_STATE, MemoryType.LEARNING},
            MemoryType.ACHIEVEMENT: {MemoryType.GOAL, MemoryType.SKILL, MemoryType.LEARNING, MemoryType.MILESTONE},
        }
        
        return compatibility_map.get(memory_type, set())

    def suggest_categories(self, content: str, memory_type: MemoryType) -> List[MemoryCategory]:
        """Suggest categories based on content and type"""
        metadata = self.get_metadata(memory_type)
        suggested = list(metadata.default_categories)
        
        content_lower = content.lower()
        
        # Content-based suggestions
        category_keywords = {
            MemoryCategory.WORK_CAREER: ["work", "job", "career", "project", "meeting", "colleague"],
            MemoryCategory.HEALTH_FITNESS: ["health", "fitness", "exercise", "diet", "sleep", "medical"],
            MemoryCategory.LEARNING_EDUCATION: ["learn", "study", "course", "skill", "training", "education"],
            MemoryCategory.RELATIONSHIPS: ["friend", "family", "partner", "relationship", "social"],
            MemoryCategory.TRAVEL_EXPERIENCES: ["travel", "trip", "vacation", "flight", "hotel"],
            MemoryCategory.ENTERTAINMENT_LEISURE: ["movie", "music", "game", "hobby", "fun", "entertainment"],
        }
        
        for category, keywords in category_keywords.items():
            if any(keyword in content_lower for keyword in keywords):
                if category not in suggested:
                    suggested.append(category)
        
        return suggested[:3]  # Limit to top 3


# Global registry instance
memory_type_registry = MemoryTypeRegistry()
