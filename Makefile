# Simple developer convenience targets

.PHONY: test-audit

# Run memory audit integration tests
# Usage: make test-audit
test-audit:
	pytest -q tests/integration/test_memory_audit.py --maxfail=1
