-- Add email column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- Update existing profiles with email from auth.users
UPDATE public.profiles
SET email = (
    SELECT email
    FROM auth.users
    WHERE users.id = profiles.id
)
WHERE email IS NULL;

-- Add not null constraint
ALTER TABLE public.profiles
ALTER COLUMN email SET NOT NULL;

-- Add unique constraint to prevent duplicate emails
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_email_key UNIQUE (email);

-- Create policy to allow users to update their own email
CREATE POLICY "users_can_update_own_email"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);