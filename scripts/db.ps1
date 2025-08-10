param(
  [ValidateSet('up','down','reset','migrate','revision','status')]
  [string]$Action = 'up',
  [string]$Message = ''
)

Set-Location -Path (Join-Path $PSScriptRoot '..')

function Compose {
  docker-compose @args
}

switch ($Action) {
  'up' {
    Compose up -d db
    Write-Host 'Waiting for Postgres to be healthy...'
    Start-Sleep -Seconds 3
    python -m alembic upgrade head | cat
  }
  'down' {
    Compose down
  }
  'reset' {
    Compose down -v
    Compose up -d db
    Write-Host 'Waiting for Postgres to be healthy...'
    Start-Sleep -Seconds 5
    python -m alembic upgrade head | cat
    python init_db.py | cat
  }
  'migrate' {
    python -m alembic upgrade head | cat
  }
  'revision' {
    if (-not $Message) { $Message = 'auto' }
    python -m alembic revision --autogenerate -m $Message | cat
  }
  'status' {
    python -m alembic current | cat
    python -m alembic history | cat
  }
}


