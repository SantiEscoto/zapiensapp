# Validación y pruebas – ZapCards

Documento para validar la app (local y producción) e ir registrando resultados. Objetivo: llegar a “todo verde” de forma ordenada.

---

## 1. Pruebas automáticas (ejecutables en terminal)

Estas las puede ejecutar cualquiera (o CI) sin abrir la app en el navegador.

| # | Prueba | Comando | Resultado esperado | Último resultado |
|---|--------|---------|--------------------|------------------|
| A1 | TypeScript | `npx tsc --noEmit` | Exit 0, sin errores | ✅ OK |
| A2 | Build web | `npm run build:web` (Node 20) | Exit 0, carpeta `dist/` generada | ✅ OK |

**Requisito:** Node 20 (`nvm use 20` o equivalente).

---

## 2. Pruebas manuales – Local (npm run web o serve:web)

**Arrancar la app:** En `ZapCard/` con Node 20:
```bash
nvm use 20
npm run web
```
Abre en el navegador la URL que indique Expo (normalmente **http://localhost:8081**).  
Para probar rutas directas tipo `/lessons?id=...`, usa: `npm run build:web && npm run serve:web` y abre **http://localhost:3000**.

| # | Flujo | Pasos | Resultado esperado | ✅ / ❌ | Notas |
|---|--------|--------|--------------------|--------|--------|
| L1 | Entrada sin sesión | Abrir `http://localhost:8081` (o 3000) | Redirige a Welcome | | |
| L2 | Login | Welcome → Login → email/contraseña → enviar | Redirige a Home (tabs) | | |
| L3 | Home | En Home, ver listado | Se ven colecciones y/o carpetas (o vacío) | | |
| L4 | Abrir colección | Clic en una colección | Se abre pantalla de la colección (nombre, términos, juegos) | | |
| L5 | URL directa lessons | Abrir `http://localhost:3000/lessons?id=<UUID_COLECCION>` | Misma pantalla que L4 | | |
| L6 | Rankings | Ir a pestaña Rankings | Lista leaderboard y “Your Ranking” si aplica | | |
| L7 | Cerrar sesión / Volver | En Lessons, botón ✕ | Vuelve a Home | | |

---

## 3. Pruebas manuales – Producción (Vercel)

Sustituir `URL_PRODUCCION` por la URL real (ej. `https://zapcards-xxx.vercel.app`).

| # | Flujo | Pasos | Resultado esperado | ✅ / ❌ | Notas |
|---|--------|--------|--------------------|--------|--------|
| P1 | Carga | Abrir `URL_PRODUCCION` | App carga (Welcome o Home si ya hay sesión) | | |
| P2 | Login en producción | Welcome → Login → credenciales | Redirige a Home (misma URL de producción) | | |
| P3 | Colección en producción | Home → clic en una colección | Se abre pantalla de la colección (no error, no pantalla en blanco) | | |
| P4 | URL directa en producción | Abrir `URL_PRODUCCION/lessons?id=<UUID>` | Pantalla de la colección correcta | | |
| P5 | Rankings en producción | Pestaña Rankings | Leaderboard visible, sin error | | |

---

## 4. Cómo reportar cuando algo falla

Para cada casilla ❌, anota:

- **Prueba:** (ej. P3)
- **Qué hiciste:** (pasos exactos)
- **Qué pasó:** (mensaje de error, pantalla en blanco, redirección rara, etc.)
- **Navegador / dispositivo:** (Chrome, Safari, móvil, etc.)
- **URL en la que estabas:** (si aplica)

Con eso se puede reproducir y corregir más rápido.

---

## 5. Resumen de última ejecución

- **Fecha:** 2026-02-09 (primera ejecución documentada; A1 corregido después)
- **Automáticas:** A1 ✅ / A2 ✅
- **Local:** L1–L7 _pendiente (ejecutar tú)_
- **Producción:** P1–P5 _pendiente (ejecutar tú)_
- **Bloqueadores:** Ninguno crítico; el build web funciona. Los errores de TypeScript (A1) son mejoras de calidad, no impiden deploy.

---

## 6. Meta de validación

Consideramos “meta alcanzada” cuando:

- [ ] A1 y A2 pasan.
- [ ] L1–L7 pasan en local (o se documenta excepción).
- [ ] P1–P5 pasan en producción (o se documenta excepción).
- [ ] No hay bloqueadores sin documentar.

---

## 7. Problemas identificados (automáticas) – resueltos

### A1 – TypeScript (`npx tsc --noEmit`) – ✅ corregido

Se aplicaron las siguientes correcciones:

| Origen | Corrección aplicada |
|--------|---------------------|
| **window** | Declaración `declare var window` en `src/types/custom.d.ts`. |
| **global (polyfills)** | Uso de `const g = global as Record<string, unknown>` en `_layout.tsx`, `supabase.ts`, `supabase/index.ts`. |
| **Backend scripts** | Eliminado `emailConfirm` de `options` en test-auth, test-crud, test-rankings, test-social, test-xp. |
| **edit.tsx** | Parámetros `topic` tipados como `(topic: string)`. |
| **openrouter.ts** | Aserciones de tipo para `errorData` y `data` en las respuestas JSON. |
