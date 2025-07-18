-- =====================================================
-- ADICIONAR CAMPO TIPO_CONTRATO NA TABELA VENDAS
-- Execute este script para adicionar o campo necessário
-- =====================================================

-- Adicionar campo para armazenar o tipo de contrato
ALTER TABLE vendas 
ADD COLUMN IF NOT EXISTS tipo_contrato VARCHAR(100) DEFAULT 'Lote Vitalício Therra';

-- Atualizar registros existentes com o valor padrão
UPDATE vendas 
SET tipo_contrato = 'Lote Vitalício Therra' 
WHERE tipo_contrato IS NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_vendas_tipo_contrato ON vendas(tipo_contrato);

-- Mostrar estrutura atualizada da tabela vendas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'vendas' 
AND table_schema = 'public'
AND column_name = 'tipo_contrato'
ORDER BY ordinal_position;

-- =====================================================
-- FIM DA ADIÇÃO DO CAMPO
-- ===================================================== 