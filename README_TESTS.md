# Test Suite Organization

This document describes the reorganized test structure for the AI Companion project.

## Directory Structure

```
tests/
├── unit/                    # Unit tests for individual components
│   ├── test_api_endpoints.py      # API endpoint validation
│   └── test_auth_validation.py    # Authentication & authorization
├── integration/             # Integration tests for system components
│   ├── test_memory_integration.py # Memory capture, storage, retrieval
│   └── test_conversation_flow.py  # Conversation flow and context
├── evaluation/              # AI model evaluation and performance
│   ├── test_chat_evaluation.py    # Comprehensive chat evaluation
│   └── test_flow_simulation.py    # Multi-turn conversation simulation
├── e2e/                     # End-to-end user journey tests
│   └── test_complete_user_flows.py # Complete user workflows
├── fixtures/                # Test data and fixtures
├── conftest.py             # Pytest configuration
└── run_all_tests.py        # Main test runner
```

## Running Tests

### All Tests
```bash
python tests/run_all_tests.py
```

### Specific Test Categories
```bash
# Unit tests only
python tests/run_all_tests.py --unit-only

# Integration tests only
python tests/run_all_tests.py --integration-only

# Evaluation tests only
python tests/run_all_tests.py --evaluation-only

# E2E tests only
python tests/run_all_tests.py --e2e-only

# Skip E2E tests (faster)
python tests/run_all_tests.py --skip-e2e
```

### Individual Test Files
```bash
# Unit tests
python tests/unit/test_api_endpoints.py
python tests/unit/test_auth_validation.py

# Integration tests
python tests/integration/test_memory_integration.py
python tests/integration/test_conversation_flow.py

# Evaluation tests
python tests/evaluation/test_chat_evaluation.py
python tests/evaluation/test_flow_simulation.py

# E2E tests
python tests/e2e/test_complete_user_flows.py
```

## Test Categories

### Unit Tests
- **API Endpoints**: Tests individual API endpoints for correct responses and error handling
- **Auth Validation**: Tests authentication mechanisms and access control

### Integration Tests
- **Memory Integration**: End-to-end testing of memory capture, storage, and retrieval
- **Conversation Flow**: Tests conversation functionality including context and continuity

### Evaluation Tests
- **Chat Evaluation**: Comprehensive evaluation across multiple dimensions (instruction following, coherence, memory recall, safety, tone)
- **Flow Simulation**: Multi-turn conversation coherence and continuity testing

### E2E Tests
- **Complete User Flows**: Tests complete user journeys from onboarding to advanced features

## Test Configuration

### Environment Variables
- `CHAT_API_BASE`: Base URL for API (default: http://localhost:8000)
- `USERNAME`: Test username (default: test@example.com)
- `PASSWORD`: Test password (default: testpassword123)

### Prerequisites
- Backend server running on localhost:8000
- Test user account configured
- Required dependencies installed

## Removed Legacy Files

The following duplicate and legacy test files were removed during reorganization:

### From /scripts:
- `chat_eval.py` → moved to `tests/evaluation/test_chat_evaluation.py`
- `chat_flow_test.py` → moved to `tests/evaluation/test_flow_simulation.py`
- `comprehensive_chat_test.py` → consolidated into integration tests
- `test_memory_flow.py` → moved to `tests/integration/test_memory_integration.py`
- `comprehensive_app_testing.py` → replaced by `run_all_tests.py`
- `llm_enhanced_testing.py` → functionality integrated into evaluation tests
- `run_comprehensive_tests.py` → replaced by `run_all_tests.py`

### From /tests:
- `test_conversation_endpoints.py` → consolidated into `test_api_endpoints.py`
- `test_chat_comprehensive.py` → split into integration and evaluation tests
- `test_deepseek_connection.py` → removed (provider-specific)
- `test_deepseek_key.py` → removed (provider-specific)
- `test_new_deepseek_key.py` → removed (provider-specific)
- `test_openrouter_connection.py` → removed (provider-specific)

## Benefits of Reorganization

1. **Clear Separation**: Tests are organized by scope (unit, integration, evaluation, e2e)
2. **Reduced Duplication**: Eliminated overlapping test functionality
3. **Modular Design**: Each test file is under 400 lines and focused on specific functionality
4. **Consistent Interface**: All test files follow similar patterns and can be run independently
5. **Comprehensive Coverage**: Full test suite covers all aspects from individual components to complete user journeys
6. **Easy Maintenance**: Clear structure makes it easy to add new tests and maintain existing ones

## Test Thresholds

- **Unit Tests**: 80% pass rate required
- **Integration Tests**: 80% pass rate required
- **Evaluation Tests**: 80% overall score required
- **E2E Tests**: 60% pass rate required (more lenient due to complexity)

## Reports

Test results are saved to the `reports/` directory:
- `chat_eval_results.json`: Detailed evaluation results
- `chat_simulation_scores.json`: Flow simulation results
