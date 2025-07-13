-- Adicionar campo asaas_payment_id na tabela vendas
ALTER TABLE vendas 
ADD COLUMN IF NOT EXISTS asaas_payment_id VARCHAR(100);

-- Comentário explicativo
COMMENT ON COLUMN vendas.asaas_payment_id IS 'ID da cobrança criada no Asaas'; 