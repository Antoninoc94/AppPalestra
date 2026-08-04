#!/bin/bash
set -e

echo "==> Primo avvio AppPalestra..."

# Controlla che AUTH_SECRET sia presente nel .env
if [ ! -f .env ] || ! grep -q "AUTH_SECRET=" .env || [ -z "$(grep 'AUTH_SECRET=' .env | cut -d'=' -f2-)" ]; then
  echo ""
  echo "ERRORE: AUTH_SECRET mancante nel file .env"
  echo "Generalo con: echo \"AUTH_SECRET=\$(openssl rand -base64 32)\" >> .env"
  echo ""
  exit 1
fi

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
