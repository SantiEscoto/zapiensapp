# Contrato API Backend MVP (ZapCards)

Resumen de tablas, columnas y operaciones que el frontend (o cualquier cliente) puede usar contra este backend. Sirve para reconectar la app Expo sin sorpresas.

---

## Auth (Supabase Auth)

- **Sign up:** `supabase.auth.signUp({ email, password })`  
  Tras el registro, el trigger `handle_new_user` inserta una fila en `profiles` con `id`, `email`, `updated_at`.
- **Sign in:** `supabase.auth.signInWithPassword({ email, password })`
- **OAuth:** `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`  
  Tras el callback, `sync_user_metadata` actualiza `full_name` y `avatar_url` en `profiles` desde `auth.users.raw_user_meta_data`.
- **Session:** `supabase.auth.getUser()` / `supabase.auth.getSession()`

---

## Tabla `profiles`

| Columna           | Tipo     | Notas                          |
|-------------------|----------|---------------------------------|
| id                | UUID     | PK, FK a auth.users            |
| email             | TEXT     | NOT NULL                       |
| username          | TEXT     | UNIQUE, opcional               |
| full_name         | TEXT     | Sincronizado desde OAuth       |
| avatar_url        | TEXT     | Sincronizado desde OAuth       |
| updated_at        | TIMESTAMPTZ |                            |
| weekly_xp         | INTEGER  | Default 0, para rankings       |
| daily_xp_history  | JSONB    | `{ monday: 0, tuesday: 0, ... }` |
| following_ids     | UUID[]   | IDs de usuarios que sigo (Fase 2) |
| follower_ids      | UUID[]   | IDs de usuarios que me siguen (sincronizado por trigger) |

**Operaciones:**
- `select('*').eq('id', userId)` — perfil propio o de otros (lectura permitida a authenticated).
- `update({ username, full_name, following_ids, ... }).eq('id', userId)` — solo el dueño. Al cambiar `following_ids`, el trigger actualiza los `follower_ids` de los demás.

---

## Tabla `collections`

| Columna    | Tipo       | Notas                    |
|------------|------------|---------------------------|
| id         | UUID       | PK, default uuid_generate_v4() |
| name       | TEXT       | NOT NULL                  |
| topics     | TEXT[]     | Default []                |
| user_id    | UUID       | FK auth.users, NOT NULL   |
| is_public  | BOOLEAN    | Default false             |
| cover_url  | TEXT       | Opcional                  |
| created_at | TIMESTAMPTZ |                         |
| updated_at | TIMESTAMPTZ |                         |

**Operaciones:**
- Listar propias: `select('*').eq('user_id', userId)`.
- Listar públicas (explorar): `select('*').eq('is_public', true)` o filtrar en cliente.
- Insert: `insert({ name, topics, user_id, is_public, cover_url? })`.
- Update: `update({ name?, topics?, is_public?, cover_url? }).eq('id', id).eq('user_id', userId)`.
- Delete: `delete().eq('id', id).eq('user_id', userId)`.

---

## Tabla `cards`

| Columna        | Tipo       | Notas                    |
|----------------|------------|---------------------------|
| id             | UUID       | PK                        |
| collection_id  | UUID       | FK collections, NOT NULL  |
| front_content  | TEXT      | NOT NULL                  |
| back_content   | TEXT       | NOT NULL                  |
| difficulty     | INTEGER    | Default 0                 |
| last_reviewed  | TIMESTAMPTZ | Opcional                |
| next_review    | TIMESTAMPTZ | Opcional                |
| created_at     | TIMESTAMPTZ |                         |
| updated_at     | TIMESTAMPTZ |                         |

**Operaciones:**
- Por colección: `select('*').eq('collection_id', collectionId)` (solo si la colección es propia o pública).
- Insert: `insert({ collection_id, front_content, back_content, difficulty? })` (solo colección propia).
- Update: `update({ front_content?, back_content?, difficulty?, ... }).eq('id', cardId)`.
- Delete: `delete().eq('id', cardId)` o `delete().eq('collection_id', collectionId)` (borrar todas de una colección).

---

## Tabla `folders`

| Columna       | Tipo    | Notas                    |
|---------------|---------|---------------------------|
| id            | UUID    | PK                        |
| name          | TEXT    | NOT NULL                  |
| user_id       | UUID    | FK auth.users, NOT NULL   |
| collection_ids| UUID[]  | Default []                 |
| is_public     | BOOLEAN | Default false             |
| created_at    | TIMESTAMPTZ |                      |
| updated_at    | TIMESTAMPTZ |                      |

**Operaciones:**
- Listar propias: `select('*').eq('user_id', userId)`.
- Listar públicas: `select('*').eq('is_public', true)`.
- Insert: `insert({ name, user_id, collection_ids, is_public })`.  
  El trigger valida que todos los `collection_ids` sean colecciones del usuario.
- Update: `update({ name?, collection_ids?, is_public? }).eq('id', id).eq('user_id', userId)`.
- Delete: `delete().eq('id', id).eq('user_id', userId)`.

---

## RPC

### `update_user_xp(user_id UUID, xp_amount INTEGER)`

- Incrementa `weekly_xp` y el valor del día actual en `daily_xp_history` del perfil.
- Solo permite actualizar el propio usuario (`user_id` debe ser `auth.uid()`).
- Uso desde cliente: `supabase.rpc('update_user_xp', { user_id: userId, xp_amount: 10 })`.

### `reset_weekly_xp()`

- Pone `weekly_xp = 0` en todos los perfiles. Pensado para cron o tarea programada (por ejemplo con service role).

### `follow_user(target_id UUID)`

- Añade `target_id` a tu `following_ids` y tu id al `follower_ids` del otro. Usar en lugar de actualizar `following_ids` a mano (evita problemas de RLS).  
- Uso: `supabase.rpc('follow_user', { target_id: userId })`.

### `unfollow_user(target_id UUID)`

- Quita `target_id` de tu `following_ids` y tu id del `follower_ids` del otro.  
- Uso: `supabase.rpc('unfollow_user', { target_id: userId })`.

---

## Rankings

### Vista `rankings_weekly`

- `SELECT * FROM rankings_weekly` (o `.from('rankings_weekly').select('*')`) devuelve perfiles con `weekly_xp > 0` ordenados por XP descendente.
- Columnas: `id`, `username`, `full_name`, `avatar_url`, `weekly_xp`, `followers_count`.
- Pensada para la pantalla de rankings.

---

## Resumen de seguridad (RLS)

- **profiles:** lectura para authenticated; escritura solo propio perfil.
- **collections:** lectura propias + públicas; escritura solo propias.
- **cards:** lectura/escritura vía ownership de la colección (propia o pública solo lectura).
- **folders:** lectura propias + públicas; escritura solo propias; trigger impide añadir colecciones ajenas.

Cuando reconectes el frontend, usa las mismas `SUPABASE_URL` y `SUPABASE_ANON_KEY` y este contrato; no hay cambios en los nombres de tablas ni en la firma del RPC respecto al uso actual de la app.
