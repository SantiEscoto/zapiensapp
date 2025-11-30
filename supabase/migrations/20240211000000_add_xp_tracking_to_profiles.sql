-- Add weekly_xp and daily_xp_history fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS weekly_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_xp_history JSONB DEFAULT '{"monday": 0, "tuesday": 0, "wednesday": 0, "thursday": 0, "friday": 0, "saturday": 0, "sunday": 0}'::JSONB;

-- Create index on weekly_xp for better performance in rankings
CREATE INDEX IF NOT EXISTS idx_profiles_weekly_xp ON public.profiles (weekly_xp DESC);

-- Function to update daily XP and weekly XP
CREATE OR REPLACE FUNCTION public.update_user_xp(user_id UUID, xp_amount INTEGER)
RETURNS VOID AS $$
DECLARE
    day_of_week TEXT;
    current_daily_xp INTEGER;
    daily_history JSONB;
BEGIN
    -- Get the current day of the week in lowercase
    day_of_week := LOWER(TO_CHAR(NOW(), 'day'));
    day_of_week := TRIM(day_of_week);
    
    -- Get the current daily XP history
    SELECT daily_xp_history INTO daily_history FROM public.profiles WHERE id = user_id;
    
    -- Get current XP for today
    current_daily_xp := COALESCE((daily_history->day_of_week)::INTEGER, 0);
    
    -- Update the daily XP for today
    daily_history := jsonb_set(daily_history, ARRAY[day_of_week], to_jsonb(current_daily_xp + xp_amount));
    
    -- Update the profile with new daily XP history and increment weekly XP
    UPDATE public.profiles
    SET 
        daily_xp_history = daily_history,
        weekly_xp = weekly_xp + xp_amount
    WHERE id = user_id;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a weekly reset function to run on a schedule
CREATE OR REPLACE FUNCTION public.reset_weekly_xp()
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET weekly_xp = 0;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;