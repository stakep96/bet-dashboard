-- Add 'entry' column to store bet entry description (distinct from market)
ALTER TABLE public.entradas 
ADD COLUMN entry TEXT;

-- Add a comment to clarify the purpose of this column
COMMENT ON COLUMN public.entradas.entry IS 'Description of the bet entry, e.g., "Acima de 9.5" for a market like "Total escanteios"';