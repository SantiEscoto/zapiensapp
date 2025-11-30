-- Add is_public column to collections table
ALTER TABLE public.collections
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Update RLS policies to allow public access to public collections
DROP POLICY IF EXISTS "users_select_own_collections" ON public.collections;

CREATE POLICY "users_select_collections"
    ON public.collections
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR
        is_public = true
    );