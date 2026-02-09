-- =============================================================================
-- ZapCards Backend - Rankings: incluir al usuario actual aunque tenga 0 XP
-- =============================================================================
-- Así el usuario logueado siempre aparece en el leaderboard para compararse.
-- anon sigue viendo solo perfiles con weekly_xp > 0 (auth.uid() es null).
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
WHERE weekly_xp > 0 OR id = (SELECT auth.uid())
ORDER BY weekly_xp DESC;

GRANT SELECT ON public.rankings_weekly TO authenticated;
GRANT SELECT ON public.rankings_weekly TO anon;
