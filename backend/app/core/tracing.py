import logging
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def init_tracing(app) -> Optional[object]:
    """Initialize OpenTelemetry tracing if enabled in settings.

    Returns the tracer provider (or None) so callers can keep a reference
    if they need to shut it down explicitly.
    """
    if not getattr(settings, "OTEL_ENABLED", False):
        logger.info("OpenTelemetry disabled by config; skipping init")
        return None

    try:
        # Core SDK + OTLP exporter
        from opentelemetry import trace
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.resources import Resource
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import (
            OTLPSpanExporter as OTLPHTTPExporter,
        )

        # Instrumentations
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
        from opentelemetry.instrumentation.asgi import OpenTelemetryMiddleware
        from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
        from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor

        service_name = getattr(settings, "OTEL_SERVICE_NAME", "ai-companion-backend")
        environment = getattr(settings, "OTEL_ENVIRONMENT", "dev")
        endpoint = getattr(settings, "OTEL_EXPORTER_OTLP_ENDPOINT", "").strip()

        resource = Resource.create(
            {
                "service.name": service_name,
                "deployment.environment": environment,
            }
        )

        provider = TracerProvider(resource=resource)
        trace.set_tracer_provider(provider)

        # Exporter: prefer HTTP/protobuf OTLP
        if endpoint:
            exporter = OTLPHTTPExporter(endpoint=f"{endpoint}/v1/traces")
        else:
            exporter = OTLPHTTPExporter()  # rely on env defaults

        processor = BatchSpanProcessor(exporter)
        provider.add_span_processor(processor)

        # Instrument FastAPI app and ASGI middleware
        try:
            FastAPIInstrumentor.instrument_app(
                app, server_request_hook=None, client_request_hook=None
            )
        except Exception as e:
            logger.debug("FastAPIInstrumentor.instrument_app failed: %s", e)
        try:
            # Add ASGI middleware to capture route spans
            app.add_middleware(OpenTelemetryMiddleware)
        except Exception as e:
            logger.debug("Adding OpenTelemetryMiddleware failed: %s", e)

        # Instrument HTTPX
        try:
            HTTPXClientInstrumentor().instrument()
        except Exception as e:
            logger.debug("HTTPXClientInstrumentor.instrument failed: %s", e)

        # Instrument SQLAlchemy (no-op if not used)
        try:
            SQLAlchemyInstrumentor().instrument()
        except Exception as e:
            logger.debug("SQLAlchemyInstrumentor.instrument failed: %s", e)

        logger.info(
            "OpenTelemetry initialized: service=%s env=%s endpoint=%s",
            service_name,
            environment,
            endpoint or "env-defaults",
        )
        return provider
    except Exception as e:
        logger.error("Failed to initialize OpenTelemetry: %s", e, exc_info=True)
        return None
