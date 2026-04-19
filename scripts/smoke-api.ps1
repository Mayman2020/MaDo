# Quick API smoke check (backend on 127.0.0.1:8090 with profile local, matching Angular proxy).
# Usage: .\scripts\smoke-api.ps1
# Exit 0 = OK, 1 = failure

$ErrorActionPreference = "Stop"
$base = "http://127.0.0.1:8090"

function Test-Endpoint($name, $uri) {
    try {
        $r = Invoke-RestMethod -Uri $uri -Method Get -TimeoutSec 8
        Write-Host "[OK] $name" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "[FAIL] $name — $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

$ok = $true
$ok = (Test-Endpoint "GET /api/streams/live" "$base/api/streams/live?page=0&size=1") -and $ok
$ok = (Test-Endpoint "GET /api/categories" "$base/api/categories?page=0&size=2") -and $ok

if (-not $ok) {
    Write-Host "`nEnsure PostgreSQL is up and backend: .\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=local" -ForegroundColor Yellow
    exit 1
}
Write-Host "`nSmoke check passed." -ForegroundColor Green
exit 0
