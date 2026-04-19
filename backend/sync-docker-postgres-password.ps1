# Sets PostgreSQL user "mado" password to match the app (SPRING_DATASOURCE_PASSWORD or mado_secret).
# Use when Postgres runs via Docker Compose from this repo. Run from anywhere:
#   powershell -File "D:\path\to\Kick Live\backend\sync-docker-postgres-password.ps1"

$ErrorActionPreference = 'Stop'
$ScriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$ProjectRoot = Split-Path -Parent $ScriptDir
$pw = if ($env:SPRING_DATASOURCE_PASSWORD) { $env:SPRING_DATASOURCE_PASSWORD } else { "mado_secret" }
$pwSql = $pw -replace "'", "''"

Push-Location $ProjectRoot
try {
    $ErrorActionPreference = 'Continue'
    & docker compose exec -T postgres psql -U mado -d madodb -c "ALTER USER mado WITH PASSWORD '$pwSql';"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed. Is Docker running and postgres container up? Try: docker compose up -d postgres" -ForegroundColor Red
        exit 1
    }
    Write-Host "Password for user 'mado' updated to match app config." -ForegroundColor Green
} finally {
    Pop-Location
}
