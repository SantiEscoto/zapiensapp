-- Add following_ids and follower_ids array columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS following_ids UUID[] DEFAULT ARRAY[]::UUID[],
ADD COLUMN IF NOT EXISTS follower_ids UUID[] DEFAULT ARRAY[]::UUID[];

-- Create indexes on the arrays for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_following_ids ON public.profiles USING GIN (following_ids);
CREATE INDEX IF NOT EXISTS idx_profiles_follower_ids ON public.profiles USING GIN (follower_ids);

-- Function to update follower_ids array when someone follows a user
CREATE OR REPLACE FUNCTION public.handle_new_follower()
RETURNS TRIGGER AS $$
BEGIN
    -- Add the follower's ID to the target user's follower_ids
    UPDATE public.profiles
    SET follower_ids = array_append(follower_ids, NEW.id)
    WHERE id = ANY(NEW.following_ids);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update follower_ids when following_ids is updated
CREATE OR REPLACE TRIGGER on_new_follower
    AFTER UPDATE OF following_ids ON public.profiles
    FOR EACH ROW
    WHEN (NEW.following_ids <> OLD.following_ids)
    EXECUTE FUNCTION public.handle_new_follower();

-- Create policy to allow users to update their own following_ids
CREATE POLICY "users_can_update_own_following"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);