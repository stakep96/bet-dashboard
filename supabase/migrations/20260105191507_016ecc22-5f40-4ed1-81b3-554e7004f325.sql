-- Add event_date column to entradas table
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS event_date date;

-- Set default value for existing rows (copy from date column)
UPDATE public.entradas SET event_date = date WHERE event_date IS NULL;