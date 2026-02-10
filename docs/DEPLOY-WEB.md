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
| `EXPO_PUBLIC_OPENROUTER_MODEL` | (Opcional) Modelo OpenRouter. Por defecto: `deepseek/deepseek-chat:free` | `deepseek/deepseek-r1-0528:free` |

En build, Expo inyecta las `EXPO_PUBLIC_*` en el bundle; sin ellas, auth y API fallarán en producción.

### 2.3 Deploy (esta versión = la que funciona en localhost:8082)

Para que **la misma versión** que probaste en `http://localhost:8082` quede en Vercel:

**Opción A – Repo ya conectado a Vercel**  
1. En la carpeta del proyecto: `git add .` → `git commit -m "Deploy: CollectionsProvider en raíz, colecciones funcionando"` → `git push origin main` (o la rama que uses).  
2. Vercel hará el deploy automático. Revisa el panel de Vercel para ver el estado y la URL.

**Opción B – Deploy desde la CLI**  
1. En la carpeta `ZapCard`: `npm run build:web` (ya genera `dist/`).  
2. Ejecuta: `npx vercel --prod`.  
3. Si es la primera vez, inicia sesión cuando lo pida y asocia el proyecto (Root Directory = `ZapCard` si estás dentro de ella).  
4. La URL de producción será algo como `https://zapcards-xxx.vercel.app`.

### 2.4 Configurar Supabase para la URL de producción

Para que el login (email y OAuth) funcione en la app desplegada:

1. Entra en [Supabase](https://supabase.com) → tu proyecto → **Authentication** → **URL Configuration**.
2. En **Redirect URLs** añade (sustituye por tu dominio si usas uno propio):
   - `https://zapcards-rosy.vercel.app/**`
   - `https://zapcards-rosy.vercel.app/auth/callback`
3. (Opcional) Si quieres que al abrir la app vaya directo a producción, pon **Site URL** = `https://zapcards-rosy.vercel.app`.

### 2.5 Dominio propio (opcional)

1. **Project → Settings → Domains** → añade `app.tudominio.com`.
2. Configura en tu DNS el CNAME que indique Vercel.
3. En **Supabase** → **Authentication** → **URL Configuration**:
   - **Site URL**: `https://app.tudominio.com`
   - **Redirect URLs**: añade `https://app.tudominio.com/**` y `https://app.tudominio.com/auth/callback`.

---

## 3. Probar el build en local

Para que **rutas directas** (ej. `/rankings`, `/profile`) funcionen igual que en producción, hay que servir con **fallback SPA** (todas las rutas devuelven `index.html`):

```bash
cd ZapCard
nvm use 20   # o asegúrate de usar Node 20
npm run build:web
npm run serve:web
```

`serve:web` usa `serve dist -l 3000 -s` (`-s` = rewrite de rutas no encontradas a `index.html`).  
Abre `http://localhost:3000` o `http://localhost:3000/rankings`. Sin `-s`, abrir directamente `/rankings` daría HTTP 404.

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
