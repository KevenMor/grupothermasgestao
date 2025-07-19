-- =====================================================
-- FIX SIMPLES - ADICIONAR COLUNAS CORTESIAS
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- Adicionar coluna confirmada
ALTER TABLE cortesias ADD COLUMN IF NOT EXISTS confirmada BOOLEAN DEFAULT false;

-- Adicionar coluna data_confirmacao
ALTER TABLE cortesias ADD COLUMN IF NOT EXISTS data_confirmacao TIMESTAMP WITH TIME ZONE;

-- Verificar se funcionou
SELECT 'Colunas adicionadas com sucesso!' as status;

-- Mostrar estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'cortesias' 
AND table_schema = 'public'
ORDER BY ordinal_position; 