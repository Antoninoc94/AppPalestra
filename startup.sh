#!/bin/bash
set -e

echo "==> Primo avvio AppPalestra..."

echo "==> Pull da GitHub..."
git pull origin main

echo "==> Build e avvio container..."
docker compose up -d --build

echo "==> Attendo che il migrate sia completato..."
docker compose wait migrate

echo "==> Esecuzione seed (utente admin + esercizi)..."
docker compose run --rm migrate npx ts-node --project tsconfig.json prisma/seed.ts

echo ""
echo "==> Installazione completata!"
echo "    Accedi su http://localhost:3000"
echo "    Username: admin  |  Password: palestra"
