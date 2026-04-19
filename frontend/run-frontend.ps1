$ErrorActionPreference = "Stop"
$ScriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
Set-Location $ScriptDir

$proxyConfigPath = Join-Path $ScriptDir "proxy.conf.json"
$proxyTarget = $null

if (Test-Path $proxyConfigPath) {
    try {
        $proxyJson = Get-Content $proxyConfigPath -Raw | ConvertFrom-Json
        $apiProp = $proxyJson.PSObject.Properties | Where-Object { $_.Name -eq '/api' }
        if ($apiProp) { $proxyTarget = $apiProp.Value.target }
    } catch {
        Write-Host "[run-frontend] Warning: could not parse proxy.conf.json: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

if ([string]::IsNullOrWhiteSpace($proxyTarget)) {
    $proxyTarget = "http://localhost:8081"
}

Write-Host "[run-frontend] LOCAL development: ng serve --configuration=development (proxy /api,/ws -> $proxyTarget)" -ForegroundColor Cyan

try {
    $proxyUri = [Uri]$proxyTarget
    $port = if ($proxyUri.IsDefaultPort) {
        if ($proxyUri.Scheme -eq "https") { 443 } else { 80 }
    } else {
        $proxyUri.Port
    }
    $reachable = Test-NetConnection -ComputerName $proxyUri.Host -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
    if (-not $reachable) {
        Write-Host "[run-frontend] Warning: backend proxy target is not reachable right now. Dev server may log errors for /api until Spring Boot starts on that port." -ForegroundColor Yellow
    }
} catch {
    Write-Host "[run-frontend] Warning: could not verify backend proxy target '$proxyTarget'." -ForegroundColor Yellow
}

$ngCli = Join-Path $ScriptDir "node_modules\@angular\cli\package.json"
if (-not (Test-Path "node_modules") -or -not (Test-Path $ngCli)) {
    Write-Host "[run-frontend] Dependencies missing or incomplete (need @angular/cli). Running npm install..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[run-frontend] npm install failed. Fix network/registry issues then retry." -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

Write-Host "[run-frontend] Starting dev server (Ctrl+C to stop)..." -ForegroundColor Green
npm run start
exit $LASTEXITCODE
