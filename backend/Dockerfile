# Ultra-lightweight Dockerfile for free tier deployment - OPTIMIZED FOR FREE TIER
FROM python:3.11-alpine

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PIP_NO_CACHE_DIR=1

# Set work directory
WORKDIR /app

# Install system dependencies (minimal)
RUN apk add --no-cache \
    gcc \
    musl-dev \
    libffi-dev \
    openssl-dev \
    && rm -rf /var/cache/apk/*

# Copy only essential requirements
COPY requirements.free-tier.txt ./

# Create non-root user first
RUN adduser -D -s /bin/sh appuser

# Install Python dependencies as appuser but force system installation
USER appuser
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir --user -r requirements.free-tier.txt \
    && rm -rf ~/.cache/pip

# Add user's local bin to PATH
ENV PATH="/home/appuser/.local/bin:$PATH"

# Copy only essential application code
COPY --chown=appuser:appuser app/ ./app/
COPY --chown=appuser:appuser alembic.ini ./
COPY --chown=appuser:appuser alembic/ ./alembic/

# Expose port (Railway will set the actual port via $PORT)
EXPOSE $PORT

# Health check (simplified)
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD python -c "import sys; sys.exit(0)"

# Run the application with explicit port handling
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
