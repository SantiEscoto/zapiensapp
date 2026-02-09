-- =============================================================================
-- ZapCards Backend MVP - Funciones y triggers
-- Auth → perfil, metadata sync, validación folders, XP
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Crear perfil al registrar usuario (auth.users)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        now()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 2. Sincronizar perfil cuando cambia metadata en auth.users (OAuth name/avatar)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_user_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.profiles
    SET
        full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
        avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', avatar_url),
        updated_at = now()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_metadata_updated ON auth.users;
CREATE TRIGGER on_auth_user_metadata_updated
    AFTER UPDATE OF raw_user_meta_data ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_user_metadata();

-- -----------------------------------------------------------------------------
-- 3. Validar que las colecciones de un folder pertenezcan al usuario
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_folder_collection_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.collection_ids IS NOT NULL AND array_length(NEW.collection_ids, 1) > 0 THEN
        IF EXISTS (
            SELECT 1 FROM unnest(NEW.collection_ids) AS cid
            WHERE NOT EXISTS (
                SELECT 1 FROM public.collections c
                WHERE c.id = cid AND c.user_id = auth.uid()
            )
        ) THEN
            RAISE EXCEPTION 'Cannot add collections that do not belong to the user';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_folder_collection_ownership ON public.folders;
CREATE TRIGGER validate_folder_collection_ownership
    BEFORE INSERT OR UPDATE OF collection_ids ON public.folders
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_folder_collection_ownership();

-- -----------------------------------------------------------------------------
-- 4. XP: actualizar daily_xp_history y weekly_xp (solo el propio usuario)
-- -----------------------------------------------------------------------------
-- Parámetros user_id y xp_amount para coincidir con la API (supabase.rpc('update_user_xp', { user_id, xp_amount }))
CREATE OR REPLACE FUNCTION public.update_user_xp(user_id UUID, xp_amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    day_key TEXT;
    current_val INTEGER;
    new_history JSONB;
BEGIN
    IF update_user_xp.user_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'Can only update own XP';
    END IF;
    day_key := LOWER(TRIM(TO_CHAR(now(), 'day')));
    SELECT daily_xp_history INTO new_history FROM public.profiles WHERE id = update_user_xp.user_id;
    IF new_history IS NULL THEN
        new_history := '{"monday":0,"tuesday":0,"wednesday":0,"thursday":0,"friday":0,"saturday":0,"sunday":0}'::jsonb;
    END IF;
    current_val := COALESCE((new_history->>day_key)::integer, 0);
    new_history := jsonb_set(new_history, ARRAY[day_key], to_jsonb(current_val + update_user_xp.xp_amount));
    UPDATE public.profiles
    SET daily_xp_history = new_history, weekly_xp = weekly_xp + update_user_xp.xp_amount
    WHERE id = update_user_xp.user_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- 5. Reset semanal de XP (para cron / pg_cron o externo)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reset_weekly_xp()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.profiles SET weekly_xp = 0;
END;
$$;
