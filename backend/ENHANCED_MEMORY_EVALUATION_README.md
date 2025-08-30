# Enhanced Memory Schema Evaluation Framework

This framework provides comprehensive testing and evaluation of the Enhanced Memory Schema, including all new capabilities: enhanced fields, relationships, evolution tracking, and advanced metadata processing.

## 🏗️ Framework Structure

The evaluation framework is split into three modular parts for maintainability:

### Part 1: Core Structure (`enhanced_memory_evaluation_part1.py`)
- **Data Classes**: `EnhancedMemoryMetrics` and `EnhancedMemoryTestCase`
- **Test Cases**: Comprehensive test scenarios covering all enhanced capabilities
- **Core Types**: Basic, intermediate, and advanced complexity levels

### Part 2: Evaluation Methods (`enhanced_memory_evaluation_part2.py`)
- **EnhancedMemoryEvaluator**: Main evaluation logic
- **Field Evaluation**: Tests enhanced field population and quality
- **Relationship Evaluation**: Tests relationship detection and quality
- **Evolution Evaluation**: Tests memory evolution tracking
- **Semantic Intelligence**: Tests entity extraction and emotional valence

### Part 3: Main Runner & Reports (`enhanced_memory_evaluation_part3.py`)
- **EnhancedMemorySchemaRunner**: Orchestrates all evaluations
- **Report Generation**: Creates comprehensive Markdown reports
- **Results Export**: Saves results in JSON format
- **Overall Scoring**: Calculates comprehensive enhanced schema score

## 🚀 Quick Start

### 1. Test the Framework
```bash
cd backend
python test_enhanced_memory_evaluation.py
```

### 2. Run Full Evaluation
```bash
python enhanced_memory_evaluation_part3.py
```

### 3. Run Individual Parts
```bash
# Test core structure
python enhanced_memory_evaluation_part1.py

# Test evaluation methods
python enhanced_memory_evaluation_part2.py

# Test main runner
python enhanced_memory_evaluation_part3.py
```

## 📊 What Gets Evaluated

### Enhanced Fields
- **Category & Subcategory**: Semantic organization of memories
- **Temporal Context**: Effective dates and expiration handling
- **Confidence Scoring**: Accuracy of memory information
- **Emotional Valence**: Sentiment analysis capabilities
- **Tags & Entities**: Semantic enrichment and extraction
- **Privacy Levels**: Sensitivity and access control

### Relationship Modeling
- **Automatic Detection**: How well relationships are identified
- **Relationship Types**: Support, contradiction, elaboration, etc.
- **Strength Calculation**: Relationship confidence scoring
- **Graph Connectivity**: Memory network structure

### Evolution Tracking
- **Memory Changes**: How memories evolve over time
- **Consolidation**: Merging and summarizing related memories
- **Forgetting**: Intelligent memory archival
- **Audit Trail**: Complete history of memory modifications

### Semantic Intelligence
- **Entity Extraction**: People, places, organizations, dates
- **Emotional Analysis**: Sentiment detection and scoring
- **Goal Relevance**: Memory importance to user objectives
- **Context Understanding**: Semantic relationship detection

## 🧪 Test Cases

The framework includes comprehensive test cases:

### Basic Level
- **Basic Enhanced Fields**: Simple field population testing
- **Preference Capture**: User preference extraction
- **Fact Storage**: Basic information storage

### Intermediate Level
- **Advanced Categorization**: Complex metadata handling
- **Relationship Detection**: Basic relationship identification
- **Temporal Context**: Date and time handling

### Advanced Level
- **Evolution Tracking**: Memory change management
- **Privacy Sensitivity**: Security and access control
- **Complex Relationships**: Multi-layered memory connections

## 📈 Metrics & Scoring

### Field Population Rate
- **Target**: >80%
- **Good**: 60-80%
- **Needs Improvement**: <60%

### Relationship Detection Rate
- **Target**: >70%
- **Good**: 50-70%
- **Needs Improvement**: <50%

### Evolution Tracking Rate
- **Target**: >70%
- **Good**: 50-70%
- **Needs Improvement**: <50%

### Semantic Intelligence
- **Entity Extraction**: Target >75%
- **Emotional Valence**: Target >70%

### Overall Enhanced Score
- **EXCELLENT**: >80%
- **GOOD**: 60-80%
- **NEEDS IMPROVEMENT**: <60%

## 📁 Output Files

### Results JSON
```json
{
  "timestamp": "2025-01-XX...",
  "user_id": "test_user",
  "enhanced_fields_evaluation": {...},
  "relationship_evaluation": {...},
  "evolution_evaluation": {...},
  "semantic_intelligence_evaluation": {...},
  "overall_enhanced_score": 0.XX
}
```

### Markdown Report
- Executive summary with key metrics
- Detailed results for each evaluation area
- Test case results and complexity analysis
- Recommendations for improvement
- Schema enhancement status

## 🔧 Customization

### Adding New Test Cases
```python
# In enhanced_memory_evaluation_part1.py
new_test_case = EnhancedMemoryTestCase(
    test_id="custom_test",
    description="Custom test description",
    input_data={"content": "Test content", "content_type": "test"},
    expected_enhanced_fields={"category": "custom", "subcategory": "test"},
    expected_relationships=[],
    expected_evolution=[],
    complexity_level="intermediate"
)
```

### Adding New Metrics
```python
# In enhanced_memory_evaluation_part1.py
@dataclass
class EnhancedMemoryMetrics:
    # ... existing metrics ...
    new_metric: float = 0.0
```

### Custom Evaluation Logic
```python
# In enhanced_memory_evaluation_part2.py
def evaluate_custom_capability(self, test_cases):
    # Custom evaluation logic
    pass
```

## 🚨 Troubleshooting

### Common Issues

#### Import Errors
- Ensure all three parts are in the same directory
- Check Python path and imports
- Verify file permissions

#### Test Failures
- Review error messages for specific issues
- Check test case data validity
- Verify metric calculation logic

#### Performance Issues
- Reduce number of test cases for faster execution
- Optimize evaluation algorithms
- Use mock data for development

### Debug Mode
```python
import logging
logging.getLogger().setLevel(logging.DEBUG)
```

## 📚 Integration

### With Existing Memory System
The framework is designed to work alongside your existing memory system:
- Import existing models and schemas
- Extend test cases with real data
- Integrate with production evaluation pipelines

### CI/CD Integration
```yaml
# Example GitHub Actions
- name: Run Enhanced Memory Evaluation
  run: |
    cd backend
    python enhanced_memory_evaluation_part3.py
    python test_enhanced_memory_evaluation.py
```

### Performance Monitoring
```python
# Monitor evaluation performance
import time
start_time = time.time()
results = runner.run_comprehensive_evaluation(user_id)
execution_time = time.time() - start_time
print(f"Evaluation completed in {execution_time:.2f} seconds")
```

## 🎯 Best Practices

### 1. Regular Evaluation
- Run comprehensive evaluations weekly
- Monitor key metrics daily
- Set up automated alerts for score drops

### 2. Test Case Maintenance
- Keep test cases up to date with schema changes
- Add new test cases for new capabilities
- Remove obsolete test cases

### 3. Metric Tracking
- Track metrics over time for trend analysis
- Set up baselines for performance comparison
- Document metric changes and improvements

### 4. Report Analysis
- Review recommendations regularly
- Prioritize improvements based on scores
- Share results with development team

## 🔮 Future Enhancements

### Planned Features
- **Real-time Monitoring**: Live metric tracking
- **Machine Learning**: Automated test case generation
- **Performance Profiling**: Detailed performance analysis
- **Integration Testing**: End-to-end system validation

### Extension Points
- **Custom Evaluators**: Plugin-based evaluation modules
- **API Integration**: REST API for remote evaluation
- **Dashboard**: Web-based results visualization
- **Alerting**: Automated notification system

## 📞 Support

### Getting Help
- Review error messages and logs
- Check test case configurations
- Verify framework dependencies
- Consult framework documentation

### Contributing
- Follow existing code structure
- Add comprehensive test coverage
- Document new features
- Maintain backward compatibility

---

**🎉 The Enhanced Memory Schema evaluation framework is ready to comprehensively test and score your enhanced memory capabilities!**
