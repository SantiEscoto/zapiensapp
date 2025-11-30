-- Remove cover_url column from collections table
ALTER TABLE public.collections
DROP COLUMN IF EXISTS cover_url;