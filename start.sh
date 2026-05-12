#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
SEED=false

if [[ "${1:-}" == "--seed" ]]; then
  SEED=true
fi

step() {
  printf "\n==> %s\n" "$1"
}

ensure_env() {
  local dir="$1"
  local name="$2"

  if [[ ! -f "$dir/.env" ]]; then
    cp "$dir/.env.example" "$dir/.env"
    echo "Created $name .env from .env.example"
  fi
}

ensure_dependencies() {
  local dir="$1"
  local name="$2"

  if [[ ! -d "$dir/node_modules" ]]; then
    step "Installing $name dependencies"
    (cd "$dir" && npm install)
  fi
}

check_port() {
  if command -v nc >/dev/null 2>&1; then
    nc -z 127.0.0.1 27017
  else
    node -e "const net=require('net');const s=net.createConnection(27017,'127.0.0.1');s.on('connect',()=>process.exit(0));s.on('error',()=>process.exit(1));setTimeout(()=>process.exit(1),2000);"
  fi
}

step "Preparing CareTrack Clinic MRMS"

command -v node >/dev/null 2>&1 || { echo "Node.js is not installed or not available in PATH."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is not installed or not available in PATH."; exit 1; }

ensure_env "$BACKEND_DIR" "backend"
ensure_env "$FRONTEND_DIR" "frontend"
ensure_dependencies "$BACKEND_DIR" "backend"
ensure_dependencies "$FRONTEND_DIR" "frontend"

step "Checking MongoDB on localhost:27017"
if ! check_port; then
  echo "MongoDB is not reachable on localhost:27017. Start MongoDB or update backend/.env MONGO_URI."
  exit 1
fi

if [[ "$SEED" == true ]]; then
  step "Seeding database"
  (cd "$BACKEND_DIR" && npm run seed)
fi

step "Starting backend and frontend"
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:5000"
echo ""
echo "Admin login:"
echo "  email:    admin@caretrack.com"
echo "  password: Admin12345"
echo ""

(cd "$BACKEND_DIR" && npm run dev) &
BACKEND_PID=$!

(cd "$FRONTEND_DIR" && npm run dev) &
FRONTEND_PID=$!

trap 'kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true' INT TERM EXIT
wait
