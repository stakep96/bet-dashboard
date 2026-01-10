-- Alterar o tipo da coluna event_date de date para text
-- Isso permite armazenar datas simples ou múltiplas datas separadas por pipe
ALTER TABLE entradas 
ALTER COLUMN event_date TYPE text 
USING event_date::text;