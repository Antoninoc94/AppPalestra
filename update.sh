#!/bin/bash
set -e

echo "==> Aggiornamento AppPalestra..."

echo "==> Pull da GitHub..."
git pull origin main

echo "==> Rebuild e riavvio container..."
docker compose up -d --build

echo "==> Attendo che i container siano pronti..."
docker compose ps

echo ""
echo "==> Aggiornamento completato!"
echo "    Log app: docker compose logs -f app"
