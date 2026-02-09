-- =============================================================================
-- ZapCards Backend MVP - Schema inicial (tablas e índices)
-- Orden: extension → tablas por dependencia → índices → RLS enabled
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Profiles (depende de auth.users vía FK)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    weekly_xp INTEGER NOT NULL DEFAULT 0,
    daily_xp_history JSONB NOT NULL DEFAULT '{"monday":0,"tuesday":0,"wednesday":0,"thursday":0,"friday":0,"saturday":0,"sunday":0}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_profiles_weekly_xp ON public.profiles (weekly_xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2. Collections
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    topics TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public BOOLEAN NOT NULL DEFAULT false,
    cover_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections (user_id);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON public.collections (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collections_topics ON public.collections USING GIN (topics);
CREATE INDEX IF NOT EXISTS idx_collections_is_public ON public.collections (is_public) WHERE is_public = true;

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 3. Cards
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    front_content TEXT NOT NULL,
    back_content TEXT NOT NULL,
    difficulty INTEGER NOT NULL DEFAULT 0,
    last_reviewed TIMESTAMPTZ,
    next_review TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cards_collection_id ON public.cards (collection_id);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 4. Folders
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    collection_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders (user_id);
CREATE INDEX IF NOT EXISTS idx_folders_collection_ids ON public.folders USING GIN (collection_ids);
CREATE INDEX IF NOT EXISTS idx_folders_is_public ON public.folders (is_public) WHERE is_public = true;

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
