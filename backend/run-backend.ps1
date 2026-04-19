[CmdletBinding()]
param(
    [switch]$SkipBuild,
    [int]$Port = 8090,
    [string]$Profile = "local",
    [switch]$UseDockerFallback,
    [switch]$DockerDeps
)

$ErrorActionPreference = 'Stop'
$ScriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
Set-Location $ScriptDir

$localCreds = Join-Path $ScriptDir "local-credentials.yml"
$localCredsEx = Join-Path $ScriptDir "local-credentials.yml.example"
if (-not (Test-Path $localCreds) -and (Test-Path $localCredsEx)) {
    Copy-Item $localCredsEx $localCreds
    Write-Host "[run-backend] Created local-credentials.yml from example. Set datasource.password only if your Postgres password is not the default chain (admin)." -ForegroundColor Yellow
}

$env:SPRING_PROFILES_ACTIVE = $Profile
$env:SERVER_PORT = "$Port"

# Same as srs-project: avoid an empty/wrong OS-level SPRING_DATASOURCE_PASSWORD shadowing application-local.yml.
if ($Profile -eq "local") {
    Remove-Item Env:\SPRING_DATASOURCE_PASSWORD -ErrorAction SilentlyContinue
}

# Local defaults match srs-style Postgres (user postgres, DB postgres). Overridden below when -DockerDeps starts compose postgres (mado).
if (-not $env:SPRING_DATASOURCE_URL) {
    $env:SPRING_DATASOURCE_URL = "jdbc:postgresql://localhost:5432/postgres?currentSchema=kick_live"
}
if (-not $env:SPRING_DATASOURCE_USERNAME) {
    $env:SPRING_DATASOURCE_USERNAME = "postgres"
}
# Do not set SPRING_DATASOURCE_PASSWORD here — use DB_PASSWORD / local-credentials.yml / optional file import.
if (-not $env:SPRING_DATA_REDIS_HOST) {
    $env:SPRING_DATA_REDIS_HOST = "localhost"
}
if (-not $env:MINIO_URL) {
    $env:MINIO_URL = "http://localhost:9000"
}

Write-Host "[run-backend] Profile=$Profile Port=$Port" -ForegroundColor Cyan
Write-Host "[run-backend] Datasource=$($env:SPRING_DATASOURCE_URL)" -ForegroundColor DarkGray
Write-Host "[run-backend] API: http://localhost:$Port" -ForegroundColor DarkGray

$ProjectRoot = Split-Path -Parent $ScriptDir
$mvnwCmdPath = Join-Path $ScriptDir "mvnw.cmd"
$mavenCmd = $null

if (Test-Path $mvnwCmdPath) {
    $mavenCmd = $mvnwCmdPath
    Write-Host "[run-backend] Using Maven Wrapper: $mavenCmd" -ForegroundColor DarkGray
} else {
    $mvn = Get-Command mvn -ErrorAction SilentlyContinue
    if ($mvn) {
        $mavenCmd = "mvn"
        Write-Host "[run-backend] Using Maven from PATH." -ForegroundColor DarkGray
    }
}

if ($DockerDeps) {
    $composeFile = Join-Path $ProjectRoot "docker-compose.yml"
    $dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
    if (-not $dockerCmd -or -not (Test-Path $composeFile)) {
        Write-Host "[run-backend] -DockerDeps requires Docker and docker-compose.yml at repo root." -ForegroundColor Red
        exit 1
    }
    Write-Host "[run-backend] Starting Docker services: postgres, redis, minio..." -ForegroundColor Yellow
    Push-Location $ProjectRoot
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & docker compose up -d postgres redis minio
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
        Write-Host "[run-backend] Waiting for Postgres..." -ForegroundColor DarkGray
        $deadline = (Get-Date).AddSeconds(45)
        $ready = $false
        while ((Get-Date) -lt $deadline -and -not $ready) {
            & docker compose exec -T postgres pg_isready -U mado -d madodb 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) { $ready = $true; break }
            Start-Sleep -Seconds 2
        }
        if (-not $ready) {
            Write-Host "[run-backend] Postgres did not become ready in time." -ForegroundColor Yellow
        }
        $pwRaw = if ($env:SPRING_DATASOURCE_PASSWORD) { $env:SPRING_DATASOURCE_PASSWORD } else { "mado_secret" }
        $pw = $pwRaw -replace "'", "''"
        & docker compose exec -T postgres psql -U mado -d madodb -c "ALTER USER mado WITH PASSWORD '$pw';" 2>$null | Out-Null
        # Compose Postgres is created with POSTGRES_USER=mado / madodb — align env for host-side Spring Boot.
        $env:SPRING_DATASOURCE_URL = "jdbc:postgresql://localhost:5432/madodb?currentSchema=kick_live"
        $env:SPRING_DATASOURCE_USERNAME = "mado"
        if (-not $env:KICK_LOCAL_DB_PASSWORD -and -not $env:DB_PASS -and -not $env:DB_PASSWORD) {
            $env:KICK_LOCAL_DB_PASSWORD = "mado_secret"
        }
    } finally {
        $ErrorActionPreference = $prevEap
        Pop-Location
    }
}

if (-not $mavenCmd) {
    if (-not $UseDockerFallback) {
        Write-Host "[run-backend] Maven is not available (mvn/mvnw not found)." -ForegroundColor Red
        Write-Host "[run-backend] Docker fallback is available but disabled by default." -ForegroundColor Yellow
        Write-Host "[run-backend] To run with Docker explicitly use: .\\run-backend.ps1 -UseDockerFallback" -ForegroundColor Yellow
        exit 1
    }

    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if (-not $docker) {
        Write-Host "[run-backend] Docker is not available. Install Docker Desktop or install Maven." -ForegroundColor Red
        exit 1
    }
    if ($Port -ne 8080) {
        Write-Host "[run-backend] Docker fallback uses docker-compose mapped port 8080 (ignores -Port $Port)." -ForegroundColor Yellow
    }
    Write-Host "[run-backend] Maven not found. Running Docker Compose backend (explicit fallback)..." -ForegroundColor Yellow
    Set-Location $ProjectRoot
    & docker compose up -d postgres redis minio
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    & docker compose up --build backend
    exit $LASTEXITCODE
}

if (-not $SkipBuild) {
    Write-Host "[run-backend] Building backend..." -ForegroundColor Yellow
    & $mavenCmd clean install -DskipTests
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
} else {
    Write-Host "[run-backend] Skip build enabled." -ForegroundColor Yellow
}

Write-Host "[run-backend] Starting Spring Boot..." -ForegroundColor Green
& $mavenCmd spring-boot:run "-Dspring-boot.run.profiles=$Profile"
exit $LASTEXITCODE
