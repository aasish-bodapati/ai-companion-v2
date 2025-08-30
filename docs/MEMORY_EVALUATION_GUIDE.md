# Memory System Evaluation Guide

This guide provides comprehensive instructions for evaluating your memory capture, storage, and retrieval system.

## Overview

The memory evaluation framework provides:
- **Automated testing** of all memory system components
- **Performance benchmarking** with detailed metrics
- **Real-time monitoring** and alerting
- **Comprehensive reporting** in multiple formats

## Architecture Components

### Core Evaluation Framework
- `memory_evaluation_framework.py` - Main evaluation logic
- `test_memory_evaluation.py` - Automated test suite
- `run_memory_evaluation.py` - CLI evaluation runner

### Monitoring System
- `memory_metrics.py` - Real-time metrics collection
- `memory_monitoring.py` - REST API endpoints
- Performance dashboards and alerting

## Quick Start

### 1. Run Basic Evaluation

```bash
# Run evaluation for a specific user
python scripts/run_memory_evaluation.py --user-id user123 --verbose

# Generate both JSON and Markdown reports
python scripts/run_memory_evaluation.py --user-id user123 --format both
```

### 2. Run Automated Tests

```bash
# Run the full test suite
pytest tests/test_memory_evaluation.py -v

# Run specific test categories
pytest tests/test_memory_evaluation.py::test_memory_capture_evaluation -v
```

### 3. Access Monitoring Dashboard

```bash
# Start the API server
uvicorn app.main:app --reload

# Access monitoring endpoints
curl http://localhost:8000/api/v1/memory-monitoring/health
curl http://localhost:8000/api/v1/memory-monitoring/dashboard
```

## Evaluation Metrics

### Memory Capture Metrics
- **Capture Accuracy**: How well the system extracts relevant information
- **Extraction Precision**: Accuracy of LLM-based memory extraction
- **Extraction Recall**: Completeness of memory extraction
- **Importance Scoring**: Accuracy of importance classification

### Storage System Metrics
- **Storage Efficiency**: Compression and space utilization
- **Storage Latency**: Time to store memories
- **Compression Ratio**: Data compression effectiveness
- **Deduplication Rate**: Duplicate detection and removal

### Retrieval System Metrics
- **Retrieval Precision**: Relevance of returned memories
- **Retrieval Recall**: Completeness of relevant memory retrieval
- **Retrieval Latency**: Time to retrieve memories
- **Contextual Relevance**: Quality of context-aware retrieval
- **Ranking Quality**: Effectiveness of memory ranking

### System Performance Metrics
- **Cache Hit Rate**: Efficiency of caching layers
- **Memory Usage**: System memory consumption
- **Throughput**: Operations per second
- **Error Rate**: System reliability

## Test Cases

The framework includes predefined test cases covering:

### 1. Preference Capture
```python
input_text = "I really love Italian food, especially pasta carbonara"
expected_memories = ["User loves Italian food", "Prefers pasta carbonara"]
```

### 2. Factual Information
```python
input_text = "My birthday is March 15th, 1990. I live in San Francisco."
expected_memories = ["Birthday: March 15th, 1990", "Lives in San Francisco"]
```

### 3. Emotional Context
```python
input_text = "I'm feeling really stressed about my job interview tomorrow"
expected_memories = ["Has job interview tomorrow", "Feeling stressed about interview"]
```

### 4. Low-Importance Filtering
```python
input_text = "Hello, how are you today?"
expected_memories = []  # Should not capture greetings
```

### 5. Complex Context
```python
input_text = "I've been working on a machine learning project for 3 months..."
expected_memories = [
    "Working on ML project for 3 months",
    "Project: predicting customer churn with neural networks",
    "Project deadline: next Friday"
]
```

## Custom Test Cases

### Adding New Test Cases

```python
from tests.memory_evaluation_framework import EvaluationTestCase

custom_test = EvaluationTestCase(
    test_id="custom_test",
    description="Test custom scenario",
    input_text="Your test input",
    expected_memories=["Expected memory 1", "Expected memory 2"],
    expected_importance=0.8,
    context={"theme": "custom_theme"},
    emotional_state="neutral"
)
```

### Running Custom Evaluations

```python
from tests.memory_evaluation_framework import MemoryEvaluationFramework

framework = MemoryEvaluationFramework(db)
framework.test_cases.append(custom_test)
results = framework.run_comprehensive_evaluation(user_id)
```

## Monitoring and Alerting

### Real-Time Metrics Collection

The monitoring system automatically tracks:
- Memory operation performance
- Cache hit rates
- Error rates and types
- System resource usage

### Alert Thresholds

Default alert thresholds:
```python
alert_thresholds = {
    "capture_accuracy": 0.7,
    "storage_latency_ms": 100,
    "retrieval_latency_ms": 50,
    "error_rate": 0.05,
    "cache_hit_rate": 0.6
}
```

### Custom Monitoring

```python
from app.monitoring.memory_metrics import memory_monitor

# Track custom operations
with memory_monitor.metrics_collector.timer("custom_operation"):
    # Your operation here
    pass

# Record custom metrics
memory_monitor.metrics_collector.record_metric(
    "custom_metric", 
    value=0.85, 
    tags={"component": "custom"}
)
```

## API Endpoints

### Health Check
```http
GET /api/v1/memory-monitoring/health
```

### Performance Dashboard
```http
GET /api/v1/memory-monitoring/dashboard
```

### Metrics
```http
GET /api/v1/memory-monitoring/metrics?hours=24
```

### Alerts
```http
GET /api/v1/memory-monitoring/alerts?limit=50&severity=critical
```

### Run Evaluation
```http
POST /api/v1/memory-monitoring/evaluation/run
{
    "user_id": "user123"
}
```

### Get Report
```http
GET /api/v1/memory-monitoring/evaluation/report/user123?format=markdown
```

## Performance Benchmarks

### Target Performance Metrics

| Metric | Target | Good | Needs Improvement |
|--------|--------|------|-------------------|
| Capture Accuracy | >90% | >80% | <80% |
| Storage Latency | <50ms | <100ms | >100ms |
| Retrieval Latency | <25ms | <50ms | >50ms |
| Cache Hit Rate | >80% | >60% | <60% |
| Error Rate | <1% | <5% | >5% |
| Compression Ratio | >50% | >30% | <30% |

### Load Testing

```python
# Run performance evaluation
framework = MemoryEvaluationFramework(db)
perf_results = framework.evaluate_performance(user_id)

# Check throughput
throughput = perf_results["throughput_ops_per_sec"]
assert throughput > 100  # Target: >100 ops/sec
```

## Troubleshooting

### Common Issues

#### Low Capture Accuracy
- Check LLM model configuration
- Review extraction prompts
- Validate test case expectations

#### High Storage Latency
- Check database connection
- Review compression settings
- Monitor disk I/O

#### Poor Retrieval Quality
- Validate embedding model
- Check FAISS index health
- Review contextual retrieval logic

#### Cache Performance Issues
- Monitor cache hit rates
- Adjust cache sizes
- Review eviction policies

### Debug Mode

```python
# Enable debug logging
import logging
logging.getLogger("app.memory").setLevel(logging.DEBUG)

# Run evaluation with debug info
results = framework.evaluate_memory_capture(user_id)
```

## Continuous Integration

### Automated Testing

Add to your CI pipeline:

```yaml
- name: Run Memory Evaluation Tests
  run: |
    pytest tests/test_memory_evaluation.py --cov=app.memory
    python scripts/run_memory_evaluation.py --user-id test_user
```

### Performance Regression Detection

```python
# Compare against baseline
baseline_metrics = load_baseline_metrics()
current_metrics = run_memory_evaluation(db, user_id)

assert current_metrics["capture_accuracy"] >= baseline_metrics["capture_accuracy"] * 0.95
```

## Best Practices

### 1. Regular Evaluation
- Run comprehensive evaluations weekly
- Monitor key metrics daily
- Set up automated alerts

### 2. Test Case Maintenance
- Update test cases with real user scenarios
- Add edge cases as they're discovered
- Validate expected outcomes regularly

### 3. Performance Monitoring
- Track trends over time
- Set up performance baselines
- Monitor resource usage

### 4. Alert Management
- Configure appropriate thresholds
- Set up notification channels
- Review and act on alerts promptly

## Advanced Usage

### Custom Metrics

```python
from app.monitoring.memory_metrics import MemoryMetric

# Define custom metric
custom_metric = MemoryMetric(
    name="custom_relevance_score",
    value=0.85,
    timestamp=datetime.now(timezone.utc),
    tags={"user_type": "premium"},
    unit="score"
)

memory_monitor.metrics_collector.record_metric(
    custom_metric.name,
    custom_metric.value,
    custom_metric.tags,
    custom_metric.unit
)
```

### Integration with External Systems

```python
# Export metrics to external monitoring
def export_to_prometheus():
    metrics = memory_monitor.get_system_health()
    # Send to Prometheus/Grafana
    
def export_to_datadog():
    dashboard = memory_monitor.get_performance_dashboard()
    # Send to DataDog
```

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review system logs
3. Run diagnostic evaluations
4. Contact the development team

## Contributing

To contribute to the evaluation framework:
1. Add new test cases for edge cases
2. Implement additional metrics
3. Enhance monitoring capabilities
4. Improve documentation
