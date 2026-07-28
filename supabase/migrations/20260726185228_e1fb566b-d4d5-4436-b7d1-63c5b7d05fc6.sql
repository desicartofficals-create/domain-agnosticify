ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS country_code text;
CREATE INDEX IF NOT EXISTS visits_country_idx ON public.visits (country);