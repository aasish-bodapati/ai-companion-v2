"""
Health logging factory for creating service instances.
Provides a centralized way to create health logging services.
"""

from typing import Dict, Type, Any
from app.services.common.generic_health_service import GenericHealthService
from app.crud.health.fitness_log import fitness_log, nutrition_log, mood_log
from app.crud.health.water_log import water_log
from app.schemas.common.health_enums import LogType


class HealthLoggingFactory:
    """
    Factory for creating health logging services.
    Centralizes service creation and configuration.
    """
    
    _services: Dict[LogType, GenericHealthService] = {}
    
    @classmethod
    def get_service(cls, log_type: LogType) -> GenericHealthService:
        """
        Get or create a health logging service for the specified log type.
        
        Args:
            log_type: Type of health log
            
        Returns:
            GenericHealthService instance
        """
        if log_type not in cls._services:
            cls._services[log_type] = cls._create_service(log_type)
        
        return cls._services[log_type]
    
    @classmethod
    def _create_service(cls, log_type: LogType) -> GenericHealthService:
        """
        Create a new service instance for the specified log type.
        
        Args:
            log_type: Type of health log
            
        Returns:
            GenericHealthService instance
        """
        # Map log types to their corresponding CRUD instances
        crud_mapping = {
            LogType.FITNESS: fitness_log,
            LogType.NUTRITION: nutrition_log,
            LogType.WATER: water_log,
            LogType.MOOD: mood_log,
        }
        
        if log_type not in crud_mapping:
            raise ValueError(f"Unsupported log type: {log_type}")
        
        crud = crud_mapping[log_type]
        return GenericHealthService(crud=crud, log_type=log_type)
    
    @classmethod
    def get_all_services(cls) -> Dict[LogType, GenericHealthService]:
        """
        Get all available health logging services.
        
        Returns:
            Dictionary mapping log types to their services
        """
        # Ensure all services are created
        for log_type in LogType:
            if log_type in [LogType.FITNESS, LogType.NUTRITION, LogType.WATER, LogType.MOOD]:
                cls.get_service(log_type)
        
        return cls._services.copy()
    
    @classmethod
    def clear_cache(cls):
        """Clear the service cache."""
        cls._services.clear()
    
    @classmethod
    def get_service_info(cls) -> Dict[str, Any]:
        """
        Get information about available services.
        
        Returns:
            Dictionary with service information
        """
        services = cls.get_all_services()
        
        return {
            "available_services": list(services.keys()),
            "service_count": len(services),
            "supported_log_types": [log_type.value for log_type in LogType 
                                  if log_type in [LogType.FITNESS, LogType.NUTRITION, LogType.WATER, LogType.MOOD]]
        }
