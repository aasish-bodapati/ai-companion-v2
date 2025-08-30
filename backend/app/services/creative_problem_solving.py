"""
Creative Problem Solving Engine

This service provides advanced creative thinking capabilities for generating
innovative solutions to user challenges. It implements lateral thinking,
brainstorming techniques, and creative solution generation patterns.
"""

import logging
import re
import random
from typing import Dict, List, Optional, Tuple, Any, Set
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class CreativeThinkingMethod(Enum):
    """Types of creative thinking methods."""
    LATERAL_THINKING = "lateral_thinking"
    BRAINSTORMING = "brainstorming"
    ANALOGICAL_REASONING = "analogical_reasoning"
    RANDOM_STIMULATION = "random_stimulation"
    SCAMPER = "scamper"
    SIX_THINKING_HATS = "six_thinking_hats"
    MORPHOLOGICAL_ANALYSIS = "morphological_analysis"


class ProblemType(Enum):
    """Types of problems that can be solved creatively."""
    TECHNICAL = "technical"
    PERSONAL = "personal"
    BUSINESS = "business"
    CREATIVE = "creative"
    RELATIONSHIP = "relationship"
    EDUCATIONAL = "educational"
    LIFESTYLE = "lifestyle"


@dataclass
class CreativeSolution:
    """A creative solution to a problem."""
    solution_text: str
    method_used: CreativeThinkingMethod
    creativity_score: float
    feasibility_score: float
    originality_score: float
    context_relevance: float
    reasoning: str
    implementation_steps: List[str]
    potential_challenges: List[str]
    success_indicators: List[str]


@dataclass
class ProblemContext:
    """Context information about a problem."""
    problem_statement: str
    problem_type: ProblemType
    constraints: List[str]
    resources_available: List[str]
    time_frame: Optional[str]
    priority_level: str
    stakeholders: List[str]
    success_criteria: List[str]


@dataclass
class CreativeSession:
    """A complete creative problem-solving session."""
    problem_context: ProblemContext
    solutions: List[CreativeSolution]
    methods_used: List[CreativeThinkingMethod]
    session_duration: float
    confidence_score: float
    recommended_solution: Optional[CreativeSolution]


class CreativeProblemSolvingEngine:
    """
    Advanced engine for creative problem solving and innovative solution generation.
    
    This engine provides multiple creative thinking frameworks:
    - Lateral thinking techniques
    - Brainstorming and ideation
    - Analogical reasoning
    - SCAMPER method
    - Six Thinking Hats
    - Random stimulation
    """
    
    def __init__(self):
        # Creative thinking patterns and templates
        self.lateral_thinking_patterns = {
            "reverse_assumption": [
                "What if we did the opposite of what's expected?",
                "What assumptions can we challenge here?",
                "How would this work if we reversed the process?"
            ],
            "random_entry": [
                "How can we incorporate elements from a completely different domain?",
                "What if we applied principles from nature/art/sports to this?",
                "How would a child/artist/scientist approach this?"
            ],
            "provocation": [
                "What if this limitation didn't exist?",
                "Po: What if we had unlimited resources?",
                "What if we started from the end goal and worked backwards?"
            ]
        }
        
        self.analogical_domains = {
            "nature": ["ecosystem", "evolution", "adaptation", "symbiosis", "migration"],
            "sports": ["teamwork", "strategy", "training", "competition", "endurance"],
            "music": ["harmony", "rhythm", "improvisation", "composition", "resonance"],
            "cooking": ["recipe", "ingredients", "timing", "flavor", "presentation"],
            "architecture": ["foundation", "structure", "flow", "aesthetics", "function"],
            "games": ["rules", "strategy", "cooperation", "challenge", "reward"]
        }
        
        self.scamper_prompts = {
            "substitute": "What can be substituted? Who else? What else?",
            "combine": "What can be combined? How about blending purposes or ideas?",
            "adapt": "What can be adapted? What else is like this? What could you copy?",
            "modify": "What can be modified? What can be emphasized or minimized?",
            "put_to_other_uses": "What else can this be used for? How would others use this?",
            "eliminate": "What can be removed? What's not necessary? How can you simplify?",
            "reverse": "What can be reversed? What if you changed the order or sequence?"
        }
        
        self.six_hats_perspectives = {
            "white": "Facts and information - What do we know? What do we need to know?",
            "red": "Emotions and feelings - How do we feel about this? What are our instincts?",
            "black": "Critical thinking - What are the risks? What could go wrong?",
            "yellow": "Positive thinking - What are the benefits? What's the best case scenario?",
            "green": "Creative thinking - What are new ideas? What alternatives exist?",
            "blue": "Process thinking - How should we approach this? What's our strategy?"
        }
        
        # Solution evaluation criteria
        self.evaluation_criteria = {
            "creativity": ["originality", "innovation", "uniqueness"],
            "feasibility": ["practicality", "resources_needed", "time_required"],
            "impact": ["effectiveness", "scope", "potential_results"],
            "risk": ["uncertainty", "potential_downsides", "failure_modes"]
        }

    async def solve_problem_creatively(
        self,
        problem_statement: str,
        problem_type: Optional[str] = None,
        constraints: Optional[List[str]] = None,
        context: Optional[Dict[str, Any]] = None,
        user_preferences: Optional[Dict[str, Any]] = None
    ) -> CreativeSession:
        """
        Generate creative solutions for a given problem using multiple thinking methods.
        
        Args:
            problem_statement: The problem to solve
            problem_type: Type of problem (technical, personal, etc.)
            constraints: Any constraints or limitations
            context: Additional context about the problem
            user_preferences: User's preferences for solution types
            
        Returns:
            CreativeSession with multiple creative solutions
        """
        logger.info(f"Starting creative problem solving for: {problem_statement[:100]}...")
        
        # Parse problem context
        problem_context = self._parse_problem_context(
            problem_statement, problem_type, constraints, context
        )
        
        # Generate solutions using different creative methods
        solutions = []
        methods_used = []
        
        # Apply multiple creative thinking methods
        for method in CreativeThinkingMethod:
            try:
                method_solutions = await self._apply_creative_method(
                    method, problem_context, user_preferences
                )
                solutions.extend(method_solutions)
                methods_used.append(method)
            except Exception as e:
                logger.warning(f"Failed to apply method {method}: {e}")
        
        # Evaluate and rank solutions
        evaluated_solutions = self._evaluate_solutions(solutions, problem_context)
        
        # Select recommended solution
        recommended_solution = self._select_recommended_solution(
            evaluated_solutions, user_preferences
        )
        
        # Calculate session confidence
        confidence_score = self._calculate_session_confidence(
            evaluated_solutions, methods_used
        )
        
        session = CreativeSession(
            problem_context=problem_context,
            solutions=evaluated_solutions,
            methods_used=methods_used,
            session_duration=0.0,  # Would be calculated in real implementation
            confidence_score=confidence_score,
            recommended_solution=recommended_solution
        )
        
        logger.info(f"Generated {len(evaluated_solutions)} creative solutions")
        return session

    def _parse_problem_context(
        self,
        problem_statement: str,
        problem_type: Optional[str],
        constraints: Optional[List[str]],
        context: Optional[Dict[str, Any]]
    ) -> ProblemContext:
        """Parse and structure the problem context."""
        
        # Determine problem type if not provided
        if not problem_type:
            problem_type = self._infer_problem_type(problem_statement)
        
        try:
            problem_type_enum = ProblemType(problem_type.lower())
        except ValueError:
            problem_type_enum = ProblemType.PERSONAL
        
        # Extract context information
        context = context or {}
        
        return ProblemContext(
            problem_statement=problem_statement,
            problem_type=problem_type_enum,
            constraints=constraints or [],
            resources_available=context.get("resources", []),
            time_frame=context.get("time_frame"),
            priority_level=context.get("priority", "medium"),
            stakeholders=context.get("stakeholders", []),
            success_criteria=context.get("success_criteria", [])
        )

    def _infer_problem_type(self, problem_statement: str) -> str:
        """Infer the type of problem from the statement."""
        
        problem_lower = problem_statement.lower()
        
        # Technical indicators
        if any(word in problem_lower for word in ["code", "software", "system", "bug", "algorithm"]):
            return "technical"
        
        # Business indicators
        if any(word in problem_lower for word in ["business", "sales", "marketing", "profit", "customer"]):
            return "business"
        
        # Relationship indicators
        if any(word in problem_lower for word in ["relationship", "friend", "family", "conflict", "communication"]):
            return "relationship"
        
        # Creative indicators
        if any(word in problem_lower for word in ["design", "creative", "art", "innovative", "original"]):
            return "creative"
        
        # Educational indicators
        if any(word in problem_lower for word in ["learn", "study", "education", "skill", "knowledge"]):
            return "educational"
        
        return "personal"

    async def _apply_creative_method(
        self,
        method: CreativeThinkingMethod,
        problem_context: ProblemContext,
        user_preferences: Optional[Dict[str, Any]]
    ) -> List[CreativeSolution]:
        """Apply a specific creative thinking method to generate solutions."""
        
        if method == CreativeThinkingMethod.LATERAL_THINKING:
            return self._apply_lateral_thinking(problem_context)
        elif method == CreativeThinkingMethod.BRAINSTORMING:
            return self._apply_brainstorming(problem_context)
        elif method == CreativeThinkingMethod.ANALOGICAL_REASONING:
            return self._apply_analogical_reasoning(problem_context)
        elif method == CreativeThinkingMethod.SCAMPER:
            return self._apply_scamper(problem_context)
        elif method == CreativeThinkingMethod.SIX_THINKING_HATS:
            return self._apply_six_thinking_hats(problem_context)
        elif method == CreativeThinkingMethod.RANDOM_STIMULATION:
            return self._apply_random_stimulation(problem_context)
        else:
            return []

    def _apply_lateral_thinking(self, problem_context: ProblemContext) -> List[CreativeSolution]:
        """Apply lateral thinking techniques."""
        
        solutions = []
        
        for pattern_type, prompts in self.lateral_thinking_patterns.items():
            for prompt in prompts[:2]:  # Limit to 2 per pattern
                solution_text = self._generate_lateral_solution(
                    problem_context.problem_statement, prompt, pattern_type
                )
                
                solution = CreativeSolution(
                    solution_text=solution_text,
                    method_used=CreativeThinkingMethod.LATERAL_THINKING,
                    creativity_score=0.8,  # High creativity for lateral thinking
                    feasibility_score=0.6,  # May need validation
                    originality_score=0.9,  # Very original approaches
                    context_relevance=0.7,
                    reasoning=f"Applied lateral thinking pattern: {pattern_type}",
                    implementation_steps=self._generate_implementation_steps(solution_text),
                    potential_challenges=self._identify_potential_challenges(solution_text),
                    success_indicators=self._define_success_indicators(solution_text)
                )
                solutions.append(solution)
        
        return solutions

    def _apply_brainstorming(self, problem_context: ProblemContext) -> List[CreativeSolution]:
        """Apply brainstorming techniques."""
        
        solutions = []
        
        # Generate multiple brainstormed ideas
        brainstorm_ideas = [
            f"Collaborate with others who have faced similar challenges",
            f"Break down {problem_context.problem_statement} into smaller, manageable parts",
            f"Look for existing solutions in other domains that could be adapted",
            f"Consider what would happen if you had unlimited resources for this",
            f"Think about how this problem might solve itself over time"
        ]
        
        for idea in brainstorm_ideas:
            solution = CreativeSolution(
                solution_text=idea,
                method_used=CreativeThinkingMethod.BRAINSTORMING,
                creativity_score=0.7,
                feasibility_score=0.8,  # Generally practical
                originality_score=0.6,
                context_relevance=0.8,
                reasoning="Generated through collaborative brainstorming approach",
                implementation_steps=self._generate_implementation_steps(idea),
                potential_challenges=self._identify_potential_challenges(idea),
                success_indicators=self._define_success_indicators(idea)
            )
            solutions.append(solution)
        
        return solutions

    def _apply_analogical_reasoning(self, problem_context: ProblemContext) -> List[CreativeSolution]:
        """Apply analogical reasoning from different domains."""
        
        solutions = []
        
        # Select relevant domains for analogies
        selected_domains = random.sample(list(self.analogical_domains.keys()), 3)
        
        for domain in selected_domains:
            concepts = self.analogical_domains[domain]
            selected_concept = random.choice(concepts)
            
            solution_text = self._generate_analogical_solution(
                problem_context.problem_statement, domain, selected_concept
            )
            
            solution = CreativeSolution(
                solution_text=solution_text,
                method_used=CreativeThinkingMethod.ANALOGICAL_REASONING,
                creativity_score=0.8,
                feasibility_score=0.7,
                originality_score=0.8,
                context_relevance=0.7,
                reasoning=f"Applied analogy from {domain} domain using concept: {selected_concept}",
                implementation_steps=self._generate_implementation_steps(solution_text),
                potential_challenges=self._identify_potential_challenges(solution_text),
                success_indicators=self._define_success_indicators(solution_text)
            )
            solutions.append(solution)
        
        return solutions

    def _apply_scamper(self, problem_context: ProblemContext) -> List[CreativeSolution]:
        """Apply SCAMPER method."""
        
        solutions = []
        
        for scamper_type, prompt in self.scamper_prompts.items():
            solution_text = self._generate_scamper_solution(
                problem_context.problem_statement, scamper_type, prompt
            )
            
            solution = CreativeSolution(
                solution_text=solution_text,
                method_used=CreativeThinkingMethod.SCAMPER,
                creativity_score=0.7,
                feasibility_score=0.8,
                originality_score=0.7,
                context_relevance=0.8,
                reasoning=f"Applied SCAMPER technique: {scamper_type}",
                implementation_steps=self._generate_implementation_steps(solution_text),
                potential_challenges=self._identify_potential_challenges(solution_text),
                success_indicators=self._define_success_indicators(solution_text)
            )
            solutions.append(solution)
        
        return solutions

    def _apply_six_thinking_hats(self, problem_context: ProblemContext) -> List[CreativeSolution]:
        """Apply Six Thinking Hats method."""
        
        solutions = []
        
        # Focus on the most solution-oriented hats
        solution_hats = ["yellow", "green", "blue"]
        
        for hat_color in solution_hats:
            perspective = self.six_hats_perspectives[hat_color]
            
            solution_text = self._generate_six_hats_solution(
                problem_context.problem_statement, hat_color, perspective
            )
            
            solution = CreativeSolution(
                solution_text=solution_text,
                method_used=CreativeThinkingMethod.SIX_THINKING_HATS,
                creativity_score=0.6,
                feasibility_score=0.8,
                originality_score=0.6,
                context_relevance=0.9,
                reasoning=f"Applied Six Thinking Hats: {hat_color} hat perspective",
                implementation_steps=self._generate_implementation_steps(solution_text),
                potential_challenges=self._identify_potential_challenges(solution_text),
                success_indicators=self._define_success_indicators(solution_text)
            )
            solutions.append(solution)
        
        return solutions

    def _apply_random_stimulation(self, problem_context: ProblemContext) -> List[CreativeSolution]:
        """Apply random stimulation technique."""
        
        solutions = []
        
        # Random stimuli to trigger creative connections
        random_stimuli = [
            "bridge", "mirror", "garden", "puzzle", "dance", "river",
            "key", "window", "mountain", "book", "clock", "compass"
        ]
        
        selected_stimuli = random.sample(random_stimuli, 3)
        
        for stimulus in selected_stimuli:
            solution_text = self._generate_random_stimulation_solution(
                problem_context.problem_statement, stimulus
            )
            
            solution = CreativeSolution(
                solution_text=solution_text,
                method_used=CreativeThinkingMethod.RANDOM_STIMULATION,
                creativity_score=0.9,  # Very creative
                feasibility_score=0.5,  # May need significant adaptation
                originality_score=0.9,
                context_relevance=0.6,
                reasoning=f"Applied random stimulation using: {stimulus}",
                implementation_steps=self._generate_implementation_steps(solution_text),
                potential_challenges=self._identify_potential_challenges(solution_text),
                success_indicators=self._define_success_indicators(solution_text)
            )
            solutions.append(solution)
        
        return solutions

    def _generate_lateral_solution(self, problem: str, prompt: str, pattern_type: str) -> str:
        """Generate a solution using lateral thinking."""
        
        if pattern_type == "reverse_assumption":
            return f"Instead of trying to solve '{problem}' directly, what if we focused on preventing it from happening in the first place? This reverse approach might reveal underlying causes we haven't considered."
        
        elif pattern_type == "random_entry":
            domains = ["nature", "art", "sports", "cooking"]
            domain = random.choice(domains)
            return f"Drawing inspiration from {domain}: If we approached '{problem}' the way {domain} experts handle their challenges, we might discover unexpected solutions through their unique perspectives and methods."
        
        elif pattern_type == "provocation":
            return f"Po: What if '{problem}' was actually an opportunity in disguise? By reframing this challenge as a chance to innovate or improve something fundamental, we might find solutions that create value beyond just solving the immediate issue."
        
        return f"Apply lateral thinking to reframe '{problem}' in an unexpected way."

    def _generate_analogical_solution(self, problem: str, domain: str, concept: str) -> str:
        """Generate a solution using analogical reasoning."""
        
        domain_strategies = {
            "nature": f"Like {concept} in nature, consider how '{problem}' might benefit from natural adaptation strategies - gradual change, symbiotic relationships, or resilient systems.",
            "sports": f"Using {concept} from sports, approach '{problem}' with the mindset of training, teamwork, and strategic planning that athletes use to overcome challenges.",
            "music": f"Like {concept} in music, think of '{problem}' as requiring harmony between different elements, proper timing, and creative improvisation.",
            "cooking": f"Similar to {concept} in cooking, solve '{problem}' by carefully balancing ingredients (resources), timing processes correctly, and adjusting flavors (approaches) as needed.",
            "architecture": f"Like {concept} in architecture, address '{problem}' by building strong foundations, ensuring structural integrity, and designing for both function and form.",
            "games": f"Using {concept} from games, approach '{problem}' strategically with clear rules, collaborative play where possible, and focus on achieving objectives."
        }
        
        return domain_strategies.get(domain, f"Apply {concept} principles from {domain} to solve '{problem}'.")

    def _generate_scamper_solution(self, problem: str, scamper_type: str, prompt: str) -> str:
        """Generate a solution using SCAMPER technique."""
        
        scamper_solutions = {
            "substitute": f"For '{problem}', consider substituting current approaches with alternative methods, tools, or perspectives that might be more effective.",
            "combine": f"Combine existing solutions or resources in new ways to address '{problem}' more comprehensively than any single approach could.",
            "adapt": f"Adapt successful solutions from similar situations or different contexts to fit the specific requirements of '{problem}'.",
            "modify": f"Modify current approaches to '{problem}' by amplifying strengths and minimizing weaknesses in your existing strategies.",
            "put_to_other_uses": f"Find alternative applications for resources or skills you have, using them in unexpected ways to solve '{problem}'.",
            "eliminate": f"Simplify '{problem}' by removing unnecessary complexity, constraints, or assumptions that may be limiting potential solutions.",
            "reverse": f"Reverse your typical approach to '{problem}' - start from the desired outcome and work backwards, or flip the process entirely."
        }
        
        return scamper_solutions.get(scamper_type, f"Apply {scamper_type} technique to '{problem}'.")

    def _generate_six_hats_solution(self, problem: str, hat_color: str, perspective: str) -> str:
        """Generate a solution using Six Thinking Hats."""
        
        hat_solutions = {
            "yellow": f"Focus on the positive potential of solving '{problem}' - what benefits, opportunities, and best-case scenarios could emerge from addressing this challenge effectively?",
            "green": f"Generate creative alternatives for '{problem}' by exploring unconventional ideas, innovative approaches, and fresh perspectives that haven't been tried before.",
            "blue": f"Organize your approach to '{problem}' systematically - create a step-by-step process, set priorities, and establish clear criteria for evaluating progress."
        }
        
        return hat_solutions.get(hat_color, f"Apply {hat_color} hat thinking to '{problem}'.")

    def _generate_random_stimulation_solution(self, problem: str, stimulus: str) -> str:
        """Generate a solution using random stimulation."""
        
        stimulus_connections = {
            "bridge": f"Like a bridge connects two sides, find connections between '{problem}' and unexpected resources or solutions that could span the gap.",
            "mirror": f"Reflect on '{problem}' by looking at it from the opposite perspective - what would the mirror image of this challenge reveal?",
            "garden": f"Cultivate solutions to '{problem}' gradually, like tending a garden - plant seeds of ideas, nurture them, and allow organic growth.",
            "puzzle": f"Treat '{problem}' as a puzzle where each piece (resource, constraint, goal) must fit together in the right configuration.",
            "dance": f"Approach '{problem}' with the fluidity and rhythm of dance - adapt to the music of circumstances and find harmony in movement.",
            "river": f"Flow around obstacles in '{problem}' like water in a river - find the path of least resistance while maintaining your direction."
        }
        
        return stimulus_connections.get(stimulus, f"Connect '{problem}' with the unexpected qualities of {stimulus} to discover new solution approaches.")

    def _generate_implementation_steps(self, solution_text: str) -> List[str]:
        """Generate implementation steps for a solution."""
        
        # Basic implementation steps template
        return [
            "1. Assess current situation and gather necessary resources",
            "2. Plan the implementation approach and timeline",
            "3. Start with a small pilot or test of the solution",
            "4. Monitor progress and adjust approach as needed",
            "5. Scale up successful elements and refine the process"
        ]

    def _identify_potential_challenges(self, solution_text: str) -> List[str]:
        """Identify potential challenges for implementing a solution."""
        
        return [
            "Resource constraints may limit implementation speed",
            "Stakeholder buy-in might require additional communication",
            "Unexpected complications could arise during execution",
            "Timeline pressures may require prioritization decisions"
        ]

    def _define_success_indicators(self, solution_text: str) -> List[str]:
        """Define success indicators for a solution."""
        
        return [
            "Problem symptoms begin to decrease or disappear",
            "Stakeholders report improved satisfaction",
            "Implementation proceeds according to planned timeline",
            "Unexpected positive side effects emerge",
            "Solution becomes sustainable and self-maintaining"
        ]

    def _evaluate_solutions(
        self,
        solutions: List[CreativeSolution],
        problem_context: ProblemContext
    ) -> List[CreativeSolution]:
        """Evaluate and rank solutions based on multiple criteria."""
        
        for solution in solutions:
            # Adjust scores based on problem context
            if problem_context.priority_level == "high":
                solution.feasibility_score *= 1.2  # Prioritize feasible solutions
            
            if problem_context.time_frame and "urgent" in problem_context.time_frame.lower():
                solution.feasibility_score *= 1.3
                solution.creativity_score *= 0.9  # Slightly prefer practical over creative
            
            # Ensure scores stay within bounds
            solution.creativity_score = min(1.0, solution.creativity_score)
            solution.feasibility_score = min(1.0, solution.feasibility_score)
            solution.originality_score = min(1.0, solution.originality_score)
            solution.context_relevance = min(1.0, solution.context_relevance)
        
        # Sort by weighted score (feasibility + creativity + relevance)
        solutions.sort(
            key=lambda s: (s.feasibility_score * 0.4 + s.creativity_score * 0.3 + s.context_relevance * 0.3),
            reverse=True
        )
        
        return solutions

    def _select_recommended_solution(
        self,
        solutions: List[CreativeSolution],
        user_preferences: Optional[Dict[str, Any]]
    ) -> Optional[CreativeSolution]:
        """Select the most appropriate solution based on criteria and preferences."""
        
        if not solutions:
            return None
        
        # If user preferences specify a preferred method, prioritize that
        if user_preferences and "preferred_method" in user_preferences:
            preferred_method = user_preferences["preferred_method"]
            for solution in solutions:
                if solution.method_used.value == preferred_method:
                    return solution
        
        # Otherwise, return the highest-ranked solution
        return solutions[0]

    def _calculate_session_confidence(
        self,
        solutions: List[CreativeSolution],
        methods_used: List[CreativeThinkingMethod]
    ) -> float:
        """Calculate confidence score for the creative session."""
        
        if not solutions:
            return 0.0
        
        # Base confidence on number of solutions and methods used
        solution_score = min(1.0, len(solutions) / 10.0)  # More solutions = higher confidence
        method_score = len(methods_used) / len(CreativeThinkingMethod)  # Coverage of methods
        
        # Average quality of top solutions
        top_solutions = solutions[:5]
        quality_scores = [
            (s.creativity_score + s.feasibility_score + s.context_relevance) / 3
            for s in top_solutions
        ]
        average_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 0.0
        
        # Weighted combination
        confidence = (solution_score * 0.3 + method_score * 0.3 + average_quality * 0.4)
        
        return min(1.0, confidence)

    async def get_solution_details(self, solution: CreativeSolution) -> Dict[str, Any]:
        """Get detailed information about a specific solution."""
        
        return {
            "solution_text": solution.solution_text,
            "method_used": solution.method_used.value,
            "scores": {
                "creativity": solution.creativity_score,
                "feasibility": solution.feasibility_score,
                "originality": solution.originality_score,
                "context_relevance": solution.context_relevance
            },
            "reasoning": solution.reasoning,
            "implementation": {
                "steps": solution.implementation_steps,
                "challenges": solution.potential_challenges,
                "success_indicators": solution.success_indicators
            }
        }

    async def refine_solution(
        self,
        solution: CreativeSolution,
        feedback: str,
        additional_constraints: Optional[List[str]] = None
    ) -> CreativeSolution:
        """Refine a solution based on user feedback."""
        
        # Create refined solution based on feedback
        refined_text = f"{solution.solution_text}\n\nRefinement based on feedback: {feedback}"
        
        if additional_constraints:
            refined_text += f"\nAdditional considerations: {', '.join(additional_constraints)}"
        
        # Adjust scores based on refinement
        refined_solution = CreativeSolution(
            solution_text=refined_text,
            method_used=solution.method_used,
            creativity_score=solution.creativity_score * 0.9,  # Slight decrease for safety
            feasibility_score=solution.feasibility_score * 1.1,  # Increase for refinement
            originality_score=solution.originality_score,
            context_relevance=solution.context_relevance * 1.1,
            reasoning=f"{solution.reasoning} (Refined based on user feedback)",
            implementation_steps=solution.implementation_steps,
            potential_challenges=solution.potential_challenges,
            success_indicators=solution.success_indicators
        )
        
        # Ensure scores stay within bounds
        refined_solution.feasibility_score = min(1.0, refined_solution.feasibility_score)
        refined_solution.context_relevance = min(1.0, refined_solution.context_relevance)
        
        return refined_solution
