-- Add policy to allow authenticated users to insert their own profile
CREATE POLICY "users_can_insert_own_profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Add policy to allow authenticated users to read profiles
CREATE POLICY "users_can_read_profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);