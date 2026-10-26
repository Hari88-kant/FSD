#!/usr/bin/env bash
set -e

echo "============================================================"
echo " Smart EB Connect — Automated macOS Setup & Verification"
echo "============================================================"

export PATH="/opt/homebrew/bin:$PATH"

echo "[1/5] Checking Node, npm, Git, and MongoDB..."
node -v
npm -v
git --version
mongod --version | head -n 1

echo "[2/5] Installing Express Backend dependencies..."
cd "$(dirname "$0")/server"
cp .env.example .env
npm install

echo "[3/5] Seeding local MongoDB (smart_eb_connect)..."
npm run seed

echo "[4/5] Running automated REST API & RBAC test suite..."
npm test

echo "[5/5] Installing React + Vite Frontend dependencies..."
cd ../client
npm install
npm run build

echo ""
echo "============================================================"
echo " Setup Complete! Starting Backend (5001) & Frontend (5173)..."
echo "============================================================"
