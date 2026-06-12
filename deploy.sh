#!/bin/bash
# Buildea Angular y pushea los archivos compilados al repo de dist.
# Uso: ./deploy.sh "descripcion del cambio"

set -e

DIST_REPO_URL="https://github.com/TU_USUARIO/linkbox-dashboard-dist.git"
DIST_DIR="../linkbox-dashboard-dist"
MSG="${1:-update}"

echo "Building Angular..."
npx ng build --configuration production

echo "Copiando al repo dist..."
if [ ! -d "$DIST_DIR" ]; then
  git clone "$DIST_REPO_URL" "$DIST_DIR"
fi

rm -rf "$DIST_DIR"/*
cp -r dist/link-box-app/browser/. "$DIST_DIR/"

cd "$DIST_DIR"
git add -A
git commit -m "$MSG"
git push origin main

echo "Listo — archivos publicados en GitHub"
