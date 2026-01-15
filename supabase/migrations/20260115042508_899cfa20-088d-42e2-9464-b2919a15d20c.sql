-- Create metas table for user goals
CREATE TABLE public.metas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  banca_id UUID REFERENCES public.bancas(id) ON DELETE CASCADE,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('mensal', 'anual')),
  mes INTEGER CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL,
  valor_meta NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, banca_id, tipo, mes, ano)
);

-- Enable Row Level Security
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own metas" 
ON public.metas 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own metas" 
ON public.metas 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own metas" 
ON public.metas 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own metas" 
ON public.metas 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_metas_updated_at
BEFORE UPDATE ON public.metas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();