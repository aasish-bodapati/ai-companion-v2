param(
    [Parameter(Position=0)]
    [string]$Task
)

switch ($Task) {
    'test-audit' {
        pytest -q tests/integration/test_memory_audit.py --maxfail=1
        break
    }
    default {
        Write-Host "Usage: .\scripts\dev.ps1 <task>" -ForegroundColor Yellow
        Write-Host "Available tasks:" -ForegroundColor Yellow
        Write-Host "  test-audit    # Run memory audit integration tests" -ForegroundColor Yellow
        break
    }
}
