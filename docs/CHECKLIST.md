# Checklist del proyecto ZapCards

Resumen del estado actual, qué validar, objetivo cercano (Expo desde tu dominio web) y planes a futuro.

---

## 1. Resumen del proyecto

| Área | Descripción |
|------|-------------|
| **App principal** | Expo (React Native) en `ZapCard/` — Expo Router, Supabase, React Native Paper |
| **Web marketing** | Next.js en `ZapCard/website/zapiens/` — sitio Zapiens (landing, FAQ, ayuda, etc.) |
| **Config raíz** | `next.config.js` en la raíz del repo (probable herencia o monorepo; la app que corre es la de Expo) |
| **Backend** | Supabase (auth, PostgreSQL, storage, realtime) |
| **IA** | OpenRouter para generación de colecciones |

**Rutas principales de la app:** Auth (login, register, callback) → Main (home, rankings, profile) → Subtabs (lessons, edit, manage, lands, settings, friends) → Lessons (flashcard, match, spinning, quiz, wordsearch, crossword).

---

## 2. Checklist de validación (qué hace falta validar)

### 2.1 Entorno y dependencias
- [ ] **Node.js** — Usar Node **20 LTS o 22**. Con Node 16 falla `expo start` (p. ej. `ReadableStream is not defined`).
- [ ] **Variables de entorno** — En `ZapCard/.env.local`:
  - [ ] `EXPO_PUBLIC_SUPABASE_URL`
  - [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `EXPO_PUBLIC_OPENROUTER_API_KEY` (si usas generación con IA)
- [ ] **Supabase** — Proyecto creado, tablas y políticas aplicadas. Backend MVP: migraciones en `ZapCard/backend/supabase/migrations/` (00001–00005).
- [ ] **Auth en Supabase** — Google OAuth (o otros proveedores) configurados y URLs de redirect autorizadas para web y, luego, tu dominio.

### 2.2 Build y tipos
- [ ] **TypeScript** — `npx tsc --noEmit` sin errores (ya corregido en sesión anterior).
- [ ] **Expo web** — `npm run web` o `npx expo start --web` arranca y carga la app en el navegador (requiere Node 20+).
- [ ] **Build web estático** — `npx expo export --platform web` genera la carpeta `dist/` sin fallos.

### 2.3 Flujos críticos en web
- [ ] **Login/registro** — Formulario y (si aplica) OAuth redirigen bien; en web la redirect debe usar tu dominio final en Supabase.
- [ ] **Callback de OAuth** — Ruta `/auth/callback` existe y redirige a home tras login (ej. `/(main)/home` o `/home` según tu router).
- [ ] **Navegación** — Home → Colecciones / Explorar, abrir lección, juegos (flashcard, match, etc.) sin errores en web.
- [ ] **Supabase en web** — Lectura/escritura de colecciones, carpetas y perfiles; sin errores CORS si el dominio está en la allowlist de Supabase.

### 2.4 Seguridad y producción
- [ ] **Secrets** — Ninguna API key ni secret en el repo; solo variables `EXPO_PUBLIC_*` para lo que deba estar en cliente.
- [ ] **Supabase RLS** — Políticas revisadas para que usuarios solo accedan a sus datos o a contenido público según diseño.
- [ ] **Dominio en Supabase** — En Authentication → URL Configuration, añadir la URL real de tu app web (ej. `https://app.tudominio.com`).

### 2.5 Opcional pero recomendado
- [ ] **Tests** — Aún no hay suite (Jest / React Testing Library); definir al menos pruebas para servicios y flujos críticos.
- [ ] **Linting** — `npm run lint` o ESLint en CI para mantener estilo y buenas prácticas.
- [ ] **EAS** — Si usas EAS Build: `eas.json` y `app.json` → `extra.eas.projectId` con tu proyecto real (ahora dice `"your-project-id"`).

---

## 3. Objetivo cercano: abrir la app Expo desde tu dominio web

Objetivo: que al entrar a **tu dominio** (ej. `https://app.tudominio.com` o `https://tudominio.com/app`) se cargue la **app Expo en versión web**.

### 3.1 Opciones de despliegue

| Opción | Ventaja | Cómo |
|--------|--------|------|
| **A) Subdominio dedicado** | `app.tudominio.com` solo para la app. Muy claro para usuarios y para Supabase. | Build web de Expo → hospedar en Vercel/Netlify/Cloudflare Pages apuntando el subdominio. |
| **B) Ruta en el mismo dominio** | Un solo dominio: `tudominio.com` (landing) y `tudominio.com/app` (Expo). | Servir el build de Expo en `/app` (p. ej. Next.js rewrites o un segundo deploy en `/app`). |
| **C) Dominio = solo app** | Todo el dominio es la app. | Build web de Expo como proyecto estático en la raíz del dominio. |

Recomendación típica: **A) Subdominio** (ej. `app.zapcards.com`) para la app y el dominio principal para landing/marketing (zapiens o similar).

### 3.2 Pasos concretos (ruta A: subdominio)

1. **Build web de Expo**
   - En `ZapCard/`: `npx expo export --platform web`.
   - Revisar que salga `dist/` (o la carpeta que indique la doc de tu versión de Expo).

2. **Hosting estático**
   - Subir el contenido de `dist/` a:
     - **Vercel**: proyecto nuevo, “Import” y apuntar a la carpeta `dist` (o con `vercel.json` si hace falta).
     - **Netlify**: sitio nuevo, deploy desde carpeta `dist` o desde repo con build command `npx expo export --platform web` y publish directory la salida de Expo.
     - **Cloudflare Pages**: igual, build + carpeta de salida.
   - Configurar el **dominio custom**: en el panel del host, añadir `app.tudominio.com` y los registros DNS que te pidan (CNAME o A).

3. **Configurar Expo para el dominio (importante para auth y links)**
   - En `ZapCard/app.json`, en `expo.extra.router` (o donde tengas la config de router), si Expo lo soporta en tu versión, fijar el **origin** de la app web:
     - Ejemplo: `"origin": "https://app.tudominio.com"` (o dejar que se infiera en runtime si ya usas `window.location.origin` en login).
   - En **Supabase** → Authentication → URL Configuration:
     - **Site URL**: `https://app.tudominio.com`
     - **Redirect URLs**: añadir `https://app.tudominio.com/**` y `https://app.tudominio.com/auth/callback`.

4. **Probar**
   - Abrir `https://app.tudominio.com`.
   - Probar login (email y OAuth si aplica), callback y navegación por la app.
   - Probar en móvil (responsive) y en escritorio.

5. **Enlaces desde la web marketing (zapiens)**
   - En el sitio Next.js (zapiens), el botón “Get Now” o “Abrir app” debe llevar a `https://app.tudominio.com` (o la URL que elijas para la app).

### 3.3 Notas técnicas

- **Login web**: ya usas `window.location.origin` en `login.tsx` para `redirectTo`; en producción ese origin será tu dominio, así que solo falta registrar esa URL en Supabase.
- **Callback**: la ruta en Expo Router es algo como `/(auth)/callback`, que en web suele ser `/auth/callback`; asegurar que esa sea exactamente una de las Redirect URLs en Supabase.
- **SPA / base path**: si en el futuro sirves la app en una ruta (ej. `/app`), puede que necesites configurar el “base path” o “asset prefix” en el export de Expo web para que recursos y rutas funcionen bien.

---

## 4. Planes para más adelante

### 4.1 Corto plazo
- [ ] Definir dominio/subdominio final y desplegar la app web ahí (sección 3).
- [ ] Sustituir `your-project-id` en `app.json` por el EAS project ID real si usas EAS.
- [ ] Añadir script en `package.json`: `"build:web": "expo export --platform web"` (y opcionalmente `"typecheck": "tsc --noEmit"`).
- [ ] Documentar en README: Node 20+, variables de entorno, cómo correr web y cómo desplegar a producción.

### 4.2 Medio plazo
- [ ] **PWA** — Opcional: configurar la build web de Expo como PWA para “Añadir a la pantalla de inicio” y mejor soporte offline.
- [ ] **Deep links** — Si tienes app nativa (iOS/Android), configurar `scheme` y enlaces que abran la app o la web según el dispositivo.
- [ ] **Monitoreo** — Errores (Sentry o similar) y métricas básicas en producción.
- [ ] **Tests** — Suite mínima (servicios Supabase, auth, flujos críticos) y, si es posible, integración en CI.

### 4.3 Largo plazo
- [ ] Unificar o clarificar la raíz del repo: si `next.config.js` en raíz no se usa, moverlo o documentar que solo aplica a otro proyecto.
- [ ] Considerar unificar marketing (zapiens) y app bajo un solo dominio con rutas (ej. `/` = landing, `/app` = Expo) si simplifica operación y marca.
- [ ] Revisar y actualizar dependencias con `npm audit` y plan de actualización de Expo/SDK según el ciclo que marque el equipo.

---

## 5. Referencia rápida de comandos

```bash
# Desde ZapCard/
npm install
npx tsc --noEmit          # Verificar tipos
npx expo start            # Desarrollo (requiere Node 20+)
npx expo start --web      # Solo web
npx expo export --platform web   # Build estático para producción
```

Cuando tengas el build en `dist/`, ese contenido es el que subes al hosting y apuntas con tu dominio (subdominio recomendado: `app.tudominio.com`).
