-- =====================================================
-- ADICIONAR CAMPOS DO AUTENTIQUE NA TABELA VENDAS
-- Execute este script para adicionar os campos necessários
-- =====================================================

-- Adicionar campo para armazenar o ID do documento do Autentique
ALTER TABLE vendas 
ADD COLUMN IF NOT EXISTS autentique_document_id VARCHAR(100);

-- Adicionar campo para armazenar a URL do contrato (se não existir)
ALTER TABLE vendas 
ADD COLUMN IF NOT EXISTS contrato_url TEXT;

-- Adicionar campo para armazenar o status da assinatura (se não existir)
ALTER TABLE vendas 
ADD COLUMN IF NOT EXISTS assinatura_status VARCHAR(50) DEFAULT 'pendente';

-- Adicionar campo para armazenar o ID da assinatura (se não existir)
ALTER TABLE vendas 
ADD COLUMN IF NOT EXISTS assinatura_id VARCHAR(100);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_vendas_autentique_document_id ON vendas(autentique_document_id);
CREATE INDEX IF NOT EXISTS idx_vendas_assinatura_status ON vendas(assinatura_status);

-- Mostrar estrutura atualizada da tabela vendas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'vendas' 
AND table_schema = 'public'
AND column_name IN ('autentique_document_id', 'contrato_url', 'assinatura_status', 'assinatura_id')
ORDER BY ordinal_position;

-- =====================================================
-- FIM DA ADIÇÃO DOS CAMPOS
-- ===================================================== 