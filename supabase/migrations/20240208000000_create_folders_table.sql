-- Create folders table
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    collection_ids UUID[] DEFAULT ARRAY[]::UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- Create index on collection_ids array for better query performance
CREATE INDEX IF NOT EXISTS idx_folders_collection_ids ON public.folders USING GIN (collection_ids);

-- Policy to allow users to select their own folders
CREATE POLICY "users_select_own_folders"
    ON public.folders
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy to allow users to insert their own folders
CREATE POLICY "users_insert_own_folders"
    ON public.folders
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own folders
CREATE POLICY "users_update_own_folders"
    ON public.folders
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy to allow users to delete their own folders
CREATE POLICY "users_delete_own_folders"
    ON public.folders
    FOR DELETE
    USING (auth.uid() = user_id);

-- Function to validate collection ownership before adding to folder
CREATE OR REPLACE FUNCTION public.validate_collection_ownership()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.collections
        WHERE id = ANY(NEW.collection_ids)
        AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Cannot add collections that do not belong to the user';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to validate collection ownership before insert or update
CREATE TRIGGER validate_collection_ownership
    BEFORE INSERT OR UPDATE OF collection_ids ON public.folders
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_collection_ownership();