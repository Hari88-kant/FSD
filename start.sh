#!/usr/bin/env bash
set -e

export PATH="/opt/homebrew/bin:$PATH"
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

trap 'kill 0' EXIT

echo "Starting Express API Server on http://localhost:5001 ..."
(cd "$ROOT_DIR/server" && npm start) &

sleep 2

echo "Starting React Vite Dev Server on http://localhost:5173 ..."
(cd "$ROOT_DIR/client" && npm run dev -- --open) &

wait
