#!/usr/bin/env bash
# Asegura Node 18+ (carga nvm si existe) y arranca Expo web.
# Uso: npm run web  (o ./scripts/start-web.sh)

set -e
# nvm no es compatible con npm_config_prefix; quitarlo si está definido
unset npm_config_prefix 2>/dev/null || true
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
  if [ -f .nvmrc ]; then
    nvm use 2>/dev/null || nvm use 20 2>/dev/null || true
  else
    nvm use 20 2>/dev/null || true
  fi
fi

NODE_MAJOR=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [ -z "$NODE_MAJOR" ] || [ "$NODE_MAJOR" -lt 18 ]; then
  echo ""
  echo "  Se requiere Node 18 o 20. Actual: $(node -v 2>/dev/null || echo 'no encontrado')."
  echo "  Opciones:"
  echo "    1) Si tienes nvm: en otra terminal ejecuta 'nvm use 20' y luego 'npm run web'."
  echo "    2) Añade nvm a tu shell: en ~/.zshrc agrega las líneas que indica nvm (ver https://github.com/nvm-sh/nvm)."
  echo "    3) Instala Node 20 desde https://nodejs.org y usa esa versión."
  echo ""
  exit 1
fi

exec npx expo start --web "$@"
