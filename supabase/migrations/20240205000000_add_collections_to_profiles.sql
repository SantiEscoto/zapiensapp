-- Add collections array column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS collections UUID[] DEFAULT ARRAY[]::UUID[];

-- Create an index on the collections array for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_collections ON public.profiles USING GIN (collections);

-- Function to update collections array when a new collection is created
CREATE OR REPLACE FUNCTION public.update_profile_collections()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET collections = array_append(collections, NEW.id)
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update profile collections on collection creation
CREATE OR REPLACE TRIGGER on_collection_created
    AFTER INSERT ON public.collections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_profile_collections();

-- Function to remove collection from array when deleted
CREATE OR REPLACE FUNCTION public.remove_profile_collection()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET collections = array_remove(collections, OLD.id)
    WHERE id = OLD.user_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically remove collection from profile when deleted
CREATE OR REPLACE TRIGGER on_collection_deleted
    BEFORE DELETE ON public.collections
    FOR EACH ROW
    EXECUTE FUNCTION public.remove_profile_collection();

-- Update existing profiles with their collections
UPDATE public.profiles p
SET collections = ARRAY(
    SELECT id
    FROM public.collections c
    WHERE c.user_id = p.id
);