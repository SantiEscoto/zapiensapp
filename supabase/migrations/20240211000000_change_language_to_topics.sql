-- Change language column to topics array in collections table
ALTER TABLE public.collections
DROP COLUMN IF EXISTS language,
ADD COLUMN IF NOT EXISTS topics TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create an index on the topics array for better query performance
CREATE INDEX IF NOT EXISTS idx_collections_topics ON public.collections USING GIN (topics);

-- Update existing collections to have a default topic
UPDATE public.collections
SET topics = ARRAY['General']::TEXT[]
WHERE topics IS NULL OR array_length(topics, 1) IS NULL; 