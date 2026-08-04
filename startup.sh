#!/bin/bash
set -e

echo "==> Primo avvio AppPalestra..."

echo "==> Pull da GitHub..."
git pull origin main

echo "==> Build immagini..."
docker compose build

echo "==> Avvio database..."
docker compose up -d postgres

echo "==> Attendo che il database sia pronto..."
until docker compose exec postgres pg_isready -U palestra -d apppalestra 2>/dev/null; do
  echo "   ...aspetto il database..."
  sleep 3
done

echo "==> Esecuzione migrate (prisma db push)..."
docker compose run --rm migrate

echo "==> Esecuzione seed (utente admin + esercizi)..."
docker compose run --rm migrate npx prisma db seed

echo "==> Avvio applicazione..."
docker compose up -d app

echo ""
echo "==> Installazione completata!"
echo "    Accedi su http://localhost:3000"
echo "    Username: admin  |  Password: palestra"
