"""
A/B Testing Framework

This service implements comprehensive A/B testing capabilities for continuous improvement:
- Experiment design and management
- Statistical significance testing
- Multi-variant testing support
- Real-time performance monitoring
- Automated experiment lifecycle management
"""

import logging
import json
import random
import math
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, field
from enum import Enum
from collections import defaultdict
import uuid
import numpy as np
from scipy import stats

logger = logging.getLogger(__name__)


class ExperimentStatus(Enum):
    """Status of A/B test experiments."""
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ExperimentType(Enum):
    """Types of A/B test experiments."""
    SYSTEM_PROMPT = "system_prompt"
    RESPONSE_STYLE = "response_style"
    MEMORY_STRATEGY = "memory_strategy"
    UI_COMPONENT = "ui_component"
    FEATURE_FLAG = "feature_flag"
    CONVERSATION_FLOW = "conversation_flow"
    EMOTIONAL_RESPONSE = "emotional_response"
    PERSONALIZATION = "personalization"


class MetricType(Enum):
    """Types of metrics to track in experiments."""
    SATISFACTION_SCORE = "satisfaction_score"
    RESPONSE_TIME = "response_time"
    CONVERSATION_LENGTH = "conversation_length"
    USER_ENGAGEMENT = "user_engagement"
    MEMORY_ACCURACY = "memory_accuracy"
    COMPLETION_RATE = "completion_rate"
    CLICK_THROUGH_RATE = "click_through_rate"
    RETENTION_RATE = "retention_rate"


@dataclass
class ExperimentVariant:
    """Represents a variant in an A/B test."""
    variant_id: str
    name: str
    description: str
    configuration: Dict[str, Any]
    traffic_percentage: float
    is_control: bool = False


@dataclass
class ExperimentConfig:
    """Configuration for an A/B test experiment."""
    experiment_id: str
    name: str
    description: str
    experiment_type: ExperimentType
    variants: List[ExperimentVariant]
    primary_metric: MetricType
    secondary_metrics: List[MetricType]
    target_users: Dict[str, Any]  # Targeting criteria
    traffic_split: Dict[str, float]  # Variant ID -> percentage
    min_sample_size: int
    start_date: datetime
    confidence_level: float = 0.95
    min_effect_size: float = 0.05
    end_date: Optional[datetime] = None
    auto_stop_enabled: bool = True


@dataclass
class ExperimentResult:
    """Results from an A/B test experiment."""
    experiment_id: str
    variant_id: str
    metric_name: str
    sample_size: int
    mean_value: float
    std_deviation: float
    confidence_interval: Tuple[float, float]
    statistical_significance: bool
    p_value: float
    effect_size: float
    timestamp: datetime


@dataclass
class ExperimentAnalysis:
    """Statistical analysis of experiment results."""
    experiment_id: str
    status: ExperimentStatus
    primary_results: Dict[str, ExperimentResult]
    secondary_results: Dict[str, List[ExperimentResult]]
    winner: Optional[str]
    confidence: float
    recommendation: str
    insights: List[str]
    generated_at: datetime


@dataclass
class UserAssignment:
    """Tracks user assignment to experiment variants."""
    user_id: str
    experiment_id: str
    variant_id: str
    assigned_at: datetime
    sticky: bool = True  # Keep user in same variant


class ABTestingFramework:
    """
    Comprehensive A/B testing framework for continuous improvement.
    """
    
    def __init__(self):
        self.experiments: Dict[str, ExperimentConfig] = {}
        self.user_assignments: Dict[str, Dict[str, UserAssignment]] = defaultdict(dict)
        self.experiment_data: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self.results_cache: Dict[str, ExperimentAnalysis] = {}
        
        # Statistical configuration
        self.default_confidence_level = 0.95
        self.default_min_effect_size = 0.05
        self.min_sample_size_per_variant = 100
        
        logger.info("ABTestingFramework initialized")
    
    async def create_experiment(
        self,
        name: str,
        description: str,
        experiment_type: ExperimentType,
        variants: List[Dict[str, Any]],
        primary_metric: MetricType,
        secondary_metrics: List[MetricType] = None,
        target_users: Dict[str, Any] = None,
        min_sample_size: int = None
    ) -> str:
        """
        Create a new A/B test experiment.
        
        Args:
            name: Name of the experiment
            description: Description of what's being tested
            experiment_type: Type of experiment
            variants: List of variant configurations
            primary_metric: Primary metric to optimize
            secondary_metrics: Additional metrics to track
            target_users: User targeting criteria
            min_sample_size: Minimum sample size per variant
            
        Returns:
            str: Experiment ID
        """
        try:
            experiment_id = str(uuid.uuid4())
            
            # Create experiment variants
            experiment_variants = []
            total_traffic = 0
            
            for i, variant_data in enumerate(variants):
                variant_id = str(uuid.uuid4())
                traffic_percentage = variant_data.get("traffic_percentage", 100 / len(variants))
                total_traffic += traffic_percentage
                
                variant = ExperimentVariant(
                    variant_id=variant_id,
                    name=variant_data["name"],
                    description=variant_data.get("description", ""),
                    configuration=variant_data["configuration"],
                    traffic_percentage=traffic_percentage,
                    is_control=variant_data.get("is_control", i == 0)
                )
                experiment_variants.append(variant)
            
            # Validate traffic allocation
            if abs(total_traffic - 100) > 0.01:
                raise ValueError(f"Traffic allocation must sum to 100%, got {total_traffic}%")
            
            # Create traffic split dictionary
            traffic_split = {v.variant_id: v.traffic_percentage for v in experiment_variants}
            
            # Create experiment configuration
            experiment_config = ExperimentConfig(
                experiment_id=experiment_id,
                name=name,
                description=description,
                experiment_type=experiment_type,
                variants=experiment_variants,
                primary_metric=primary_metric,
                secondary_metrics=secondary_metrics or [],
                target_users=target_users or {},
                traffic_split=traffic_split,
                min_sample_size=min_sample_size or self.min_sample_size_per_variant,
                start_date=datetime.now(timezone.utc)
            )
            
            self.experiments[experiment_id] = experiment_config
            
            logger.info(f"Created experiment '{name}' with ID {experiment_id}")
            
            return experiment_id
            
        except Exception as e:
            logger.error(f"Error creating experiment: {e}")
            raise
    
    async def assign_user_to_experiment(
        self,
        user_id: str,
        experiment_id: str,
        force_variant: Optional[str] = None
    ) -> Optional[UserAssignment]:
        """
        Assign a user to an experiment variant.
        
        Args:
            user_id: ID of the user
            experiment_id: ID of the experiment
            force_variant: Force assignment to specific variant (for testing)
            
        Returns:
            UserAssignment: User assignment details
        """
        try:
            experiment = self.experiments.get(experiment_id)
            if not experiment:
                logger.warning(f"Experiment {experiment_id} not found")
                return None
            
            # Check if user is already assigned
            if experiment_id in self.user_assignments[user_id]:
                existing_assignment = self.user_assignments[user_id][experiment_id]
                if existing_assignment.sticky:
                    return existing_assignment
            
            # Check if experiment is active
            if experiment.start_date > datetime.now(timezone.utc):
                return None
            
            if experiment.end_date and experiment.end_date < datetime.now(timezone.utc):
                return None
            
            # Check targeting criteria
            if not await self._user_matches_targeting(user_id, experiment.target_users):
                return None
            
            # Assign variant
            if force_variant:
                variant_id = force_variant
                if not any(v.variant_id == variant_id for v in experiment.variants):
                    raise ValueError(f"Variant {variant_id} not found in experiment")
            else:
                variant_id = self._select_variant(user_id, experiment)
            
            # Create assignment
            assignment = UserAssignment(
                user_id=user_id,
                experiment_id=experiment_id,
                variant_id=variant_id,
                assigned_at=datetime.now(timezone.utc)
            )
            
            self.user_assignments[user_id][experiment_id] = assignment
            
            logger.debug(f"Assigned user {user_id} to variant {variant_id} in experiment {experiment_id}")
            
            return assignment
            
        except Exception as e:
            logger.error(f"Error assigning user to experiment: {e}")
            return None
    
    async def get_user_variant(self, user_id: str, experiment_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the variant configuration for a user in an experiment.
        
        Args:
            user_id: ID of the user
            experiment_id: ID of the experiment
            
        Returns:
            Dict containing variant configuration
        """
        try:
            assignment = await self.assign_user_to_experiment(user_id, experiment_id)
            if not assignment:
                return None
            
            experiment = self.experiments[experiment_id]
            variant = next((v for v in experiment.variants if v.variant_id == assignment.variant_id), None)
            
            if not variant:
                logger.error(f"Variant {assignment.variant_id} not found")
                return None
            
            return {
                "variant_id": variant.variant_id,
                "name": variant.name,
                "configuration": variant.configuration,
                "is_control": variant.is_control
            }
            
        except Exception as e:
            logger.error(f"Error getting user variant: {e}")
            return None
    
    async def track_metric(
        self,
        user_id: str,
        experiment_id: str,
        metric_type: MetricType,
        value: float,
        metadata: Dict[str, Any] = None
    ) -> bool:
        """
        Track a metric value for a user in an experiment.
        
        Args:
            user_id: ID of the user
            experiment_id: ID of the experiment
            metric_type: Type of metric being tracked
            value: Metric value
            metadata: Additional metadata
            
        Returns:
            bool: Success status
        """
        try:
            assignment = self.user_assignments[user_id].get(experiment_id)
            if not assignment:
                # User not in experiment
                return False
            
            # Record metric data
            metric_data = {
                "user_id": user_id,
                "experiment_id": experiment_id,
                "variant_id": assignment.variant_id,
                "metric_type": metric_type.value,
                "value": value,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "metadata": metadata or {}
            }
            
            self.experiment_data[experiment_id].append(metric_data)
            
            logger.debug(f"Tracked metric {metric_type.value}={value} for user {user_id} in experiment {experiment_id}")
            
            # Clear results cache to force recalculation
            if experiment_id in self.results_cache:
                del self.results_cache[experiment_id]
            
            return True
            
        except Exception as e:
            logger.error(f"Error tracking metric: {e}")
            return False
    
    async def analyze_experiment(self, experiment_id: str) -> Optional[ExperimentAnalysis]:
        """
        Perform statistical analysis of experiment results.
        
        Args:
            experiment_id: ID of the experiment
            
        Returns:
            ExperimentAnalysis: Analysis results
        """
        try:
            # Check cache first
            if experiment_id in self.results_cache:
                cached_result = self.results_cache[experiment_id]
                # Return cached result if less than 1 hour old
                if datetime.now(timezone.utc) - cached_result.generated_at < timedelta(hours=1):
                    return cached_result
            
            experiment = self.experiments.get(experiment_id)
            if not experiment:
                return None
            
            experiment_data = self.experiment_data.get(experiment_id, [])
            if not experiment_data:
                return None
            
            # Analyze primary metric
            primary_results = await self._analyze_metric(
                experiment, experiment_data, experiment.primary_metric
            )
            
            # Analyze secondary metrics
            secondary_results = {}
            for metric in experiment.secondary_metrics:
                results = await self._analyze_metric(experiment, experiment_data, metric)
                secondary_results[metric.value] = results
            
            # Determine winner and confidence
            winner, confidence = self._determine_winner(primary_results)
            
            # Generate recommendation
            recommendation = self._generate_recommendation(experiment, primary_results, winner, confidence)
            
            # Generate insights
            insights = self._generate_insights(experiment, primary_results, secondary_results)
            
            # Create analysis
            analysis = ExperimentAnalysis(
                experiment_id=experiment_id,
                status=ExperimentStatus.ACTIVE,  # This would be determined by other factors
                primary_results=primary_results,
                secondary_results=secondary_results,
                winner=winner,
                confidence=confidence,
                recommendation=recommendation,
                insights=insights,
                generated_at=datetime.now(timezone.utc)
            )
            
            # Cache results
            self.results_cache[experiment_id] = analysis
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing experiment: {e}")
            return None
    
    async def stop_experiment(self, experiment_id: str, reason: str = "") -> bool:
        """
        Stop an active experiment.
        
        Args:
            experiment_id: ID of the experiment
            reason: Reason for stopping
            
        Returns:
            bool: Success status
        """
        try:
            experiment = self.experiments.get(experiment_id)
            if not experiment:
                return False
            
            experiment.end_date = datetime.now(timezone.utc)
            
            logger.info(f"Stopped experiment {experiment_id}: {reason}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error stopping experiment: {e}")
            return False
    
    def _select_variant(self, user_id: str, experiment: ExperimentConfig) -> str:
        """Select a variant for a user based on traffic allocation."""
        # Use deterministic hash-based assignment for consistency
        hash_input = f"{user_id}:{experiment.experiment_id}"
        hash_value = hash(hash_input) % 10000  # 0-9999
        
        # Convert to percentage
        percentage = hash_value / 100.0  # 0.00-99.99
        
        # Select variant based on traffic split
        cumulative_percentage = 0
        for variant in experiment.variants:
            cumulative_percentage += variant.traffic_percentage
            if percentage < cumulative_percentage:
                return variant.variant_id
        
        # Fallback to control variant
        control_variant = next((v for v in experiment.variants if v.is_control), experiment.variants[0])
        return control_variant.variant_id
    
    async def _user_matches_targeting(self, user_id: str, target_criteria: Dict[str, Any]) -> bool:
        """Check if user matches targeting criteria."""
        if not target_criteria:
            return True
        
        # Simple implementation - can be extended with more sophisticated targeting
        return True
    
    async def _analyze_metric(
        self,
        experiment: ExperimentConfig,
        experiment_data: List[Dict[str, Any]],
        metric_type: MetricType
    ) -> Dict[str, ExperimentResult]:
        """Analyze a specific metric across all variants."""
        results = {}
        
        # Group data by variant
        variant_data = defaultdict(list)
        for data_point in experiment_data:
            if data_point["metric_type"] == metric_type.value:
                variant_data[data_point["variant_id"]].append(data_point["value"])
        
        # Calculate statistics for each variant
        for variant in experiment.variants:
            values = variant_data.get(variant.variant_id, [])
            
            if len(values) < 10:  # Minimum sample size for meaningful analysis
                continue
            
            mean_value = np.mean(values)
            std_deviation = np.std(values, ddof=1)
            sample_size = len(values)
            
            # Calculate confidence interval
            confidence_level = experiment.confidence_level
            alpha = 1 - confidence_level
            t_score = stats.t.ppf(1 - alpha/2, df=sample_size-1)
            margin_of_error = t_score * (std_deviation / np.sqrt(sample_size))
            confidence_interval = (mean_value - margin_of_error, mean_value + margin_of_error)
            
            # Compare with control (if this isn't the control)
            control_variant = next((v for v in experiment.variants if v.is_control), None)
            if control_variant and variant.variant_id != control_variant.variant_id:
                control_values = variant_data.get(control_variant.variant_id, [])
                if len(control_values) >= 10:
                    # Perform t-test
                    t_statistic, p_value = stats.ttest_ind(values, control_values)
                    statistical_significance = p_value < (1 - confidence_level)
                    effect_size = (mean_value - np.mean(control_values)) / np.sqrt(
                        ((sample_size - 1) * std_deviation**2 + (len(control_values) - 1) * np.std(control_values, ddof=1)**2) /
                        (sample_size + len(control_values) - 2)
                    )
                else:
                    p_value = 1.0
                    statistical_significance = False
                    effect_size = 0.0
            else:
                p_value = 1.0
                statistical_significance = False
                effect_size = 0.0
            
            result = ExperimentResult(
                experiment_id=experiment.experiment_id,
                variant_id=variant.variant_id,
                metric_name=metric_type.value,
                sample_size=sample_size,
                mean_value=mean_value,
                std_deviation=std_deviation,
                confidence_interval=confidence_interval,
                statistical_significance=statistical_significance,
                p_value=p_value,
                effect_size=effect_size,
                timestamp=datetime.now(timezone.utc)
            )
            
            results[variant.variant_id] = result
        
        return results
    
    def _determine_winner(self, results: Dict[str, ExperimentResult]) -> Tuple[Optional[str], float]:
        """Determine the winning variant and confidence level."""
        if len(results) < 2:
            return None, 0.0
        
        # Find variant with highest mean value and statistical significance
        best_variant = None
        best_value = float('-inf')
        confidence = 0.0
        
        for variant_id, result in results.items():
            if result.mean_value > best_value and result.statistical_significance:
                best_variant = variant_id
                best_value = result.mean_value
                confidence = 1 - result.p_value
        
        return best_variant, confidence
    
    def _generate_recommendation(
        self,
        experiment: ExperimentConfig,
        results: Dict[str, ExperimentResult],
        winner: Optional[str],
        confidence: float
    ) -> str:
        """Generate actionable recommendation based on results."""
        if not winner:
            return "Continue experiment - no statistically significant winner yet"
        
        winner_variant = next((v for v in experiment.variants if v.variant_id == winner), None)
        if not winner_variant:
            return "Continue experiment - insufficient data"
        
        if confidence > 0.95:
            return f"Deploy variant '{winner_variant.name}' - high confidence winner"
        elif confidence > 0.8:
            return f"Consider deploying variant '{winner_variant.name}' - moderate confidence"
        else:
            return "Continue experiment - confidence too low for deployment"
    
    def _generate_insights(
        self,
        experiment: ExperimentConfig,
        primary_results: Dict[str, ExperimentResult],
        secondary_results: Dict[str, List[ExperimentResult]]
    ) -> List[str]:
        """Generate insights from experiment results."""
        insights = []
        
        # Sample size insights
        total_sample_size = sum(r.sample_size for r in primary_results.values())
        insights.append(f"Total sample size: {total_sample_size} users")
        
        # Statistical significance insights
        significant_variants = [r.variant_id for r in primary_results.values() if r.statistical_significance]
        if significant_variants:
            insights.append(f"Statistically significant variants: {len(significant_variants)}")
        
        # Effect size insights
        large_effects = [r for r in primary_results.values() if abs(r.effect_size) > 0.2]
        if large_effects:
            insights.append(f"Large effect sizes detected in {len(large_effects)} variants")
        
        # Performance insights
        best_performer = max(primary_results.values(), key=lambda x: x.mean_value, default=None)
        if best_performer:
            variant_name = next(
                (v.name for v in experiment.variants if v.variant_id == best_performer.variant_id),
                "Unknown"
            )
            insights.append(f"Best performing variant: '{variant_name}' with {best_performer.mean_value:.2f}")
        
        return insights


# Global instance
ab_testing_framework = ABTestingFramework()
