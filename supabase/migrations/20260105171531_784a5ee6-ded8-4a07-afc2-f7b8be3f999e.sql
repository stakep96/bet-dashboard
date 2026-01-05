-- Create bancas table
CREATE TABLE public.bancas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  initial_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  current_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create entradas table
CREATE TABLE public.entradas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banca_id UUID NOT NULL REFERENCES public.bancas(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  modality TEXT NOT NULL,
  event TEXT NOT NULL,
  market TEXT,
  odd DECIMAL(8,3),
  stake DECIMAL(12,2) NOT NULL DEFAULT 0,
  result TEXT NOT NULL DEFAULT 'Pendente',
  profit DECIMAL(12,2) NOT NULL DEFAULT 0,
  betting_house TEXT,
  timing TEXT,
  bet_type TEXT DEFAULT 'Simples',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entradas ENABLE ROW LEVEL SECURITY;

-- Bancas RLS policies
CREATE POLICY "Users can view their own bancas"
ON public.bancas FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bancas"
ON public.bancas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bancas"
ON public.bancas FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bancas"
ON public.bancas FOR DELETE
USING (auth.uid() = user_id);

-- Entradas RLS policies
CREATE POLICY "Users can view their own entradas"
ON public.entradas FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own entradas"
ON public.entradas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entradas"
ON public.entradas FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entradas"
ON public.entradas FOR DELETE
USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers
CREATE TRIGGER update_bancas_updated_at
BEFORE UPDATE ON public.bancas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_entradas_updated_at
BEFORE UPDATE ON public.entradas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();