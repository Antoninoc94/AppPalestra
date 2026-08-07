#!/bin/bash
set -e

echo "==> Aggiornamento AppPalestra..."

echo "==> Fetch da GitHub..."
git fetch origin

# Merge il branch claude/* più recente se non già incluso
LATEST=$(git branch -r --sort=-committerdate | grep 'origin/claude/' | head -1 | tr -d ' ')
if [ -n "$LATEST" ]; then
  if git merge-base --is-ancestor "$LATEST" HEAD 2>/dev/null; then
    echo "==> $LATEST già incluso, skip."
  else
    echo "==> Merge $LATEST..."
    git merge "$LATEST" --no-edit
  fi
fi

# Merge main se ci sono aggiornamenti
if ! git merge-base --is-ancestor origin/main HEAD 2>/dev/null; then
  echo "==> Merge origin/main..."
  git merge origin/main --no-edit
fi

echo "==> Rebuild e riavvio container..."
docker compose up -d --build

echo ""
echo "==> Aggiornamento completato!"
echo "    Log app: docker compose logs -f app"
