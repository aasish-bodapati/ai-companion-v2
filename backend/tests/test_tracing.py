"""
Tests for tracing functionality.
"""

import pytest
from unittest.mock import patch, MagicMock, Mock
import logging

from app.core.tracing import init_tracing


class TestTracing:
    """Test tracing initialization and functionality."""

    def test_init_tracing_disabled(self):
        """Test tracing initialization when disabled."""
        with patch('app.core.tracing.settings') as mock_settings:
            mock_settings.OTEL_ENABLED = False
            
            result = init_tracing(Mock())
            
            assert result is None

    def test_init_tracing_enabled_success(self):
        """Test successful tracing initialization."""
        mock_app = Mock()
        
        with patch('app.core.tracing.settings') as mock_settings, \
             patch('app.core.tracing.trace') as mock_trace, \
             patch('app.core.tracing.TracerProvider') as mock_provider_class, \
             patch('app.core.tracing.Resource') as mock_resource_class, \
             patch('app.core.tracing.BatchSpanProcessor') as mock_processor_class, \
             patch('app.core.tracing.OTLPHTTPExporter') as mock_exporter_class, \
             patch('app.core.tracing.FastAPIInstrumentor') as mock_fastapi_instrumentor, \
             patch('app.core.tracing.OpenTelemetryMiddleware') as mock_middleware, \
             patch('app.core.tracing.HTTPXClientInstrumentor') as mock_httpx_instrumentor, \
             patch('app.core.tracing.SQLAlchemyInstrumentor') as mock_sqlalchemy_instrumentor:
            
            # Configure settings
            mock_settings.OTEL_ENABLED = True
            mock_settings.OTEL_SERVICE_NAME = "test-service"
            mock_settings.OTEL_ENVIRONMENT = "test"
            mock_settings.OTEL_EXPORTER_OTLP_ENDPOINT = "http://localhost:4318"
            
            # Configure mocks
            mock_provider = Mock()
            mock_provider_class.return_value = mock_provider
            
            mock_resource = Mock()
            mock_resource_class.create.return_value = mock_resource
            
            mock_exporter = Mock()
            mock_exporter_class.return_value = mock_exporter
            
            mock_processor = Mock()
            mock_processor_class.return_value = mock_processor
            
            mock_fastapi_instrumentor_instance = Mock()
            mock_fastapi_instrumentor.instrument_app = mock_fastapi_instrumentor_instance
            
            mock_httpx_instrumentor_instance = Mock()
            mock_httpx_instrumentor.return_value = mock_httpx_instrumentor_instance
            
            mock_sqlalchemy_instrumentor_instance = Mock()
            mock_sqlalchemy_instrumentor.return_value = mock_sqlalchemy_instrumentor_instance
            
            # Call function
            result = init_tracing(mock_app)
            
            # Verify calls
            mock_resource_class.create.assert_called_once_with({
                "service.name": "test-service",
                "deployment.environment": "test",
            })
            
            mock_provider_class.assert_called_once_with(resource=mock_resource)
            mock_trace.set_tracer_provider.assert_called_once_with(mock_provider)
            
            mock_exporter_class.assert_called_once_with(endpoint="http://localhost:4318/v1/traces")
            mock_processor_class.assert_called_once_with(mock_exporter)
            mock_provider.add_span_processor.assert_called_once_with(mock_processor)
            
            mock_fastapi_instrumentor_instance.assert_called_once_with(
                mock_app, server_request_hook=None, client_request_hook=None
            )
            
            mock_app.add_middleware.assert_called_once_with(mock_middleware)
            mock_httpx_instrumentor_instance.instrument.assert_called_once()
            mock_sqlalchemy_instrumentor_instance.instrument.assert_called_once()
            
            assert result == mock_provider

    def test_init_tracing_enabled_no_endpoint(self):
        """Test tracing initialization without endpoint."""
        mock_app = Mock()
        
        with patch('app.core.tracing.settings') as mock_settings, \
             patch('app.core.tracing.trace') as mock_trace, \
             patch('app.core.tracing.TracerProvider') as mock_provider_class, \
             patch('app.core.tracing.Resource') as mock_resource_class, \
             patch('app.core.tracing.BatchSpanProcessor') as mock_processor_class, \
             patch('app.core.tracing.OTLPHTTPExporter') as mock_exporter_class, \
             patch('app.core.tracing.FastAPIInstrumentor') as mock_fastapi_instrumentor, \
             patch('app.core.tracing.OpenTelemetryMiddleware') as mock_middleware, \
             patch('app.core.tracing.HTTPXClientInstrumentor') as mock_httpx_instrumentor, \
             patch('app.core.tracing.SQLAlchemyInstrumentor') as mock_sqlalchemy_instrumentor:
            
            # Configure settings
            mock_settings.OTEL_ENABLED = True
            mock_settings.OTEL_SERVICE_NAME = "test-service"
            mock_settings.OTEL_ENVIRONMENT = "test"
            mock_settings.OTEL_EXPORTER_OTLP_ENDPOINT = ""
            
            # Configure mocks
            mock_provider = Mock()
            mock_provider_class.return_value = mock_provider
            
            mock_resource = Mock()
            mock_resource_class.create.return_value = mock_resource
            
            mock_exporter = Mock()
            mock_exporter_class.return_value = mock_exporter
            
            mock_processor = Mock()
            mock_processor_class.return_value = mock_processor
            
            mock_fastapi_instrumentor_instance = Mock()
            mock_fastapi_instrumentor.instrument_app = mock_fastapi_instrumentor_instance
            
            mock_httpx_instrumentor_instance = Mock()
            mock_httpx_instrumentor.return_value = mock_httpx_instrumentor_instance
            
            mock_sqlalchemy_instrumentor_instance = Mock()
            mock_sqlalchemy_instrumentor.return_value = mock_sqlalchemy_instrumentor_instance
            
            # Call function
            result = init_tracing(mock_app)
            
            # Verify exporter called without endpoint
            mock_exporter_class.assert_called_once_with()
            
            assert result == mock_provider

    def test_init_tracing_fastapi_instrumentation_failure(self):
        """Test tracing initialization when FastAPI instrumentation fails."""
        mock_app = Mock()
        
        with patch('app.core.tracing.settings') as mock_settings, \
             patch('app.core.tracing.trace') as mock_trace, \
             patch('app.core.tracing.TracerProvider') as mock_provider_class, \
             patch('app.core.tracing.Resource') as mock_resource_class, \
             patch('app.core.tracing.BatchSpanProcessor') as mock_processor_class, \
             patch('app.core.tracing.OTLPHTTPExporter') as mock_exporter_class, \
             patch('app.core.tracing.FastAPIInstrumentor') as mock_fastapi_instrumentor, \
             patch('app.core.tracing.OpenTelemetryMiddleware') as mock_middleware, \
             patch('app.core.tracing.HTTPXClientInstrumentor') as mock_httpx_instrumentor, \
             patch('app.core.tracing.SQLAlchemyInstrumentor') as mock_sqlalchemy_instrumentor:
            
            # Configure settings
            mock_settings.OTEL_ENABLED = True
            mock_settings.OTEL_SERVICE_NAME = "test-service"
            mock_settings.OTEL_ENVIRONMENT = "test"
            mock_settings.OTEL_EXPORTER_OTLP_ENDPOINT = ""
            
            # Configure mocks
            mock_provider = Mock()
            mock_provider_class.return_value = mock_provider
            
            mock_resource = Mock()
            mock_resource_class.create.return_value = mock_resource
            
            mock_exporter = Mock()
            mock_exporter_class.return_value = mock_exporter
            
            mock_processor = Mock()
            mock_processor_class.return_value = mock_processor
            
            # Make FastAPI instrumentation fail
            mock_fastapi_instrumentor.instrument_app.side_effect = Exception("FastAPI instrumentation failed")
            
            mock_httpx_instrumentor_instance = Mock()
            mock_httpx_instrumentor.return_value = mock_httpx_instrumentor_instance
            
            mock_sqlalchemy_instrumentor_instance = Mock()
            mock_sqlalchemy_instrumentor.return_value = mock_sqlalchemy_instrumentor_instance
            
            # Call function
            result = init_tracing(mock_app)
            
            # Should still succeed despite FastAPI instrumentation failure
            assert result == mock_provider

    def test_init_tracing_middleware_failure(self):
        """Test tracing initialization when middleware addition fails."""
        mock_app = Mock()
        mock_app.add_middleware.side_effect = Exception("Middleware addition failed")
        
        with patch('app.core.tracing.settings') as mock_settings, \
             patch('app.core.tracing.trace') as mock_trace, \
             patch('app.core.tracing.TracerProvider') as mock_provider_class, \
             patch('app.core.tracing.Resource') as mock_resource_class, \
             patch('app.core.tracing.BatchSpanProcessor') as mock_processor_class, \
             patch('app.core.tracing.OTLPHTTPExporter') as mock_exporter_class, \
             patch('app.core.tracing.FastAPIInstrumentor') as mock_fastapi_instrumentor, \
             patch('app.core.tracing.OpenTelemetryMiddleware') as mock_middleware, \
             patch('app.core.tracing.HTTPXClientInstrumentor') as mock_httpx_instrumentor, \
             patch('app.core.tracing.SQLAlchemyInstrumentor') as mock_sqlalchemy_instrumentor:
            
            # Configure settings
            mock_settings.OTEL_ENABLED = True
            mock_settings.OTEL_SERVICE_NAME = "test-service"
            mock_settings.OTEL_ENVIRONMENT = "test"
            mock_settings.OTEL_EXPORTER_OTLP_ENDPOINT = ""
            
            # Configure mocks
            mock_provider = Mock()
            mock_provider_class.return_value = mock_provider
            
            mock_resource = Mock()
            mock_resource_class.create.return_value = mock_resource
            
            mock_exporter = Mock()
            mock_exporter_class.return_value = mock_exporter
            
            mock_processor = Mock()
            mock_processor_class.return_value = mock_processor
            
            mock_fastapi_instrumentor_instance = Mock()
            mock_fastapi_instrumentor.instrument_app = mock_fastapi_instrumentor_instance
            
            mock_httpx_instrumentor_instance = Mock()
            mock_httpx_instrumentor.return_value = mock_httpx_instrumentor_instance
            
            mock_sqlalchemy_instrumentor_instance = Mock()
            mock_sqlalchemy_instrumentor.return_value = mock_sqlalchemy_instrumentor_instance
            
            # Call function
            result = init_tracing(mock_app)
            
            # Should still succeed despite middleware failure
            assert result == mock_provider

    def test_init_tracing_httpx_instrumentation_failure(self):
        """Test tracing initialization when HTTPX instrumentation fails."""
        mock_app = Mock()
        
        with patch('app.core.tracing.settings') as mock_settings, \
             patch('app.core.tracing.trace') as mock_trace, \
             patch('app.core.tracing.TracerProvider') as mock_provider_class, \
             patch('app.core.tracing.Resource') as mock_resource_class, \
             patch('app.core.tracing.BatchSpanProcessor') as mock_processor_class, \
             patch('app.core.tracing.OTLPHTTPExporter') as mock_exporter_class, \
             patch('app.core.tracing.FastAPIInstrumentor') as mock_fastapi_instrumentor, \
             patch('app.core.tracing.OpenTelemetryMiddleware') as mock_middleware, \
             patch('app.core.tracing.HTTPXClientInstrumentor') as mock_httpx_instrumentor, \
             patch('app.core.tracing.SQLAlchemyInstrumentor') as mock_sqlalchemy_instrumentor:
            
            # Configure settings
            mock_settings.OTEL_ENABLED = True
            mock_settings.OTEL_SERVICE_NAME = "test-service"
            mock_settings.OTEL_ENVIRONMENT = "test"
            mock_settings.OTEL_EXPORTER_OTLP_ENDPOINT = ""
            
            # Configure mocks
            mock_provider = Mock()
            mock_provider_class.return_value = mock_provider
            
            mock_resource = Mock()
            mock_resource_class.create.return_value = mock_resource
            
            mock_exporter = Mock()
            mock_exporter_class.return_value = mock_exporter
            
            mock_processor = Mock()
            mock_processor_class.return_value = mock_processor
            
            mock_fastapi_instrumentor_instance = Mock()
            mock_fastapi_instrumentor.instrument_app = mock_fastapi_instrumentor_instance
            
            # Make HTTPX instrumentation fail
            mock_httpx_instrumentor_instance = Mock()
            mock_httpx_instrumentor_instance.instrument.side_effect = Exception("HTTPX instrumentation failed")
            mock_httpx_instrumentor.return_value = mock_httpx_instrumentor_instance
            
            mock_sqlalchemy_instrumentor_instance = Mock()
            mock_sqlalchemy_instrumentor.return_value = mock_sqlalchemy_instrumentor_instance
            
            # Call function
            result = init_tracing(mock_app)
            
            # Should still succeed despite HTTPX instrumentation failure
            assert result == mock_provider

    def test_init_tracing_sqlalchemy_instrumentation_failure(self):
        """Test tracing initialization when SQLAlchemy instrumentation fails."""
        mock_app = Mock()
        
        with patch('app.core.tracing.settings') as mock_settings, \
             patch('app.core.tracing.trace') as mock_trace, \
             patch('app.core.tracing.TracerProvider') as mock_provider_class, \
             patch('app.core.tracing.Resource') as mock_resource_class, \
             patch('app.core.tracing.BatchSpanProcessor') as mock_processor_class, \
             patch('app.core.tracing.OTLPHTTPExporter') as mock_exporter_class, \
             patch('app.core.tracing.FastAPIInstrumentor') as mock_fastapi_instrumentor, \
             patch('app.core.tracing.OpenTelemetryMiddleware') as mock_middleware, \
             patch('app.core.tracing.HTTPXClientInstrumentor') as mock_httpx_instrumentor, \
             patch('app.core.tracing.SQLAlchemyInstrumentor') as mock_sqlalchemy_instrumentor:
            
            # Configure settings
            mock_settings.OTEL_ENABLED = True
            mock_settings.OTEL_SERVICE_NAME = "test-service"
            mock_settings.OTEL_ENVIRONMENT = "test"
            mock_settings.OTEL_EXPORTER_OTLP_ENDPOINT = ""
            
            # Configure mocks
            mock_provider = Mock()
            mock_provider_class.return_value = mock_provider
            
            mock_resource = Mock()
            mock_resource_class.create.return_value = mock_resource
            
            mock_exporter = Mock()
            mock_exporter_class.return_value = mock_exporter
            
            mock_processor = Mock()
            mock_processor_class.return_value = mock_processor
            
            mock_fastapi_instrumentor_instance = Mock()
            mock_fastapi_instrumentor.instrument_app = mock_fastapi_instrumentor_instance
            
            mock_httpx_instrumentor_instance = Mock()
            mock_httpx_instrumentor.return_value = mock_httpx_instrumentor_instance
            
            # Make SQLAlchemy instrumentation fail
            mock_sqlalchemy_instrumentor_instance = Mock()
            mock_sqlalchemy_instrumentor_instance.instrument.side_effect = Exception("SQLAlchemy instrumentation failed")
            mock_sqlalchemy_instrumentor.return_value = mock_sqlalchemy_instrumentor_instance
            
            # Call function
            result = init_tracing(mock_app)
            
            # Should still succeed despite SQLAlchemy instrumentation failure
            assert result == mock_provider

    def test_init_tracing_import_error(self):
        """Test tracing initialization when OpenTelemetry import fails."""
        mock_app = Mock()
        
        with patch('app.core.tracing.settings') as mock_settings, \
             patch('app.core.tracing.trace', side_effect=ImportError("OpenTelemetry not available")):
            
            # Configure settings
            mock_settings.OTEL_ENABLED = True
            
            # Call function
            result = init_tracing(mock_app)
            
            # Should return None on import error
            assert result is None

    def test_init_tracing_general_exception(self):
        """Test tracing initialization when general exception occurs."""
        mock_app = Mock()
        
        with patch('app.core.tracing.settings') as mock_settings, \
             patch('app.core.tracing.trace', side_effect=Exception("General error")):
            
            # Configure settings
            mock_settings.OTEL_ENABLED = True
            
            # Call function
            result = init_tracing(mock_app)
            
            # Should return None on general exception
            assert result is None

    def test_init_tracing_default_service_name(self):
        """Test tracing initialization with default service name."""
        mock_app = Mock()
        
        with patch('app.core.tracing.settings') as mock_settings, \
             patch('app.core.tracing.trace') as mock_trace, \
             patch('app.core.tracing.TracerProvider') as mock_provider_class, \
             patch('app.core.tracing.Resource') as mock_resource_class, \
             patch('app.core.tracing.BatchSpanProcessor') as mock_processor_class, \
             patch('app.core.tracing.OTLPHTTPExporter') as mock_exporter_class, \
             patch('app.core.tracing.FastAPIInstrumentor') as mock_fastapi_instrumentor, \
             patch('app.core.tracing.OpenTelemetryMiddleware') as mock_middleware, \
             patch('app.core.tracing.HTTPXClientInstrumentor') as mock_httpx_instrumentor, \
             patch('app.core.tracing.SQLAlchemyInstrumentor') as mock_sqlalchemy_instrumentor:
            
            # Configure settings without service name
            mock_settings.OTEL_ENABLED = True
            mock_settings.OTEL_ENVIRONMENT = "test"
            mock_settings.OTEL_EXPORTER_OTLP_ENDPOINT = ""
            
            # Configure mocks
            mock_provider = Mock()
            mock_provider_class.return_value = mock_provider
            
            mock_resource = Mock()
            mock_resource_class.create.return_value = mock_resource
            
            mock_exporter = Mock()
            mock_exporter_class.return_value = mock_exporter
            
            mock_processor = Mock()
            mock_processor_class.return_value = mock_processor
            
            mock_fastapi_instrumentor_instance = Mock()
            mock_fastapi_instrumentor.instrument_app = mock_fastapi_instrumentor_instance
            
            mock_httpx_instrumentor_instance = Mock()
            mock_httpx_instrumentor.return_value = mock_httpx_instrumentor_instance
            
            mock_sqlalchemy_instrumentor_instance = Mock()
            mock_sqlalchemy_instrumentor.return_value = mock_sqlalchemy_instrumentor_instance
            
            # Call function
            result = init_tracing(mock_app)
            
            # Should use default service name
            mock_resource_class.create.assert_called_once_with({
                "service.name": "ai-companion-backend",
                "deployment.environment": "test",
            })
            
            assert result == mock_provider

    def test_init_tracing_default_environment(self):
        """Test tracing initialization with default environment."""
        mock_app = Mock()
        
        with patch('app.core.tracing.settings') as mock_settings, \
             patch('app.core.tracing.trace') as mock_trace, \
             patch('app.core.tracing.TracerProvider') as mock_provider_class, \
             patch('app.core.tracing.Resource') as mock_resource_class, \
             patch('app.core.tracing.BatchSpanProcessor') as mock_processor_class, \
             patch('app.core.tracing.OTLPHTTPExporter') as mock_exporter_class, \
             patch('app.core.tracing.FastAPIInstrumentor') as mock_fastapi_instrumentor, \
             patch('app.core.tracing.OpenTelemetryMiddleware') as mock_middleware, \
             patch('app.core.tracing.HTTPXClientInstrumentor') as mock_httpx_instrumentor, \
             patch('app.core.tracing.SQLAlchemyInstrumentor') as mock_sqlalchemy_instrumentor:
            
            # Configure settings without environment
            mock_settings.OTEL_ENABLED = True
            mock_settings.OTEL_SERVICE_NAME = "test-service"
            mock_settings.OTEL_EXPORTER_OTLP_ENDPOINT = ""
            
            # Configure mocks
            mock_provider = Mock()
            mock_provider_class.return_value = mock_provider
            
            mock_resource = Mock()
            mock_resource_class.create.return_value = mock_resource
            
            mock_exporter = Mock()
            mock_exporter_class.return_value = mock_exporter
            
            mock_processor = Mock()
            mock_processor_class.return_value = mock_processor
            
            mock_fastapi_instrumentor_instance = Mock()
            mock_fastapi_instrumentor.instrument_app = mock_fastapi_instrumentor_instance
            
            mock_httpx_instrumentor_instance = Mock()
            mock_httpx_instrumentor.return_value = mock_httpx_instrumentor_instance
            
            mock_sqlalchemy_instrumentor_instance = Mock()
            mock_sqlalchemy_instrumentor.return_value = mock_sqlalchemy_instrumentor_instance
            
            # Call function
            result = init_tracing(mock_app)
            
            # Should use default environment
            mock_resource_class.create.assert_called_once_with({
                "service.name": "test-service",
                "deployment.environment": "dev",
            })
            
            assert result == mock_provider
