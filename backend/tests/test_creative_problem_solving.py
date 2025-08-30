"""
Tests for Creative Problem Solving Engine
"""

import pytest
import asyncio
from datetime import datetime
from app.services.creative_problem_solving import (
    CreativeProblemSolvingEngine,
    CreativeThinkingMethod,
    ProblemType,
    CreativeSolution,
    ProblemContext,
    CreativeSession
)


class TestCreativeProblemSolvingEngine:
    """Test suite for Creative Problem Solving Engine."""
    
    @pytest.fixture
    def engine(self):
        """Create engine instance."""
        return CreativeProblemSolvingEngine()
    
    @pytest.fixture
    def sample_problem_context(self):
        """Sample problem context."""
        return {
            "user_id": "test_user",
            "constraints": ["limited budget", "tight deadline"],
            "resources": ["team of 3", "existing codebase"],
            "priority": "high"
        }
    
    @pytest.mark.asyncio
    async def test_solve_problem_creatively_basic(self, engine, sample_problem_context):
        """Test basic creative problem solving."""
        problem = "How can I improve team productivity?"
        
        session = await engine.solve_problem_creatively(
            problem_statement=problem,
            problem_type="business",
            context=sample_problem_context
        )
        
        assert isinstance(session, CreativeSession)
        assert len(session.solutions) > 0
        assert session.confidence_score > 0
        assert len(session.methods_used) > 0
    
    @pytest.mark.asyncio
    async def test_lateral_thinking_method(self, engine):
        """Test lateral thinking method specifically."""
        problem = "Our software deployment process is too slow"
        
        session = await engine.solve_problem_creatively(
            problem_statement=problem,
            problem_type="technical"
        )
        
        # Should include lateral thinking solutions
        lateral_solutions = [s for s in session.solutions 
                           if s.method_used == CreativeThinkingMethod.LATERAL_THINKING]
        assert len(lateral_solutions) > 0
        
        # Lateral thinking should be creative
        for solution in lateral_solutions:
            assert solution.creativity_score > 0.7
    
    @pytest.mark.asyncio
    async def test_brainstorming_method(self, engine):
        """Test brainstorming method."""
        problem = "How to increase user engagement?"
        
        session = await engine.solve_problem_creatively(
            problem_statement=problem,
            problem_type="business"
        )
        
        # Should include brainstorming solutions
        brainstorm_solutions = [s for s in session.solutions 
                              if s.method_used == CreativeThinkingMethod.BRAINSTORMING]
        assert len(brainstorm_solutions) > 0
        
        # Brainstorming should be feasible
        for solution in brainstorm_solutions:
            assert solution.feasibility_score > 0.5
    
    @pytest.mark.asyncio
    async def test_analogical_reasoning_method(self, engine):
        """Test analogical reasoning method."""
        problem = "How to organize a complex project?"
        
        session = await engine.solve_problem_creatively(
            problem_statement=problem,
            problem_type="business"
        )
        
        # Should include analogical reasoning solutions
        analogical_solutions = [s for s in session.solutions 
                              if s.method_used == CreativeThinkingMethod.ANALOGICAL_REASONING]
        assert len(analogical_solutions) > 0
        
        # Should reference domain analogies
        for solution in analogical_solutions:
            assert solution.reasoning
            assert "analogy" in solution.reasoning.lower() or any(
                domain in solution.reasoning.lower() 
                for domain in ["nature", "sports", "music", "cooking", "architecture", "games"]
            )
    
    @pytest.mark.asyncio
    async def test_scamper_method(self, engine):
        """Test SCAMPER method."""
        problem = "Improve our mobile app interface"
        
        session = await engine.solve_problem_creatively(
            problem_statement=problem,
            problem_type="creative"
        )
        
        # Should include SCAMPER solutions
        scamper_solutions = [s for s in session.solutions 
                           if s.method_used == CreativeThinkingMethod.SCAMPER]
        assert len(scamper_solutions) > 0
        
        # Should use SCAMPER techniques
        scamper_techniques = ["substitute", "combine", "adapt", "modify", "eliminate", "reverse"]
        for solution in scamper_solutions:
            assert any(technique in solution.reasoning.lower() for technique in scamper_techniques)
    
    @pytest.mark.asyncio
    async def test_six_thinking_hats_method(self, engine):
        """Test Six Thinking Hats method."""
        problem = "Plan a new product launch"
        
        session = await engine.solve_problem_creatively(
            problem_statement=problem,
            problem_type="business"
        )
        
        # Should include Six Thinking Hats solutions
        hat_solutions = [s for s in session.solutions 
                        if s.method_used == CreativeThinkingMethod.SIX_THINKING_HATS]
        assert len(hat_solutions) > 0
        
        # Should reference thinking hat perspectives
        hat_colors = ["white", "red", "black", "yellow", "green", "blue"]
        for solution in hat_solutions:
            assert any(color in solution.reasoning.lower() for color in hat_colors)
    
    @pytest.mark.asyncio
    async def test_random_stimulation_method(self, engine):
        """Test random stimulation method."""
        problem = "Create a unique marketing campaign"
        
        session = await engine.solve_problem_creatively(
            problem_statement=problem,
            problem_type="creative"
        )
        
        # Should include random stimulation solutions
        random_solutions = [s for s in session.solutions 
                          if s.method_used == CreativeThinkingMethod.RANDOM_STIMULATION]
        assert len(random_solutions) > 0
        
        # Should be highly creative
        for solution in random_solutions:
            assert solution.creativity_score > 0.8
    
    @pytest.mark.asyncio
    async def test_problem_type_inference(self, engine):
        """Test automatic problem type inference."""
        # Technical problem
        tech_problem = "Our API is returning 500 errors"
        tech_session = await engine.solve_problem_creatively(tech_problem)
        
        # Should infer technical problem type
        assert tech_session.problem_context.problem_type in [ProblemType.TECHNICAL, ProblemType.PERSONAL]
        
        # Business problem
        business_problem = "Our sales are declining this quarter"
        business_session = await engine.solve_problem_creatively(business_problem)
        
        # Should infer business problem type
        assert business_session.problem_context.problem_type in [ProblemType.BUSINESS, ProblemType.PERSONAL]
    
    @pytest.mark.asyncio
    async def test_solution_evaluation_and_ranking(self, engine):
        """Test solution evaluation and ranking."""
        problem = "Reduce customer support tickets"
        
        session = await engine.solve_problem_creatively(
            problem_statement=problem,
            problem_type="business",
            constraints=["limited resources"],
            context={"priority": "high", "time_frame": "3 months"}
        )
        
        # Solutions should be ranked
        assert len(session.solutions) > 1
        
        # First solution should be the recommended one
        if session.recommended_solution:
            assert session.recommended_solution == session.solutions[0]
        
        # Solutions should have proper scoring
        for solution in session.solutions:
            assert 0 <= solution.creativity_score <= 1
            assert 0 <= solution.feasibility_score <= 1
            assert 0 <= solution.originality_score <= 1
            assert 0 <= solution.context_relevance <= 1
    
    @pytest.mark.asyncio
    async def test_implementation_steps_generation(self, engine):
        """Test implementation steps generation."""
        problem = "Implement a new feature in our software"
        
        session = await engine.solve_problem_creatively(
            problem_statement=problem,
            problem_type="technical"
        )
        
        for solution in session.solutions:
            assert len(solution.implementation_steps) > 0
            # Steps should be actionable
            for step in solution.implementation_steps:
                assert len(step.strip()) > 0
                assert not step.startswith("TODO")  # Should be concrete steps
    
    @pytest.mark.asyncio
    async def test_challenge_identification(self, engine):
        """Test potential challenge identification."""
        problem = "Launch a startup with no funding"
        
        session = await engine.solve_problem_creatively(
            problem_statement=problem,
            problem_type="business"
        )
        
        for solution in session.solutions:
            assert len(solution.potential_challenges) > 0
            # Should identify realistic challenges
            challenges_text = " ".join(solution.potential_challenges).lower()
            assert any(word in challenges_text for word in 
                      ["resource", "time", "cost", "risk", "stakeholder", "constraint"])
    
    @pytest.mark.asyncio
    async def test_success_indicators_definition(self, engine):
        """Test success indicators definition."""
        problem = "Improve team communication"
        
        session = await engine.solve_problem_creatively(
            problem_statement=problem,
            problem_type="relationship"
        )
        
        for solution in session.solutions:
            assert len(solution.success_indicators) > 0
            # Should define measurable indicators
            indicators_text = " ".join(solution.success_indicators).lower()
            assert any(word in indicators_text for word in 
                      ["improve", "increase", "decrease", "better", "success", "achieve"])
    
    @pytest.mark.asyncio
    async def test_solution_refinement(self, engine):
        """Test solution refinement based on feedback."""
        problem = "Optimize database performance"
        
        session = await engine.solve_problem_creatively(
            problem_statement=problem,
            problem_type="technical"
        )
        
        original_solution = session.solutions[0]
        
        # Refine solution based on feedback
        refined_solution = await engine.refine_solution(
            solution=original_solution,
            feedback="This needs to be more cost-effective",
            additional_constraints=["minimal budget impact"]
        )
        
        assert refined_solution.solution_text != original_solution.solution_text
        assert "cost" in refined_solution.solution_text.lower() or "budget" in refined_solution.solution_text.lower()
        assert refined_solution.feasibility_score >= original_solution.feasibility_score * 0.9
    
    @pytest.mark.asyncio
    async def test_get_solution_details(self, engine):
        """Test getting detailed solution information."""
        problem = "Create a better onboarding process"
        
        session = await engine.solve_problem_creatively(
            problem_statement=problem,
            problem_type="business"
        )
        
        solution = session.solutions[0]
        details = await engine.get_solution_details(solution)
        
        assert "solution_text" in details
        assert "method_used" in details
        assert "scores" in details
        assert "reasoning" in details
        assert "implementation" in details
        
        assert "steps" in details["implementation"]
        assert "challenges" in details["implementation"]
        assert "success_indicators" in details["implementation"]
    
    @pytest.mark.asyncio
    async def test_user_preferences_integration(self, engine):
        """Test integration of user preferences."""
        problem = "Design a new user interface"
        user_preferences = {"preferred_method": "brainstorming"}
        
        session = await engine.solve_problem_creatively(
            problem_statement=problem,
            problem_type="creative",
            user_preferences=user_preferences
        )
        
        # Should prioritize brainstorming method
        if session.recommended_solution:
            # Either the recommended solution uses brainstorming or it's highly ranked
            brainstorm_solutions = [s for s in session.solutions 
                                  if s.method_used == CreativeThinkingMethod.BRAINSTORMING]
            if brainstorm_solutions:
                assert session.recommended_solution in brainstorm_solutions
    
    @pytest.mark.asyncio
    async def test_context_adaptation(self, engine):
        """Test adaptation to different contexts."""
        problem = "Improve team performance"
        
        # High priority context
        high_priority_session = await engine.solve_problem_creatively(
            problem_statement=problem,
            problem_type="business",
            context={"priority": "high", "time_frame": "urgent"}
        )
        
        # Low priority context
        low_priority_session = await engine.solve_problem_creatively(
            problem_statement=problem,
            problem_type="business",
            context={"priority": "low", "time_frame": "6 months"}
        )
        
        # High priority should favor feasible solutions
        high_priority_avg_feasibility = sum(s.feasibility_score for s in high_priority_session.solutions) / len(high_priority_session.solutions)
        low_priority_avg_feasibility = sum(s.feasibility_score for s in low_priority_session.solutions) / len(low_priority_session.solutions)
        
        # High priority should generally have higher feasibility focus
        assert high_priority_avg_feasibility >= low_priority_avg_feasibility * 0.9
    
    @pytest.mark.asyncio
    async def test_confidence_scoring_accuracy(self, engine):
        """Test accuracy of confidence scoring."""
        # Well-defined problem should have higher confidence
        clear_problem = "Reduce page load time from 5 seconds to 2 seconds"
        clear_session = await engine.solve_problem_creatively(
            problem_statement=clear_problem,
            problem_type="technical"
        )
        
        # Vague problem should have lower confidence
        vague_problem = "Make things better"
        vague_session = await engine.solve_problem_creatively(
            problem_statement=vague_problem
        )
        
        # Clear problem should generally have higher confidence
        assert clear_session.confidence_score >= vague_session.confidence_score * 0.8
    
    def test_creative_solution_creation(self, engine):
        """Test creative solution object creation."""
        solution = CreativeSolution(
            solution_text="Implement agile methodology",
            method_used=CreativeThinkingMethod.BRAINSTORMING,
            creativity_score=0.7,
            feasibility_score=0.8,
            originality_score=0.6,
            context_relevance=0.9,
            reasoning="Generated through brainstorming session",
            implementation_steps=["Step 1", "Step 2"],
            potential_challenges=["Challenge 1"],
            success_indicators=["Indicator 1"]
        )
        
        assert solution.method_used == CreativeThinkingMethod.BRAINSTORMING
        assert solution.creativity_score == 0.7
        assert len(solution.implementation_steps) == 2
    
    def test_problem_context_creation(self, engine):
        """Test problem context object creation."""
        context = ProblemContext(
            problem_statement="Test problem",
            problem_type=ProblemType.TECHNICAL,
            constraints=["time", "budget"],
            resources_available=["team", "tools"],
            time_frame="2 weeks",
            priority_level="high",
            stakeholders=["manager", "team"],
            success_criteria=["criterion1", "criterion2"]
        )
        
        assert context.problem_type == ProblemType.TECHNICAL
        assert len(context.constraints) == 2
        assert context.priority_level == "high"
    
    @pytest.mark.asyncio
    async def test_error_handling(self, engine):
        """Test error handling with invalid inputs."""
        # Empty problem statement
        session = await engine.solve_problem_creatively(
            problem_statement=""
        )
        assert session is not None
        
        # Invalid problem type should be handled gracefully
        session = await engine.solve_problem_creatively(
            problem_statement="Test problem",
            problem_type="invalid_type"
        )
        assert session is not None


# Integration tests
class TestCreativeProblemSolvingIntegration:
    """Integration tests for creative problem solving."""
    
    @pytest.fixture
    def engine(self):
        return CreativeProblemSolvingEngine()
    
    @pytest.mark.asyncio
    async def test_realistic_business_problem(self, engine):
        """Test solving a realistic business problem."""
        problem = """
        Our e-commerce website has a 70% cart abandonment rate. 
        Customers add items to their cart but don't complete the purchase. 
        We need to reduce this rate to improve revenue.
        """
        
        session = await engine.solve_problem_creatively(
            problem_statement=problem,
            problem_type="business",
            constraints=["limited development resources", "must maintain current UX"],
            context={
                "priority": "high",
                "time_frame": "3 months",
                "success_criteria": ["reduce abandonment to 50%", "increase conversion"]
            }
        )
        
        assert len(session.solutions) >= 5  # Should generate multiple solutions
        assert session.confidence_score > 0.6
        
        # Should include varied approaches
        methods_used = [s.method_used for s in session.solutions]
        assert len(set(methods_used)) >= 3  # At least 3 different methods
        
        # Solutions should be relevant to cart abandonment
        solution_texts = " ".join([s.solution_text for s in session.solutions]).lower()
        assert any(word in solution_texts for word in 
                  ["cart", "checkout", "payment", "user", "experience", "friction"])
    
    @pytest.mark.asyncio
    async def test_realistic_technical_problem(self, engine):
        """Test solving a realistic technical problem."""
        problem = """
        Our microservices architecture has become too complex to manage. 
        We have 50+ services, deployment is slow, and debugging is difficult. 
        How can we simplify without losing functionality?
        """
        
        session = await engine.solve_problem_creatively(
            problem_statement=problem,
            problem_type="technical",
            context={
                "constraints": ["maintain existing functionality", "gradual migration only"],
                "resources": ["DevOps team", "existing infrastructure"],
                "stakeholders": ["engineering team", "product managers"]
            }
        )
        
        assert len(session.solutions) >= 4
        
        # Should address microservices complexity
        solution_texts = " ".join([s.solution_text for s in session.solutions]).lower()
        assert any(word in solution_texts for word in 
                  ["service", "architect", "consolidat", "refactor", "deploy", "monitor"])
        
        # Should provide implementation guidance
        for solution in session.solutions[:3]:  # Check top 3 solutions
            assert len(solution.implementation_steps) >= 3
            assert len(solution.potential_challenges) >= 2
    
    @pytest.mark.asyncio
    async def test_realistic_personal_problem(self, engine):
        """Test solving a realistic personal problem."""
        problem = """
        I'm overwhelmed with work-life balance. I work 60+ hours per week, 
        barely see my family, and feel constantly stressed. I want to be 
        more present for my family while still advancing my career.
        """
        
        session = await engine.solve_problem_creatively(
            problem_statement=problem,
            problem_type="personal",
            context={
                "priority": "high",
                "constraints": ["can't change jobs immediately", "financial responsibilities"],
                "time_frame": "need improvement soon"
            }
        )
        
        assert len(session.solutions) >= 4
        
        # Should address work-life balance
        solution_texts = " ".join([s.solution_text for s in session.solutions]).lower()
        assert any(word in solution_texts for word in 
                  ["time", "boundary", "priorit", "family", "work", "balance", "stress"])
        
        # Should be practical and empathetic
        for solution in session.solutions:
            assert solution.feasibility_score > 0.4  # Should be reasonably feasible
            assert solution.context_relevance > 0.5   # Should be relevant
