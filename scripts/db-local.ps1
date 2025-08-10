param(
  [ValidateSet('migrate','revision','reset','seed','status')]
  [string]$Action = 'migrate',
  [string]$Message = ''
)

# Ensure we're in backend dir for imports & alembic
$backendPath = Join-Path -Path $PSScriptRoot -ChildPath "..\backend"
Set-Location -Path $backendPath

# Expect local Postgres running at localhost:5432
if (-not $env:DATABASE_URL) {
  # Compose URL from parts if provided; otherwise default postgres/postgres
  $pgUser = $env:POSTGRES_USER; if (-not $pgUser) { $pgUser = 'postgres' }
  $pgPass = $env:POSTGRES_PASSWORD; if (-not $pgPass) { $pgPass = 'postgres' }
  $pgDb = $env:POSTGRES_DB; if (-not $pgDb) { $pgDb = 'ai_companion' }
  $env:DATABASE_URL = "postgresql://${pgUser}:${pgPass}@localhost:5432/${pgDb}"
}

switch ($Action) {
  'migrate' {
    alembic upgrade head | cat
  }
  'revision' {
    if (-not $Message) { $Message = 'auto' }
    alembic revision --autogenerate -m $Message | cat
  }
  'reset' {
    # Drop and recreate schema via alembic downgrade/upgrade
    # Warning: destructive
    alembic downgrade base | cat
    alembic upgrade head | cat
  }
  'seed' {
    python app/scripts/seed_users.py | cat
  }
  'status' {
    alembic current | cat
    alembic history | cat
  }
}


