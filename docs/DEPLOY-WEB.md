# Deploy web de ZapCards (Expo)

Guía para publicar la app Expo en la web (Vercel u otro hosting estático).

---

## 1. Requisitos

- **Node 20** (el proyecto incluye `.nvmrc` con `20`; Vercel lo usa automáticamente).
- Variables de entorno de Supabase (y opcionalmente OpenRouter) configuradas en el host.

---

## 2. Deploy en Vercel (recomendado)

### 2.1 Conectar el repo

1. Entra en [vercel.com](https://vercel.com) e inicia sesión.
2. **Add New** → **Project** y importa el repo de ZapCards.
3. **Root Directory**: si el repo es solo ZapCards, deja raíz; si el repo tiene varias carpetas, pon `ZapCard` (o la carpeta donde está `app.json`).
4. Vercel detectará `vercel.json` y usará:
   - **Build Command**: `npm run build:web`
   - **Output Directory**: `dist`
   - **Rewrites**: todas las rutas que no sean archivos estáticos → `index.html` (SPA).

### 2.2 Variables de entorno

En **Project → Settings → Environment Variables** añade (para **Production** y, si quieres, Preview):

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | `https://xxxx.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase | `eyJ...` |
| `EXPO_PUBLIC_OPENROUTER_API_KEY` | (Opcional) Para generación con IA | `sk-or-...` |

En build, Expo inyecta las `EXPO_PUBLIC_*` en el bundle; sin ellas, auth y API fallarán en producción.

### 2.3 Deploy

- **Deploy** desde el panel, o push a la rama conectada (ej. `main`).
- La URL de producción será algo como `https://zapcards-xxx.vercel.app`.

### 2.4 Dominio propio (opcional)

1. **Project → Settings → Domains** → añade `app.tudominio.com`.
2. Configura en tu DNS el CNAME que indique Vercel.
3. En **Supabase** → **Authentication** → **URL Configuration**:
   - **Site URL**: `https://app.tudominio.com`
   - **Redirect URLs**: añade `https://app.tudominio.com/**` y `https://app.tudominio.com/auth/callback`.

---

## 3. Probar el build en local

```bash
cd ZapCard
nvm use 20   # o asegúrate de usar Node 20
npm run build:web
npx serve dist
```

Abre `http://localhost:3000` (o el puerto que indique `serve`). La app cargará; el login redirigirá a Supabase y de vuelta a la misma URL (en local será `http://localhost:3000/auth/callback`; en producción será tu dominio).

---

## 4. Archivos de configuración

| Archivo | Uso |
|---------|-----|
| `vercel.json` | Build command, output `dist`, rewrites SPA. |
| `.nvmrc` | Node 20 para Vercel y para `nvm use` en local. |
| `app.json` → `expo.web.output` | `"single"` = SPA (una sola `index.html`); evita errores de `window` en build estático. |

---

## 5. Netlify / Cloudflare Pages

- **Build command**: `npm run build:web`
- **Publish directory**: `dist`
- **Variables de entorno**: las mismas `EXPO_PUBLIC_*` en el panel del host.
- **Redirects (SPA)**:
  - Netlify: crea `public/_redirects` con `/*    /index.html   200`
  - Cloudflare Pages: en **Settings → Builds & deployments**, **Single-page application** o regla de redirect `/*` → `/index.html`.

---

## 6. Checklist post-deploy

- [ ] La app carga en la URL de producción.
- [ ] Login (email y/u OAuth) redirige bien y vuelve a la app.
- [ ] Supabase tiene la URL de producción en **Redirect URLs**.
- [ ] Colecciones, rankings y perfil cargan sin errores de CORS ni 401.

Si algo falla, revisa la consola del navegador y que las variables `EXPO_PUBLIC_*` estén definidas en el entorno de build del host.
