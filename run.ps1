$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $projectRoot
try {
    $python = Join-Path $projectRoot '.venv\Scripts\python.exe'
    if (!(Test-Path $python)) {
        Write-Host 'Creating isolated Python environment...'
        & python -m venv .venv
    }
    & $python app.py
}
finally {
    Pop-Location
}
