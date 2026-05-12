param(
  [switch]$Seed
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Ensure-Env {
  param(
    [string]$Directory,
    [string]$Name
  )

  $envPath = Join-Path $Directory ".env"
  $examplePath = Join-Path $Directory ".env.example"

  if (-not (Test-Path $envPath)) {
    Copy-Item $examplePath $envPath
    Write-Host "Created $Name .env from .env.example"
  }
}

function Ensure-Dependencies {
  param(
    [string]$Directory,
    [string]$Name
  )

  if (-not (Test-Path (Join-Path $Directory "node_modules"))) {
    Write-Step "Installing $Name dependencies"
    Push-Location $Directory
    npm install
    Pop-Location
  }
}

Write-Step "Preparing CareTrack Clinic MRMS"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js is not installed or is not available in PATH."
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "npm is not installed or is not available in PATH."
}

Ensure-Env $backend "backend"
Ensure-Env $frontend "frontend"
Ensure-Dependencies $backend "backend"
Ensure-Dependencies $frontend "frontend"

Write-Step "Checking MongoDB on localhost:27017"
$mongoConnection = Test-NetConnection -ComputerName localhost -Port 27017 -WarningAction SilentlyContinue
if (-not $mongoConnection.TcpTestSucceeded) {
  throw "MongoDB is not reachable on localhost:27017. Start MongoDB or update backend/.env MONGO_URI."
}

if ($Seed) {
  Write-Step "Seeding database"
  Push-Location $backend
  npm run seed
  Pop-Location
}

Write-Step "Starting backend and frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backend'; npm run dev" -WindowStyle Normal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontend'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "CareTrack Clinic MRMS is starting." -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend:  http://localhost:5000"
Write-Host ""
Write-Host "Admin login:"
Write-Host "  email:    admin@caretrack.com"
Write-Host "  password: Admin12345"
