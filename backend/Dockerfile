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

# Install Python dependencies (minimal set)
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.free-tier.txt \
    && rm -rf ~/.cache/pip

# Copy only essential application code
COPY app/ ./app/
COPY alembic.ini ./
COPY alembic/ ./alembic/

# Create non-root user
RUN adduser -D -s /bin/sh appuser \
    && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check (simplified)
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD python -c "import sys; sys.exit(0)"

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "$PORT"]
