-- Add is_public column to folders table
ALTER TABLE public.folders
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Create policy to allow anyone to view public folders
CREATE POLICY "anyone_view_public_folders"
    ON public.folders
    FOR SELECT
    USING (is_public = true);