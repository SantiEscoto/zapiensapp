# Habilitar inicio de sesión con Google

La app ya tiene el botón y el flujo de Google OAuth (login y registro). Para que funcione solo falta configurar **Google Cloud** y **Supabase**.

---

## 1. Google Cloud Console

### 1.1 Proyecto y pantalla de consentimiento

1. Entra en [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un proyecto o selecciona uno existente.
3. Ve a **APIs & Services** → **OAuth consent screen**.
4. Elige **External** (o Internal si es solo para tu organización) → **Create**.
5. Rellena:
   - **App name**: p. ej. `ZapCards`
   - **User support email**: tu correo
   - **Developer contact**: tu correo
6. Guarda y continúa (scopes por defecto suelen bastar).

### 1.2 Crear credenciales OAuth

1. Ve a **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**.
2. **Application type**: **Web application**.
3. **Name**: p. ej. `ZapCards Web`.
4. **Authorized JavaScript origins** (orígenes de tu app):
   - Desarrollo:  
     `http://localhost:8081`  
     `http://localhost:8082`  
     `http://localhost:3000`
   - Producción:  
     `https://TU-DOMINIO.vercel.app`  
     (sustituye por tu URL real de Vercel, ej. `https://zapcards-xxx.vercel.app`)
5. **Authorized redirect URIs** (aquí va la URL de Supabase, no la de tu app):
   - `https://<TU-PROJECT-REF>.supabase.co/auth/v1/callback`  
   Sustituye `<TU-PROJECT-REF>` por el ID de tu proyecto Supabase (lo ves en la URL del dashboard: `https://app.supabase.com/project/XXXXX` → XXXXX es el ref).
6. **Create** → copia el **Client ID** y el **Client Secret**.

---

## 2. Supabase Dashboard

1. Entra en [Supabase](https://supabase.com) → tu proyecto.
2. **Authentication** → **Providers** → **Google**.
3. Activa **Enable Sign in with Google**.
4. Pega:
   - **Client ID**: el de Google.
   - **Client Secret**: el de Google.
5. Guarda.

### Redirect URLs (Site URL y Redirect URLs)

Para que tras iniciar sesión con Google el usuario vuelva a tu app:

1. **Authentication** → **URL Configuration**.
2. **Site URL**: tu URL de producción, ej. `https://zapcards-xxx.vercel.app`.
3. **Redirect URLs** debe incluir (con tu dominio real):
   - `https://zapcards-xxx.vercel.app/**`
   - `https://zapcards-xxx.vercel.app/auth/callback`
   - Para desarrollo:  
     `http://localhost:8081/**`  
     `http://localhost:8082/**`  
     `http://localhost:3000/**`  
     y si usas callback en dev:  
     `http://localhost:8081/auth/callback`  
     `http://localhost:8082/auth/callback`  
     `http://localhost:3000/auth/callback`

Guarda los cambios.

---

## 3. Comprobar en la app

- **Web (local):** Abre `http://localhost:8082` (o 8081) → Login o Registro → “Continuar con Google”. Debe abrir Google, elegir cuenta y volver a tu app en `/auth/callback` y luego a Home.
- **Producción:** Misma prueba en `https://TU-DOMINIO.vercel.app`.

Si algo falla, revisa la consola del navegador y en Supabase **Authentication** → **Logs** para ver el error.

---

## 4. Error 500 "unexpected_failure"

Si tras elegir la cuenta de Google ves un JSON como:

`{"code":500,"error_code":"unexpected_failure","msg":"Unexpected failure, please check server logs for more information"}`

suele ser un fallo **en el servidor de Supabase** (no en tu app). La app ya pide los scopes necesarios (`userinfo.email` y `userinfo.profile`) para evitar el error típico *"Error getting user email from external provider"*.

### Qué hacer

1. **Revisar logs en Supabase**  
   - Dashboard → **Logs** (Log Explorer).  
   - Filtra por **Auth** o por `status = 500`.  
   - Mira el mensaje exacto (trigger, constraint, SMTP, etc.).

2. **Errores de base de datos (trigger)**  
   Si el log menciona una función o trigger en `auth.users` (p. ej. `handle_new_user`), puede ser que el trigger falle al crear el perfil. Revisa en **SQL Editor** que la tabla `public.profiles` exista y que el trigger esté aplicado (migraciones del backend). Si quieres, en Logs puedes buscar errores del usuario `supabase_auth_admin`.

3. **Confirmación de email**  
   En **Authentication** → **Providers** → **Email** (o en la pestaña de Google), comprueba si tienes "Confirm email" activado. Para OAuth con Google no suele hacer falta confirmar de nuevo; si está activo y hay un fallo al enviar el correo, podría generar 500.

4. **Probar de nuevo**  
   Después de desplegar los cambios de la app (scopes), haz otra prueba de “Continuar con Google” en la misma sesión o en ventana de incógnito.

---

## Resumen rápido

| Dónde | Qué hacer |
|-------|-----------|
| **Google Cloud** | OAuth consent screen + OAuth client ID (Web). Redirect URI = `https://<PROJECT-REF>.supabase.co/auth/v1/callback`. Añadir orígenes (localhost y Vercel). |
| **Supabase** | Providers → Google: activar y pegar Client ID y Secret. URL Configuration: Site URL y Redirect URLs con tu dominio y `/auth/callback`. |
| **App** | Botón Google en login y registro con **scopes** `userinfo.email` y `userinfo.profile`, `redirectTo` a `/auth/callback`, y pantalla `(auth)/callback.tsx` que crea perfil si no existe y redirige a Home. |
