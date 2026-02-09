-- =============================================================================
-- ZapCards Backend - Correcciones de seguridad y rendimiento (scanner)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CRITICAL: Vista rankings_weekly como SECURITY INVOKER
--    La vista debe ejecutarse con permisos del usuario que consulta, no del owner.
--    Para que anon pueda leer el ranking, permitimos SELECT en profiles donde weekly_xp > 0.
-- -----------------------------------------------------------------------------

-- Política para anon: solo puede leer perfiles que aparecen en el ranking (weekly_xp > 0)
CREATE POLICY "profiles_select_public_ranking"
    ON public.profiles FOR SELECT
    TO anon
    USING (weekly_xp > 0);

-- Recrear vista con security_invoker (PostgreSQL 15+)
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
WHERE weekly_xp > 0
ORDER BY weekly_xp DESC;

GRANT SELECT ON public.rankings_weekly TO authenticated;
GRANT SELECT ON public.rankings_weekly TO anon;


-- -----------------------------------------------------------------------------
-- 2. WARNING: RLS en cards – usar (select auth.uid()) para no re-evaluar por fila
--    Mejora rendimiento a escala. Ver: docs Supabase Auth RLS.
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "cards_select_via_collection" ON public.cards;
CREATE POLICY "cards_select_via_collection"
    ON public.cards FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.collections c
            WHERE c.id = cards.collection_id
              AND (c.user_id = (SELECT auth.uid()) OR c.is_public = true)
        )
    );

DROP POLICY IF EXISTS "cards_insert_via_collection" ON public.cards;
CREATE POLICY "cards_insert_via_collection"
    ON public.cards FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.collections c
            WHERE c.id = cards.collection_id AND c.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "cards_update_via_collection" ON public.cards;
CREATE POLICY "cards_update_via_collection"
    ON public.cards FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.collections c
            WHERE c.id = cards.collection_id AND c.user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.collections c
            WHERE c.id = cards.collection_id AND c.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "cards_delete_via_collection" ON public.cards;
CREATE POLICY "cards_delete_via_collection"
    ON public.cards FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.collections c
            WHERE c.id = cards.collection_id AND c.user_id = (SELECT auth.uid())
        )
    );


-- -----------------------------------------------------------------------------
-- 3. INFO: Eliminar índice no usado (scanner reportó idx_cards_collection_id)
--    Si en el futuro se filtran consultas por collection_id, se puede recrear.
-- -----------------------------------------------------------------------------

DROP INDEX IF EXISTS public.idx_cards_collection_id;


-- -----------------------------------------------------------------------------
-- 4. Opcional: mismo patrón (select auth.uid()) en profiles, collections, folders
--    para evitar re-evaluación por fila y futuros avisos del scanner.
-- -----------------------------------------------------------------------------

-- Profiles
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

-- Collections
DROP POLICY IF EXISTS "collections_select_own_or_public" ON public.collections;
CREATE POLICY "collections_select_own_or_public"
    ON public.collections FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id OR is_public = true);

DROP POLICY IF EXISTS "collections_insert_own" ON public.collections;
CREATE POLICY "collections_insert_own"
    ON public.collections FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "collections_update_own" ON public.collections;
CREATE POLICY "collections_update_own"
    ON public.collections FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "collections_delete_own" ON public.collections;
CREATE POLICY "collections_delete_own"
    ON public.collections FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- Folders
DROP POLICY IF EXISTS "folders_select_own_or_public" ON public.folders;
CREATE POLICY "folders_select_own_or_public"
    ON public.folders FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id OR is_public = true);

DROP POLICY IF EXISTS "folders_insert_own" ON public.folders;
CREATE POLICY "folders_insert_own"
    ON public.folders FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "folders_update_own" ON public.folders;
CREATE POLICY "folders_update_own"
    ON public.folders FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "folders_delete_own" ON public.folders;
CREATE POLICY "folders_delete_own"
    ON public.folders FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);
