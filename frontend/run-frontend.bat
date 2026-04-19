@echo off
setlocal
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%run-frontend.ps1" %*
set EXITCODE=%ERRORLEVEL%
if %EXITCODE% neq 0 (
  echo.
  pause
)
exit /b %EXITCODE%
