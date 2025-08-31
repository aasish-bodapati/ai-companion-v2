# Ultra-lightweight Dockerfile for free tier deployment - OPTIMIZED FOR FREE TIER
FROM python:3.11-alpine

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app:/usr/local/lib/python3.11/site-packages
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

# Install Python dependencies system-wide (accessible to all users)
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.free-tier.txt \
    && rm -rf ~/.cache/pip

# Debug: Check where packages were installed
RUN python -c "import sys; print('Python executable:', sys.executable); print('Python version:', sys.version); print('Python path:', sys.path)" \
    && python -c "import site; print('Site packages:', site.getsitepackages())" \
    && python -c "import alembic; print('Alembic location:', alembic.__file__)" \
    && ls -la /usr/local/lib/python3.11/site-packages/ | grep alembic

# Create non-root user after installing packages
RUN adduser -D -s /bin/sh appuser

# Copy only essential application code
COPY --chown=appuser:appuser app/ ./app/
COPY --chown=appuser:appuser alembic.ini ./
COPY --chown=appuser:appuser alembic/ ./alembic/

# Switch to non-root user
USER appuser

# Expose port (Railway will set the actual port via $PORT)
EXPOSE $PORT

# Health check (simplified)
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD python -c "import sys; sys.exit(0)"

# Run the application with explicit port handling and forced Python path
CMD PYTHONPATH=/app:/usr/local/lib/python3.11/site-packages python -c "import sys; print('CMD Python path:', sys.path)" && PYTHONPATH=/app:/usr/local/lib/python3.11/site-packages uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
