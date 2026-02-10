-- =============================================================================
-- Rankings: mostrar todos los usuarios registrados, ordenados por weekly_xp
-- Antes solo se veían quienes tenían weekly_xp > 0 (o el usuario actual).
-- Ahora aparece todo el mundo; los de 0 XP quedan al final.
-- =============================================================================

DROP VIEW IF EXISTS public.rankings_weekly;

CREATE VIEW public.rankings_weekly
WITH (security_invoker = true)
AS
SELECT
  id,
  username,
  full_name,
  avatar_url,
  weekly_xp,
  cardinality(COALESCE(follower_ids, ARRAY[]::UUID[])) AS followers_count
FROM public.profiles
ORDER BY weekly_xp DESC NULLS LAST;

GRANT SELECT ON public.rankings_weekly TO authenticated;
GRANT SELECT ON public.rankings_weekly TO anon;
