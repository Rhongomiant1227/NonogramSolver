@echo off
setlocal
cd /d "%~dp0"
set "PYTHON=.venv\Scripts\python.exe"
if not exist "%PYTHON%" (
  echo [Nonogram Studio] Creating virtual environment...
  where py >nul 2>nul
  if not errorlevel 1 (
    py -3 -m venv .venv
  ) else (
    python -m venv .venv
  )
  if errorlevel 1 (
    echo Failed to create .venv. Please install Python 3 and try again.
    pause
    exit /b 1
  )
)
echo [Nonogram Studio] Starting at http://localhost:8000
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Milliseconds 800; Start-Process 'http://localhost:8000'"
"%PYTHON%" app.py
if errorlevel 1 (
  echo.
  echo Server stopped with an error.
  pause
)
endlocal
