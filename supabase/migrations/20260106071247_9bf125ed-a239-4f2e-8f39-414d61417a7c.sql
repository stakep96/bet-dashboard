-- Create table for betting sites/accounts
CREATE TABLE public.saldos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saldos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own saldos" ON public.saldos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own saldos" ON public.saldos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own saldos" ON public.saldos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saldos" ON public.saldos FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_saldos_updated_at
BEFORE UPDATE ON public.saldos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for transactions (deposits/withdrawals)
CREATE TABLE public.saldo_transacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  saldo_id UUID NOT NULL REFERENCES public.saldos(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposito', 'saque')),
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saldo_transacoes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own saldo_transacoes" ON public.saldo_transacoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own saldo_transacoes" ON public.saldo_transacoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saldo_transacoes" ON public.saldo_transacoes FOR DELETE USING (auth.uid() = user_id);