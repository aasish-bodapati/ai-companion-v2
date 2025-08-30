# Use Python 3.11 slim image
FROM python:3.11-slim

# Controls whether to install heavy optional deps (embeddings/OCR/doc parsing)
ARG INSTALL_EXTRAS=false

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PIP_NO_CACHE_DIR=1

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY requirements.base.txt ./
COPY requirements.extras.txt ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.base.txt \
    && if [ "$INSTALL_EXTRAS" = "true" ]; then pip install --no-cache-dir -r requirements.extras.txt; fi

# Copy project
COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser \
    && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD python -c "import sys,urllib.request; \
resp=urllib.request.urlopen('http://localhost:8000/api/v1/utils/health', timeout=10); \
sys.exit(0 if resp.status==200 else 1)"

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

