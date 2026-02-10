-- =============================================================================
-- Generar username (desde email, único con número si hay repetido) y full_name
-- al crear perfil en handle_new_user.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  candidate_username TEXT;
  suffix INT := 1;
  email_part TEXT;
  generated_full_name TEXT;
BEGIN
  email_part := lower(COALESCE(split_part(COALESCE(NEW.email, ''), '@', 1), ''));
  -- Username: solo letras, números y guión bajo; mínimo 2 caracteres
  base_username := regexp_replace(email_part, '[^a-z0-9_]', '', 'g');
  IF length(base_username) < 2 THEN
    base_username := 'user';
  END IF;

  candidate_username := base_username;
  WHILE EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(username) = lower(candidate_username)
  ) LOOP
    candidate_username := base_username || suffix;
    suffix := suffix + 1;
  END LOOP;

  -- Full name: parte antes del @ con . y _ como espacios; initcap
  generated_full_name := initcap(
    replace(replace(email_part, '.', ' '), '_', ' ')
  );
  generated_full_name := trim(regexp_replace(generated_full_name, '\s+', ' ', 'g'));
  IF length(generated_full_name) < 2 THEN
    generated_full_name := candidate_username;
  END IF;

  INSERT INTO public.profiles (id, email, username, full_name, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    candidate_username,
    generated_full_name,
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- RPC para crear perfil con username/full_name generados (fallback desde app
-- cuando el perfil no existe, p. ej. OAuth o usuario creado antes del trigger).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_profile_with_generated_fields(
  p_id uuid,
  p_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  candidate_username TEXT;
  suffix INT := 1;
  email_part TEXT;
  generated_full_name TEXT;
BEGIN
  IF p_id IS NULL OR p_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF p_email IS NULL OR p_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  email_part := lower(split_part(p_email, '@', 1));
  base_username := regexp_replace(email_part, '[^a-z0-9_]', '', 'g');
  IF length(base_username) < 2 THEN
    base_username := 'user';
  END IF;

  candidate_username := base_username;
  WHILE EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(username) = lower(candidate_username)
      AND id != p_id
  ) LOOP
    candidate_username := base_username || suffix;
    suffix := suffix + 1;
  END LOOP;

  generated_full_name := initcap(
    replace(replace(email_part, '.', ' '), '_', ' ')
  );
  generated_full_name := trim(regexp_replace(generated_full_name, '\s+', ' ', 'g'));
  IF length(generated_full_name) < 2 THEN
    generated_full_name := candidate_username;
  END IF;

  INSERT INTO public.profiles (id, email, username, full_name, updated_at)
  VALUES (p_id, p_email, candidate_username, generated_full_name, now())
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Permitir a usuarios autenticados crear solo su propio perfil
GRANT EXECUTE ON FUNCTION public.create_profile_with_generated_fields(uuid, text) TO authenticated;
