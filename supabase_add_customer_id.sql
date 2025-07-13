-- =====================================================
-- ADICIONAR CAMPO ASAAS_CUSTOMER_ID NA TABELA VENDAS
-- =====================================================

-- Adicionar coluna para armazenar o ID do customer do Asaas
ALTER TABLE vendas 
ADD COLUMN asaas_customer_id VARCHAR(100);

-- Adicionar índice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_vendas_asaas_customer_id 
ON vendas(asaas_customer_id);

-- Comentário na coluna para documentação
COMMENT ON COLUMN vendas.asaas_customer_id IS 'ID do customer criado no Asaas para esta venda';

-- =====================================================
-- VERIFICAR SE A COLUNA FOI ADICIONADA
-- =====================================================
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'vendas' AND column_name = 'asaas_customer_id'; 