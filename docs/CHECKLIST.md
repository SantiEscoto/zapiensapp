# Checklist del proyecto ZapCards

Resumen del estado actual, qué validar, objetivo (app desde dominio web) y planes a futuro.

---

## 1. Resumen del proyecto

| Área | Descripción |
|------|-------------|
| **App principal** | Expo (React Native) en `ZapCard/` — Expo Router, Supabase, React Native Paper |
| **Web marketing** | Next.js en `ZapCard/website/zapiens/` — sitio Zapiens (landing, FAQ, ayuda) |
| **Backend** | Supabase (auth, PostgreSQL, storage, realtime). Migraciones MVP en `ZapCard/backend/supabase/migrations/` (00001–00006). |
| **IA** | OpenRouter para generación de colecciones |
| **Deploy web** | Vercel; URL actual: **https://zapcards-rosy.vercel.app** |

**Rutas principales de la app:** Auth (welcome, login, register, callback) → Main (home, rankings, profile) → Subtabs (lessons, edit, manage, lands, settings, friends) → Lessons (flashcard, match, spinning, quiz, wordsearch, crossword).

**Comportamiento actual:** Sin sesión se redirige a Welcome; con sesión a Home. Rankings usa la vista `rankings_weekly`; Friends usa RPC `follow_user` / `unfollow_user`. Perfil lee `follower_ids` y `following_ids` del perfil en una sola query.

---

## 2. Requisitos de entorno

### 2.1 Node y dependencias
- [x] **Node 18 o 20** (recomendado 20). Con Node 16 falla `expo start` (`ReadableStream is not defined`).
- [x] **nvm:** En `ZapCard/` ejecutar `nvm use` (lee `.nvmrc`) o `nvm use 20` antes de `npm run web` o `npm start`.
- [x] **package.json:** `engines.node": ">=18"`; scripts `build:web`, `typecheck` presentes.

### 2.2 Variables de entorno
- [ ] **ZapCard/.env.local**: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_OPENROUTER_API_KEY` (opcional).
- [ ] **Vercel (producción):** Las mismas `EXPO_PUBLIC_*` en Project → Settings → Environment Variables.

### 2.3 Supabase
- [ ] **Migraciones aplicadas** en orden: `00001_initial_schema.sql` → `00002_rls.sql` → `00003_functions_triggers.sql` → `00004_social.sql` → `00005_social_rpc_and_rankings.sql` → `00006_security_and_rls_fixes.sql` (en `ZapCard/backend/supabase/migrations/`).
- [ ] **Auth:** Redirect URLs en Supabase incluyen la URL de producción (ej. `https://zapcards-rosy.vercel.app/**`, `https://zapcards-rosy.vercel.app/auth/callback`).
- [ ] **Leaked password protection** (opcional): Supabase → Authentication → Providers → Email → activar si se desea.

---

## 3. Build y despliegue

### 3.1 Local
```bash
cd ZapCard
nvm use 20
npm install
npm run web        # Expo en navegador (http://localhost:8081)
npm run build:web  # Genera dist/ para deploy
```

### 3.2 Deploy en Vercel
- Proyecto conectado al repo; **Root Directory** = `ZapCard` si el repo tiene varias carpetas.
- **vercel.json** define: build `npm run build:web`, output `dist`, rewrites SPA.
- **.nvmrc** = `20` para que Vercel use Node 20.
- Ver **docs/DEPLOY-WEB.md** para pasos detallados y dominio propio.

### 3.3 Notas técnicas (web)
- **app.json** → `expo.web.output`: `"single"` (SPA) para evitar errores de `window` en build estático.
- **RootErrorBoundary:** Captura errores de render en web y muestra pantalla “Algo salió mal” con opción de recargar o ir a inicio.
- **package.json** → `overrides.use-latest-callback`: `"^0.2.3"` para evitar `useLatestCallback is not a function` en Modal de React Native Paper en web.
- **tsconfig.json:** Proyecto puede usar opciones propias sin extender `expo/tsconfig.base` para evitar errores de “file not found” si el IDE usa otra raíz.

---

## 4. Validación de flujos

- [ ] **Login/registro:** Welcome → Login o Register → callback → Home.
- [ ] **Rankings:** Pestaña Rankings carga vista `rankings_weekly`; si falla, se muestra mensaje de error y botón “Reintentar”.
- [ ] **Colecciones/cartas:** Home → tap colección → Lessons; si falla la carga, pantalla de error con “Reintentar” y “Volver”.
- [ ] **Friends:** Seguir / dejar de seguir vía RPC `follow_user` / `unfollow_user`.

---

## 5. Referencia rápida de comandos

```bash
cd ZapCard
nvm use 20
npm install
npx tsc --noEmit           # Verificar tipos
npx expo start --web       # Desarrollo web
npm run build:web          # Build estático (dist/)
```

Backend (desde `ZapCard/backend/`):
```bash
npm run test:auth
npm run test:crud
npm run test:xp
npm run test:social
npm run test:rankings
npm run test:all
```

---

## 6. Planes a futuro

- [ ] Definir dominio/subdominio final (ej. `app.tudominio.com`) y configurarlo en Vercel y Supabase.
- [ ] Sustituir `your-project-id` en `app.json` por el EAS project ID real si se usa EAS.
- [ ] PWA, deep links, monitoreo (Sentry), tests E2E o integración en CI.
- [ ] Ver **docs/OUTLOOK-2026.md** y **docs/BACKEND-MVP-PLAN.md** para escalado (IA en Edge Functions, Storage, etc.).
