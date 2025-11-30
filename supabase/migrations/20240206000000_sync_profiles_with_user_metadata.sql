-- Update profiles with metadata from auth.users
UPDATE public.profiles p
SET 
    full_name = COALESCE(
        (auth.users.raw_user_meta_data->>'full_name')::TEXT,
        p.full_name
    ),
    avatar_url = COALESCE(
        (auth.users.raw_user_meta_data->>'avatar_url')::TEXT,
        p.avatar_url
    )
FROM auth.users
WHERE p.id = auth.users.id;

-- Create a trigger function to keep profiles in sync with auth.users metadata
CREATE OR REPLACE FUNCTION public.sync_user_metadata()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET 
        full_name = COALESCE(
            (NEW.raw_user_meta_data->>'full_name')::TEXT,
            full_name
        ),
        avatar_url = COALESCE(
            (NEW.raw_user_meta_data->>'avatar_url')::TEXT,
            avatar_url
        ),
        updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically sync metadata changes
DROP TRIGGER IF EXISTS on_auth_user_metadata_updated ON auth.users;
CREATE TRIGGER on_auth_user_metadata_updated
    AFTER UPDATE OF raw_user_meta_data ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_user_metadata();