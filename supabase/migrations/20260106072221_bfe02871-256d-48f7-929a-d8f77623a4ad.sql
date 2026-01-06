-- Add banca_id column to saldos table
ALTER TABLE public.saldos ADD COLUMN banca_id uuid REFERENCES public.bancas(id) ON DELETE CASCADE;

-- Add banca_id column to saldo_transacoes for consistency
ALTER TABLE public.saldo_transacoes ADD COLUMN banca_id uuid REFERENCES public.bancas(id) ON DELETE CASCADE;