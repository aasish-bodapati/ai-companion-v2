param(
  [ValidateSet('up','down','reset','migrate','revision','status')]
  [string]$Action = 'up',
  [string]$Message = ''
)

Set-Location -Path (Join-Path $PSScriptRoot '..')

# Check if PostgreSQL is running locally
function Test-PostgreSQL {
  try {
    $psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
    if (-not (Test-Path $psqlPath)) {
      Write-Host "PostgreSQL client not found at: $psqlPath"
      return $false
    }
    & $psqlPath -h localhost -U postgres -d postgres -c "SELECT 1;" 2>$null
    return $LASTEXITCODE -eq 0
  }
  catch {
    return $false
  }
}

switch ($Action) {
  'up' {
    if (-not (Test-PostgreSQL)) {
      Write-Host "PostgreSQL is not running. Please start PostgreSQL service first."
      Write-Host "On Windows, you can start it from Services or use: net start postgresql-x64-17"
      exit 1
    }
    Write-Host 'PostgreSQL is running. Running migrations...'
    python -m alembic upgrade head
  }
  'down' {
    Write-Host 'PostgreSQL is running locally. Use Windows Services to stop it if needed.'
  }
  'reset' {
    if (-not (Test-PostgreSQL)) {
      Write-Host "PostgreSQL is not running. Please start PostgreSQL service first."
      exit 1
    }
    Write-Host 'Dropping and recreating database...'
    $psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
    & $psqlPath -h localhost -U postgres -d postgres -c "DROP DATABASE IF EXISTS ai_companion;"
    & $psqlPath -h localhost -U postgres -d postgres -c "CREATE DATABASE ai_companion;"
    Write-Host 'Running migrations...'
    python -m alembic upgrade head
    python ..\init_db.py
  }
  'migrate' {
    python -m alembic upgrade head
  }
  'revision' {
    if (-not $Message) { $Message = 'auto' }
    python -m alembic revision --autogenerate -m $Message
  }
  'status' {
    python -m alembic current
    python -m alembic history
  }
}


