-- =============================================================================
-- ZapCards Backend - RPCs para follow/unfollow (evitan RLS en trigger) + Rankings
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. follow_user(target_id) - Solo el usuario autenticado puede seguir a otro
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.follow_user(target_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF target_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot follow yourself';
  END IF;
  -- Añadir target_id a mi following_ids (si no está ya)
  UPDATE public.profiles
  SET following_ids = array_append(COALESCE(following_ids, ARRAY[]::UUID[]), target_id),
      updated_at = now()
  WHERE id = auth.uid() AND (NOT (target_id = ANY(COALESCE(following_ids, ARRAY[]::UUID[]))));
  -- Añadirme al follower_ids del otro (solo si no estaba)
  UPDATE public.profiles
  SET follower_ids = array_append(COALESCE(follower_ids, ARRAY[]::UUID[]), auth.uid()),
      updated_at = now()
  WHERE id = target_id AND (NOT (auth.uid() = ANY(COALESCE(follower_ids, ARRAY[]::UUID[]))));
END;
$$;

-- -----------------------------------------------------------------------------
-- 2. unfollow_user(target_id)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.unfollow_user(target_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  UPDATE public.profiles
  SET following_ids = array_remove(COALESCE(following_ids, ARRAY[]::UUID[]), target_id),
      updated_at = now()
  WHERE id = auth.uid();
  UPDATE public.profiles
  SET follower_ids = array_remove(COALESCE(follower_ids, ARRAY[]::UUID[]), auth.uid()),
      updated_at = now()
  WHERE id = target_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. Rankings: vista para top N por weekly_xp (solo datos públicos para listado)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.rankings_weekly AS
SELECT
  id,
  username,
  full_name,
  avatar_url,
  weekly_xp,
  cardinality(COALESCE(follower_ids, ARRAY[]::UUID[])) AS followers_count
FROM public.profiles
WHERE weekly_xp > 0
ORDER BY weekly_xp DESC;

-- La vista no tiene RLS; el cliente debe usar select sobre la vista.
-- En Supabase las vistas heredan permisos: hace falta GRANT SELECT a roles.
GRANT SELECT ON public.rankings_weekly TO authenticated;
GRANT SELECT ON public.rankings_weekly TO anon;
