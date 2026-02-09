# ZapCards Backend MVP

Backend limpio y probado para ZapCards: schema único, RLS claro y scripts de validación.

## Requisitos

- Node 20+
- Proyecto en [Supabase](https://supabase.com) (o Supabase local con CLI)

## Estructura

```
backend/
├── README.md
├── .env.example
├── supabase/migrations/
│   ├── 00001_initial_schema.sql   # Tablas + índices
│   ├── 00002_rls.sql             # Políticas RLS
│   ├── 00003_functions_triggers.sql  # Triggers, update_user_xp, reset_weekly_xp
│   ├── 00004_social.sql          # following_ids / follower_ids + trigger
│   ├── 00005_social_rpc_and_rankings.sql  # follow_user, unfollow_user, vista rankings_weekly
│   ├── 00006_security_and_rls_fixes.sql   # Vista security_invoker, RLS (select auth.uid()), índice no usado
│   └── 00007_rankings_include_current_user.sql  # Incluir usuario actual en rankings aunque tenga 0 XP
├── scripts/
│   ├── test-auth.ts
│   ├── test-crud.ts
│   ├── test-xp.ts
│   └── test-social.ts
└── docs/
    └── API-CONTRACT.md
```

## Aplicar migraciones

### Opción A: Supabase Dashboard

1. En tu proyecto Supabase → **SQL Editor**.
2. Ejecutar en orden:
   - Contenido de `supabase/migrations/00001_initial_schema.sql`
   - Contenido de `supabase/migrations/00002_rls.sql`
   - Contenido de `supabase/migrations/00003_functions_triggers.sql`
   - Contenido de `supabase/migrations/00004_social.sql` (social)
   - Contenido de `supabase/migrations/00005_social_rpc_and_rankings.sql` (RPCs follow/unfollow + rankings)
   - Contenido de `supabase/migrations/00006_security_and_rls_fixes.sql` (seguridad y RLS)
   - Contenido de `supabase/migrations/00007_rankings_include_current_user.sql` (rankings incluyen al usuario actual)

### Opción B: Supabase CLI

```bash
# En la raíz del repo (donde está supabase/config.toml) o en backend/
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

Si las migraciones del backend están en `backend/supabase/migrations/`, indica esa ruta o copia esas migraciones al `supabase/migrations/` del proyecto principal y luego `supabase db push`.

## Variables de entorno

```bash
cp .env.example .env
# Editar .env con SUPABASE_URL y SUPABASE_ANON_KEY (Dashboard → Project Settings → API)
```

## Ejecutar pruebas

En desarrollo, desactiva "Confirm email" en Authentication → Providers → Email para que los signUp de los scripts no requieran confirmación.

```bash
npm install
npm run test:auth    # Auth + creación de perfil
npm run test:crud    # CRUD collections, cards, folders
npm run test:xp      # RPC update_user_xp
npm run test:social   # Follow/unfollow (requiere 00004 + 00005)
npm run test:rankings # Vista rankings_weekly (requiere 00005)
npm run test:all      # Todas
```

## Seguridad (Dashboard)

- **Leaked password protection**: En Supabase → **Authentication** → **Providers** → **Email** activa **“Enable leaked password protection”** para que Auth compruebe contraseñas contra HaveIBeenPwned y rechace las comprometidas.

## Contrato para el frontend

Ver **docs/API-CONTRACT.md** para tablas, columnas y operaciones que la app espera al volver a conectar el frontend.
