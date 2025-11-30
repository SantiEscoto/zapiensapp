-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create public schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS public;

-- Create collections table in public schema
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    language TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select their own collections
CREATE POLICY "users_select_own_collections"
    ON public.collections
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy to allow users to insert their own collections
CREATE POLICY "users_insert_own_collections"
    ON public.collections
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own collections
CREATE POLICY "users_update_own_collections"
    ON public.collections
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy to allow users to delete their own collections
CREATE POLICY "users_delete_own_collections"
    ON public.collections
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create cards table in public schema
CREATE TABLE IF NOT EXISTS public.cards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    front_content TEXT NOT NULL,
    back_content TEXT NOT NULL,
    difficulty INTEGER DEFAULT 0,
    last_reviewed TIMESTAMP WITH TIME ZONE,
    next_review TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security for cards
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select their own cards
CREATE POLICY "users_select_own_cards"
    ON public.cards
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.collections
        WHERE collections.id = cards.collection_id
        AND collections.user_id = auth.uid()
    ));

-- Policy to allow users to insert their own cards
CREATE POLICY "users_insert_own_cards"
    ON public.cards
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.collections
        WHERE collections.id = collection_id
        AND collections.user_id = auth.uid()
    ));

-- Policy to allow users to update their own cards
CREATE POLICY "users_update_own_cards"
    ON public.cards
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.collections
        WHERE collections.id = cards.collection_id
        AND collections.user_id = auth.uid()
    ));

-- Policy to allow users to delete their own cards
CREATE POLICY "users_delete_own_cards"
    ON public.cards
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.collections
        WHERE collections.id = cards.collection_id
        AND collections.user_id = auth.uid()
    ));
