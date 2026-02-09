-- =============================================================================
-- ZapCards Backend - Fase 2: Social (following_ids / follower_ids)
-- Mantiene follower_ids sincronizado cuando un usuario sigue o deja de seguir.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Columnas en profiles
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS following_ids UUID[] DEFAULT ARRAY[]::UUID[],
ADD COLUMN IF NOT EXISTS follower_ids UUID[] DEFAULT ARRAY[]::UUID[];

CREATE INDEX IF NOT EXISTS idx_profiles_following_ids ON public.profiles USING GIN (following_ids);
CREATE INDEX IF NOT EXISTS idx_profiles_follower_ids ON public.profiles USING GIN (follower_ids);

-- -----------------------------------------------------------------------------
-- 2. Sincronizar follower_ids al seguir / dejar de seguir
-- Cuando el usuario A actualiza su following_ids:
-- - Añadimos A al follower_ids de cada nuevo seguido.
-- - Quitamos A del follower_ids de cada usuario que A dejó de seguir.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_follower_ids()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  added_id UUID;
  removed_id UUID;
BEGIN
  -- Quitar al usuario actual (NEW.id) del follower_ids de quienes ya no sigue
  IF OLD.following_ids IS NOT NULL AND array_length(OLD.following_ids, 1) > 0 THEN
    FOREACH removed_id IN ARRAY OLD.following_ids
    LOOP
      IF NEW.following_ids IS NULL OR NOT (removed_id = ANY(NEW.following_ids)) THEN
        UPDATE public.profiles
        SET follower_ids = array_remove(follower_ids, NEW.id),
            updated_at = now()
        WHERE id = removed_id;
      END IF;
    END LOOP;
  END IF;

  -- Añadir al usuario actual (NEW.id) al follower_ids de cada nuevo seguido
  IF NEW.following_ids IS NOT NULL AND array_length(NEW.following_ids, 1) > 0 THEN
    FOREACH added_id IN ARRAY NEW.following_ids
    LOOP
      IF OLD.following_ids IS NULL OR NOT (added_id = ANY(OLD.following_ids)) THEN
        UPDATE public.profiles
        SET follower_ids = array_append(COALESCE(follower_ids, ARRAY[]::UUID[]), NEW.id),
            updated_at = now()
        WHERE id = added_id;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_following_ids_change ON public.profiles;
CREATE TRIGGER on_following_ids_change
  AFTER UPDATE OF following_ids ON public.profiles
  FOR EACH ROW
  WHEN (OLD.following_ids IS DISTINCT FROM NEW.following_ids)
  EXECUTE FUNCTION public.sync_follower_ids();
