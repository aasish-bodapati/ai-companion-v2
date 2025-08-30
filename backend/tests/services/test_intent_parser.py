"""Tests for IntentParser service."""

import pytest
from unittest.mock import patch
from datetime import datetime

from app.services.intent_parser import IntentParser, intent_parser


class TestIntentParser:
    """Test cases for IntentParser class."""

    @pytest.fixture
    def parser(self):
        """Create IntentParser instance for testing."""
        return IntentParser()

    def test_init(self, parser):
        """Test IntentParser initialization."""
        assert parser.exercise_patterns is not None
        assert parser.food_patterns is not None
        assert "bench press" in parser.exercise_patterns
        assert "breakfast" in parser.food_patterns

    def test_parse_fitness_intent_goal_creation(self, parser):
        """Test parsing fitness goal creation."""
        test_cases = [
            "my goal is to bench press 100kg",
            "i want to run a marathon",
            "goal: lose 10 pounds",
            "target: build muscle mass"
        ]
        
        for text in test_cases:
            result = parser.parse_fitness_intent(text)
            assert result is not None
            assert result["action"] == "fitness.create_goal"
            assert "params" in result
            assert "name" in result["params"]

    def test_parse_fitness_intent_workout_logging(self, parser):
        """Test parsing workout logging."""
        text = "I did 3 sets of bench press at 50kg"
        
        result = parser.parse_fitness_intent(text)
        
        assert result is not None
        assert result["action"] == "fitness.log_workout"
        assert "exercises" in result["params"]
        assert len(result["params"]["exercises"]) > 0

    def test_parse_fitness_intent_no_match(self, parser):
        """Test parsing fitness intent with no match."""
        result = parser.parse_fitness_intent("The weather is nice today")
        assert result is None

    def test_parse_nutrition_intent_meal_logging(self, parser):
        """Test parsing meal logging."""
        test_cases = [
            "i ate pizza for lunch",
            "had salad for dinner",
            "breakfast: eggs and toast",
            "my lunch was a sandwich"
        ]
        
        for text in test_cases:
            result = parser.parse_nutrition_intent(text)
            assert result is not None
            assert result["action"] == "nutrition.log_meal"
            assert "description" in result["params"]
            assert "meal_type" in result["params"]

    def test_parse_nutrition_intent_simple_ate(self, parser):
        """Test parsing simple 'I ate' statements."""
        result = parser.parse_nutrition_intent("i ate a burger")
        
        assert result is not None
        assert result["action"] == "nutrition.log_meal"
        assert "burger" in result["params"]["description"]

    def test_parse_nutrition_intent_no_match(self, parser):
        """Test parsing nutrition intent with no match."""
        result = parser.parse_nutrition_intent("I went for a walk")
        assert result is None

    def test_parse_hydration_intent_ml(self, parser):
        """Test parsing hydration with milliliters."""
        result = parser.parse_hydration_intent("drank 500ml of water")
        
        assert result is not None
        assert result["action"] == "hydration.log_water"
        assert result["params"]["amount_ml"] == 500.0

    def test_parse_hydration_intent_cups(self, parser):
        """Test parsing hydration with cups."""
        result = parser.parse_hydration_intent("had 2 cups of water")
        
        assert result is not None
        assert result["action"] == "hydration.log_water"
        assert result["params"]["amount_ml"] == 480.0  # 2 * 240ml

    def test_parse_hydration_intent_liters(self, parser):
        """Test parsing hydration with liters."""
        result = parser.parse_hydration_intent("drank 1.5 liters water")
        
        assert result is not None
        assert result["action"] == "hydration.log_water"
        assert result["params"]["amount_ml"] == 1500.0

    def test_parse_hydration_intent_no_match(self, parser):
        """Test parsing hydration intent with no match."""
        result = parser.parse_hydration_intent("I'm feeling thirsty")
        assert result is None

    def test_parse_mood_intent_feeling(self, parser):
        """Test parsing mood with 'feeling' keyword."""
        result = parser.parse_mood_intent("feeling happy")
        
        assert result is not None
        assert result["action"] == "mood.log_checkin"
        assert result["params"]["mood_score"] == 7  # happy = 7

    def test_parse_mood_intent_numeric(self, parser):
        """Test parsing mood with numeric score."""
        result = parser.parse_mood_intent("mood: 8/10")
        
        assert result is not None
        assert result["action"] == "mood.log_checkin"
        assert result["params"]["mood_score"] == 8

    def test_parse_mood_intent_i_feel(self, parser):
        """Test parsing mood with 'I feel' pattern."""
        result = parser.parse_mood_intent("i feel great")
        
        assert result is not None
        assert result["action"] == "mood.log_checkin"
        assert result["params"]["mood_score"] == 7  # great = 7

    def test_parse_mood_intent_no_match(self, parser):
        """Test parsing mood intent with no match."""
        result = parser.parse_mood_intent("The weather affects my mood")
        assert result is None

    def test_parse_any_intent_hydration(self, parser):
        """Test parsing any intent - hydration match."""
        result = parser.parse_any_intent("drank 300ml water")
        
        assert result is not None
        assert result["action"] == "hydration.log_water"

    def test_parse_any_intent_mood(self, parser):
        """Test parsing any intent - mood match."""
        result = parser.parse_any_intent("feeling excited")
        
        assert result is not None
        assert result["action"] == "mood.log_checkin"

    def test_parse_any_intent_no_match(self, parser):
        """Test parsing any intent with no match."""
        result = parser.parse_any_intent("Just a regular message")
        assert result is None

    def test_parse_workout_log_sets_and_weight(self, parser):
        """Test parsing workout with sets and weight."""
        text = "i did 5 sets of squat at 80kg"
        result = parser._parse_workout_log(text)
        
        assert result is not None
        assert result["action"] == "fitness.log_workout"
        exercises = result["params"]["exercises"]
        assert len(exercises) == 1
        assert exercises[0]["name"] == "squat"
        assert exercises[0]["sets"] == 5
        assert exercises[0]["weight_kg"] == 80.0

    def test_parse_workout_log_simple_pattern(self, parser):
        """Test parsing workout with simple pattern."""
        text = "i benched 60kg"
        result = parser._parse_workout_log(text)
        
        assert result is not None
        exercises = result["params"]["exercises"]
        assert len(exercises) == 1
        assert exercises[0]["name"] == "bench press"
        assert exercises[0]["weight_kg"] == 60.0

    def test_parse_workout_log_cardio(self, parser):
        """Test parsing cardio workout."""
        text = "i ran 5k in 30 minutes"
        result = parser._parse_workout_log(text)
        
        assert result is not None
        exercises = result["params"]["exercises"]
        assert len(exercises) == 1
        assert exercises[0]["name"] == "ran"
        assert exercises[0]["distance_km"] == 5.0
        assert exercises[0]["duration_min"] == 30

    def test_parse_workout_log_pounds_to_kg(self, parser):
        """Test parsing workout with pounds conversion."""
        text = "i did 3 sets of deadlift at 100 lbs"
        result = parser._parse_workout_log(text)
        
        assert result is not None
        exercises = result["params"]["exercises"]
        assert len(exercises) == 1
        assert exercises[0]["weight_kg"] == pytest.approx(45.36, rel=1e-2)

    def test_normalize_exercise_name_known(self, parser):
        """Test normalizing known exercise names."""
        assert parser._normalize_exercise_name("bench") == "bench press"
        assert parser._normalize_exercise_name("squats") == "squat"
        assert parser._normalize_exercise_name("dl") == "deadlift"

    def test_normalize_exercise_name_unknown(self, parser):
        """Test normalizing unknown exercise names."""
        result = parser._normalize_exercise_name("unknown exercise")
        assert result == "Unknown Exercise"  # Title case

    def test_detect_goal_category_strength(self, parser):
        """Test detecting strength goal category."""
        assert parser._detect_goal_category("bench press 100kg") == "strength"
        assert parser._detect_goal_category("get stronger") == "strength"

    def test_detect_goal_category_cardio(self, parser):
        """Test detecting cardio goal category."""
        assert parser._detect_goal_category("run a marathon") == "cardio"
        assert parser._detect_goal_category("improve endurance") == "cardio"

    def test_detect_goal_category_weight_loss(self, parser):
        """Test detecting weight loss goal category."""
        assert parser._detect_goal_category("lose 10 pounds") == "weight_loss"
        assert parser._detect_goal_category("burn fat") == "weight_loss"

    def test_detect_goal_category_muscle_gain(self, parser):
        """Test detecting muscle gain goal category."""
        assert parser._detect_goal_category("gain muscle") == "muscle_gain"
        assert parser._detect_goal_category("bulk up") == "muscle_gain"

    def test_detect_goal_category_flexibility(self, parser):
        """Test detecting flexibility goal category."""
        assert parser._detect_goal_category("become more flexible") == "flexibility"
        assert parser._detect_goal_category("improve yoga") == "flexibility"

    def test_detect_goal_category_default(self, parser):
        """Test default goal category."""
        assert parser._detect_goal_category("random goal") == "strength"

    def test_detect_meal_type_morning(self, parser):
        """Test detecting meal type in morning."""
        with patch('app.services.intent_parser.datetime') as mock_datetime:
            mock_datetime.now.return_value.hour = 9
            result = parser._detect_meal_type("some text")
            assert result == "breakfast"

    def test_detect_meal_type_afternoon(self, parser):
        """Test detecting meal type in afternoon."""
        with patch('app.services.intent_parser.datetime') as mock_datetime:
            mock_datetime.now.return_value.hour = 14
            result = parser._detect_meal_type("some text")
            assert result == "lunch"

    def test_detect_meal_type_evening(self, parser):
        """Test detecting meal type in evening."""
        with patch('app.services.intent_parser.datetime') as mock_datetime:
            mock_datetime.now.return_value.hour = 19
            result = parser._detect_meal_type("some text")
            assert result == "dinner"

    def test_detect_meal_type_late_night(self, parser):
        """Test detecting meal type late at night."""
        with patch('app.services.intent_parser.datetime') as mock_datetime:
            mock_datetime.now.return_value.hour = 23
            result = parser._detect_meal_type("some text")
            assert result == "snack"

    def test_text_to_mood_score_direct_number(self, parser):
        """Test converting direct number to mood score."""
        assert parser._text_to_mood_score("7") == 7
        assert parser._text_to_mood_score("10") == 10
        assert parser._text_to_mood_score("0") is None  # Out of range
        assert parser._text_to_mood_score("11") is None  # Out of range

    def test_text_to_mood_score_with_slash(self, parser):
        """Test converting number with slash to mood score."""
        assert parser._text_to_mood_score("8/10") == 8
        assert parser._text_to_mood_score("5/10") == 5
        assert parser._text_to_mood_score("invalid/10") is None

    def test_text_to_mood_score_text_mapping(self, parser):
        """Test converting mood text to score."""
        assert parser._text_to_mood_score("terrible") == 1
        assert parser._text_to_mood_score("bad") == 2
        assert parser._text_to_mood_score("okay") == 4
        assert parser._text_to_mood_score("good") == 6
        assert parser._text_to_mood_score("great") == 7
        assert parser._text_to_mood_score("amazing") == 8
        assert parser._text_to_mood_score("perfect") == 10

    def test_text_to_mood_score_unknown(self, parser):
        """Test converting unknown mood text."""
        assert parser._text_to_mood_score("unknown_mood") is None

    def test_global_instance(self):
        """Test that the global instance is properly configured."""
        assert isinstance(intent_parser, IntentParser)
