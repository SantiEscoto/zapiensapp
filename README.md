# ZapCards

App con [`expo-router`](https://docs.expo.dev/router/introduction/), Supabase y React Native Paper.

## Requisitos

- **Node 18 o 20** (recomendado 20). Con Node 16 aparece `ReadableStream is not defined` al ejecutar Expo.
- Comprueba tu versión: `node -v`. Si sale v16.x o menor, actualiza:
  - **Con nvm:** `nvm use 20` o `nvm install 20` (y en cada terminal nueva: `nvm use 20` o añade nvm al `.zshrc`).
  - **Sin nvm:** instala Node 20 desde [nodejs.org](https://nodejs.org/) o con Homebrew: `brew install node@20` y usa ese Node.

## 🚀 Cómo usar

```sh
# Asegúrate de usar Node 18+ (node -v)
# Si usas nvm: nvm use 20

npm install
npm start       # Expo (elige plataforma)
npm run web     # Solo web
npm run build:web   # Build estático para deploy
npm run serve:web   # Sirve dist/ en http://localhost:3000 con fallback SPA (rutas directas como /rankings funcionan)
```

**Rutas directas (ej. `/rankings`):** En el servidor de desarrollo (`npm run web`) una URL directa puede devolver 404. Para probar como en producción (rutas directas correctas), genera el build y sírvelo con: `npm run build:web && npm run serve:web` → abre **http://localhost:3000/rankings**. En Vercel las rutas ya están configuradas en `vercel.json`.

## 📝 Notes

- [Expo Router: Docs](https://docs.expo.dev/router/introduction/)
