-- =============================================================================
-- ZapCards Backend MVP - Políticas RLS
-- Convención: una política por operación por tabla cuando sea posible
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PROFILES
-- -----------------------------------------------------------------------------
-- Cualquier usuario autenticado puede leer perfiles (para rankings, amigos futuros)
CREATE POLICY "profiles_select_authenticated"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Solo el dueño puede insertar su perfil (trigger también inserta; esta política lo permite)
CREATE POLICY "profiles_insert_own"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Solo el dueño puede actualizar su perfil
CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Opcional: solo el dueño puede eliminarse (si en el futuro se permite borrar cuenta)
-- CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- COLLECTIONS
-- -----------------------------------------------------------------------------
-- Leer: propias o públicas
CREATE POLICY "collections_select_own_or_public"
    ON public.collections FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR is_public = true);

-- Anónimo puede leer solo públicas (para landing/explorar sin login si se desea)
CREATE POLICY "collections_select_public_anon"
    ON public.collections FOR SELECT
    TO anon
    USING (is_public = true);

CREATE POLICY "collections_insert_own"
    ON public.collections FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "collections_update_own"
    ON public.collections FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "collections_delete_own"
    ON public.collections FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- CARDS (acceso vía ownership de la colección)
-- -----------------------------------------------------------------------------
CREATE POLICY "cards_select_via_collection"
    ON public.cards FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.collections c
            WHERE c.id = cards.collection_id AND (c.user_id = auth.uid() OR c.is_public = true)
        )
    );

CREATE POLICY "cards_insert_via_collection"
    ON public.cards FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.collections c
            WHERE c.id = cards.collection_id AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "cards_update_via_collection"
    ON public.cards FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.collections c
            WHERE c.id = cards.collection_id AND c.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.collections c
            WHERE c.id = cards.collection_id AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "cards_delete_via_collection"
    ON public.cards FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.collections c
            WHERE c.id = cards.collection_id AND c.user_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- FOLDERS
-- -----------------------------------------------------------------------------
CREATE POLICY "folders_select_own_or_public"
    ON public.folders FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "folders_select_public_anon"
    ON public.folders FOR SELECT
    TO anon
    USING (is_public = true);

CREATE POLICY "folders_insert_own"
    ON public.folders FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "folders_update_own"
    ON public.folders FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "folders_delete_own"
    ON public.folders FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
