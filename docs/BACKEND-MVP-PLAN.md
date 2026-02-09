# Plan: Backend MVP limpio y escalable

Objetivo: **olvidarnos del frontend por ahora** y construir un **backend sólido** que sea un MVP de lo actual, **probado y funcionando**, con buenas prácticas y en limpio, para escalar poco a poco llevando las lecciones del primer prototipo.

---

## Estado actual (implementado)

| Fase | Contenido | Migraciones |
|------|-----------|-------------|
| **Fase 1** | Schema, RLS, triggers, `update_user_xp`, `reset_weekly_xp` | 00001, 00002, 00003 |
| **Fase 2 (social)** | `following_ids` / `follower_ids`, trigger `handle_new_follower` | 00004 |
| **Fase 2 (RPC y rankings)** | `follow_user`, `unfollow_user`, vista `rankings_weekly` | 00005 |
| **Seguridad y RLS** | Vista `rankings_weekly` con `security_invoker`, políticas RLS con `(SELECT auth.uid())`, eliminación de índice no usado | 00006 |

**Ubicación:** `ZapCard/backend/supabase/migrations/` (00001–00006).  
**Pruebas:** scripts en `backend/scripts/` (`test-auth`, `test-crud`, `test-xp`, `test-social`, `test-rankings`).  
**Contrato frontend:** `backend/docs/API-CONTRACT.md`.

---

## 1. Resumen ejecutivo

| Qué | Decisión |
|-----|----------|
| **Alcance** | Solo backend: Supabase (schema + RLS + RPC + Auth). Sin tocar app Expo. |
| **Entregable** | Un proyecto de backend “desde cero” en limpio: schema único y ordenado, políticas claras, forma de probar que todo funciona. |
| **Ubicación** | Opción A: carpeta nueva `backend/` o `supabase-mvp/` en el repo. Opción B: mismo repo, reemplazar contenido de `supabase/` por el MVP y dejar el actual en una rama o backup. |
| **Validación** | Migraciones aplicadas en un proyecto Supabase (local o cloud), script o suite mínima que pruebe Auth + CRUD + RPC. |

---

## 2. Análisis del backend actual

### 2.1 Qué hay hoy (inventario)

**Auth (Supabase Auth)**  
- Email/contraseña y OAuth (Google).  
- Al crear usuario → trigger `handle_new_user()` inserta fila en `profiles`.  
- Al actualizar `raw_user_meta_data` en `auth.users` → trigger `sync_user_metadata()` actualiza `profiles` (full_name, avatar_url).

**Tablas**

| Tabla | Columnas principales | Uso en la app |
|-------|----------------------|----------------|
| **profiles** | id, username, full_name, avatar_url, email, updated_at, following_ids, follower_ids, weekly_xp, daily_xp_history | Perfil, rankings (weekly_xp), amigos (following/follower), XP |
| **collections** | id, name, topics[], user_id, is_public, cover_url (eliminada en una migración), created_at, updated_at | Listado, crear, editar, explorar públicas |
| **cards** | id, collection_id, front_content, back_content, difficulty, last_reviewed, next_review, created_at, updated_at | Flashcards por colección, CRUD en edit |
| **folders** | id, name, user_id, collection_ids[], is_public, created_at, updated_at | Agrupar colecciones, listar, explorar públicas |

**RLS (resumen)**  
- **profiles:** cualquiera autenticado puede leer; solo el dueño inserta/actualiza.  
- **collections:** leer propias o públicas; escribir solo propias.  
- **cards:** acceso vía ownership de la colección (EXISTS en collections).  
- **folders:** leer propias o públicas; escribir solo propias; trigger valida que `collection_ids` sean colecciones del usuario.

**Funciones / RPC**  
- `update_user_xp(user_id, xp_amount)`: actualiza `weekly_xp` y `daily_xp_history` del perfil.  
- `reset_weekly_xp()`: pone `weekly_xp = 0` en todos (para cron/scheduled).  
- Triggers: `handle_new_user`, `sync_user_metadata`, `validate_collection_ownership`, `handle_new_follower`.

**IA (fuera de Supabase)**  
- OpenRouter desde el cliente: `generateFlashCards`, `generateCollectionInfo`, `generateFolderNotes`.  
- Para el MVP backend no es obligatorio moverlo; más adelante se puede llevar a Edge Function.

### 2.2 Lecciones / problemas del prototipo actual

1. **Migraciones acumuladas y frágiles:** 14 archivos que dependen del orden; columnas que se añaden y luego se quitan (p. ej. `cover_url`); renombrado `language` → `topics`. Difícil de reproducir en un entorno nuevo.  
2. **Schema repartido:** No hay un único “estado final” legible; hay que ejecutar todas las migraciones en orden para saber cómo queda la base.  
3. **RLS y políticas:** Varias políticas con nombres distintos (ej. `users_select_own_collections` vs `users_select_collections`); políticas públicas añadidas después. Funciona pero no es trivial auditar.  
4. **Friends/social complejo:** `handle_new_follower` solo agrega; no quita al dejar de seguir. Para un MVP se puede simplificar o posponer.  
5. **Poca validación explícita:** Algunas reglas están en triggers (ej. `validate_collection_ownership`), otras solo en el cliente.  
6. **Sin tests automatizados del backend:** No hay forma de comprobar que, tras un cambio, Auth + CRUD + RPC siguen funcionando sin abrir la app.

---

## 3. Alcance del MVP backend

### 3.1 Incluido en el MVP (Fase 1)

- **Auth:** Supabase Auth (email/password + OAuth). Trigger que crea perfil al registrarse. Sincronización de metadata (nombre, avatar) desde `auth.users`.  
- **profiles:** id, email, username, full_name, avatar_url, updated_at, weekly_xp, daily_xp_history.  
  - Sin `following_ids` / `follower_ids` en Fase 1 (se añaden en Fase 2).  
- **collections:** id, name, topics (TEXT[]), user_id, is_public, cover_url (opcional, para futuro), created_at, updated_at.  
- **cards:** id, collection_id, front_content, back_content, difficulty, last_reviewed, next_review, created_at, updated_at.  
- **folders:** id, name, user_id, collection_ids (UUID[]), is_public, created_at, updated_at.  
- **RLS:** Políticas claras y mínimas: propio usuario para escritura; lectura de propias + públicas para collections y folders.  
- **RPC:** `update_user_xp(user_id, xp_amount)`.  
- **Funciones auxiliares:** `reset_weekly_xp()` (para cron); trigger de validación de ownership de colecciones en folders.  
- **Documentación:** Un README del backend con schema resumido, variables de entorno y cómo correr/probar.

### 3.2 Dejado para después (Fase 2+)

- **Social:** following_ids, follower_ids, políticas y triggers de amigos (diseñados bien desde el inicio).  
- **Rankings:** Ya se pueden calcular con `weekly_xp`; si hace falta una vista materializada o API dedicada, Fase 2.  
- **IA en backend:** Mover OpenRouter a Supabase Edge Functions (opcional).  
- **Storage:** Si se usan imágenes (cover_url, avatares), configurar Supabase Storage y políticas en Fase 2.

---

## 4. Estructura propuesta del proyecto backend

```
backend/
├── README.md
├── .env.example
├── supabase/migrations/
│   ├── 00001_initial_schema.sql   # Tablas + índices
│   ├── 00002_rls.sql             # Políticas RLS
│   ├── 00003_functions_triggers.sql  # Triggers, update_user_xp, reset_weekly_xp
│   ├── 00004_social.sql          # following_ids, follower_ids, handle_new_follower
│   ├── 00005_social_rpc_and_rankings.sql  # follow_user, unfollow_user, rankings_weekly
│   └── 00006_security_and_rls_fixes.sql   # security_invoker, RLS (auth.uid()), índices
├── scripts/
│   ├── test-auth.ts
│   ├── test-crud.ts
│   ├── test-xp.ts
│   ├── test-social.ts
│   └── (test-rankings según implementación)
└── docs/
    └── API-CONTRACT.md
```

**Ventaja:** Un solo lugar con schema “final” por fases; migraciones numeradas y con un propósito claro (schema, RLS, lógica).

---

## 5. Plan de implementación paso a paso

### Fase 0: Preparación (1 día)

1. **Decidir ubicación:** Crear carpeta `backend/` (o `supabase-mvp/`) en el repo; no borrar aún el `supabase/` actual (dejar como referencia o en otra rama).  
2. **Requisitos:** Node 20+, Supabase CLI opcional (`npm i -g supabase`). Cuenta Supabase (o proyecto nuevo solo para este MVP).  
3. **Documentar:** Copiar/adaptar este plan a un `README.md` dentro de `backend/` con requisitos y pasos.

### Fase 1: Schema y migraciones (2–3 días)

**Paso 1.1 – Schema inicial (`00001_initial_schema.sql`)**  
- Extension `uuid-ossp`.  
- Tablas en orden de dependencia:  
  - `profiles` (id PK FK a auth.users, email NOT NULL, username, full_name, avatar_url, updated_at, weekly_xp, daily_xp_history).  
  - `collections` (id, name, topics TEXT[], user_id FK, is_public, cover_url opcional, created_at, updated_at).  
  - `cards` (id, collection_id FK, front_content, back_content, difficulty, last_reviewed, next_review, created_at, updated_at).  
  - `folders` (id, name, user_id FK, collection_ids UUID[], is_public, created_at, updated_at).  
- Índices: user_id en collections y folders; collection_id en cards; GIN en topics y collection_ids; weekly_xp para rankings.  
- Habilitar RLS en todas.

**Paso 1.2 – RLS (`00002_rls.sql`)**  
- **profiles:** SELECT para authenticated; INSERT/UPDATE solo con auth.uid() = id.  
- **collections:** SELECT donde user_id = auth.uid() OR is_public = true; INSERT/UPDATE/DELETE solo user_id = auth.uid().  
- **cards:** SELECT/INSERT/UPDATE/DELETE vía EXISTS (collection pertenece a auth.uid()).  
- **folders:** SELECT donde user_id = auth.uid() OR is_public = true; INSERT/UPDATE/DELETE solo user_id = auth.uid().

**Paso 1.3 – Funciones y triggers (`00003_functions_triggers.sql`)**  
- `handle_new_user()`: INSERT en profiles (id, email, updated_at) en signup.  
- `sync_user_metadata()`: UPDATE profiles desde auth.users.raw_user_meta_data.  
- Triggers: `on_auth_user_created`, `on_auth_user_metadata_updated`.  
- `validate_collection_ownership()` para folders: comprobar que todos los UUID en collection_ids sean colecciones del usuario. Trigger BEFORE INSERT OR UPDATE en folders.  
- `update_user_xp(user_id UUID, xp_amount INTEGER)`: actualizar daily_xp_history y weekly_xp (misma lógica que hoy).  
- `reset_weekly_xp()`: UPDATE profiles SET weekly_xp = 0.  
- Dar permisos necesarios (SECURITY DEFINER donde haga falta, ejecución para authenticated/service role).

**Paso 1.4 – Validación manual**  
- Aplicar migraciones en un proyecto Supabase (Dashboard SQL o `supabase db push`).  
- Crear un usuario desde Dashboard (Auth) y comprobar que aparece en `profiles`.  
- Desde SQL Editor: insertar una collection, unas cards y un folder; probar que RLS impide ver/editar datos de otro usuario.

### Fase 2: Pruebas automatizadas (1–2 días)

1. **Script de Auth:** (Bash o Node con `@supabase/supabase-js`) signUp con email/password, getSession, signIn, comprobar que el perfil existe.  
2. **Script de CRUD:** Con un usuario de prueba: crear collection → crear cards → crear folder con esa collection_id → leer collections y folders → actualizar una card → borrar una card.  
3. **Script de XP:** Llamar `supabase.rpc('update_user_xp', { user_id, xp_amount: 10 })` y hacer SELECT a profiles para ver weekly_xp y daily_xp_history.  
4. Opcional: integrar en CI (ej. GitHub Actions) con proyecto Supabase de staging y variables secretas.

### Fase 3: Contrato y documentación (0,5 día)

1. **API-CONTRACT.md:** Listar tablas, columnas, operaciones que el frontend actual espera (ej. “collections: select by user_id”, “cards: insert/delete by collection_id”, “rpc update_user_xp”). Así, cuando retomes el frontend, sabrás exactamente qué debe seguir funcionando.  
2. Actualizar el README del backend con: cómo aplicar migraciones, cómo ejecutar los scripts de prueba, y enlace a API-CONTRACT.

---

## 6. Cómo validar que “funciona”

| Prueba | Cómo |
|--------|------|
| Migraciones aplican sin error | Ejecutar en orden en un proyecto Supabase (nuevo o de staging). |
| Perfil se crea al registrarse | Crear usuario en Auth → verificar una fila en `profiles` con mismo id y email. |
| RLS protege datos | Con usuario A: crear collection; con usuario B: intentar SELECT/UPDATE de esa collection → debe fallar o no devolver filas. |
| CRUD collections/cards/folders | Script que cree, lea, actualice y borre (con el mismo usuario) y compruebe resultados. |
| XP se actualiza | Llamar `update_user_xp` y comprobar que `weekly_xp` y el día correspondiente en `daily_xp_history` cambian. |
| Públicas | Marcar collection/folder is_public = true; con otro usuario (o anónimo si se permite) comprobar que puede hacer SELECT. |

Cuando todo lo anterior pase, el MVP backend está “probado y funcionando”.

---

## 7. Escalado posterior (sin tocar frontend todavía)

- **Fase 2 backend (social):** Añadir migración con following_ids/follower_ids, políticas y lógica de follow/unfollow (incluyendo “quitar” de follower_ids).  
- **Fase 3 backend (rankings):** Vista o función que devuelva top N por weekly_xp; o exponer vía Edge Function si se prefiere no exponer la tabla completa.  
- **Fase 4 (opcional):** Mover llamadas a OpenRouter a Edge Functions; configurar Storage para cover_url y avatares.  
- Cuando el frontend se retome: apuntar la app al mismo proyecto Supabase (mismas URLs y anon key); el contrato (tablas, RPC) ya está documentado en API-CONTRACT.

---

## 8. Resumen de entregables

| Entregable | Descripción |
|------------|-------------|
| **Carpeta backend/** | Estructura con migraciones, scripts y docs. |
| **00001_initial_schema.sql** | Tablas profiles, collections, cards, folders + índices + RLS enabled. |
| **00002_rls.sql** | Políticas RLS completas y consistentes. |
| **00003_functions_triggers.sql** | Triggers de perfil, validación de folders, update_user_xp, reset_weekly_xp. |
| **scripts/test-*.ts (o .sh)** | Pruebas de Auth, CRUD y XP. |
| **README.md** | Cómo configurar, aplicar y probar. |
| **docs/API-CONTRACT.md** | Contrato para el frontend (qué tablas y operaciones usa). |

Con esto tienes un **backend MVP limpio**, alineado con lo que hoy usa la app pero sin el peso de 14 migraciones y lógica social incompleta, **probado** con scripts y listo para **escalar por fases** (social, rankings, IA, storage) cuando toque.

Si quieres, el siguiente paso puede ser generar la carpeta `backend/` y los archivos `00001`, `00002` y `00003` con el SQL concreto basado en este plan.
