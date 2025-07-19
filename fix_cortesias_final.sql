-- =====================================================
-- FIX FINAL - AJUSTAR COLUNAS CORTESIAS
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- Ajustar colunas obrigatórias
ALTER TABLE cortesias ALTER COLUMN telefone SET NOT NULL;
ALTER TABLE cortesias ALTER COLUMN cidade SET NOT NULL;

-- Remover colunas desnecessárias
ALTER TABLE cortesias DROP COLUMN IF EXISTS email;
ALTER TABLE cortesias DROP COLUMN IF EXISTS data_nascimento;
ALTER TABLE cortesias DROP COLUMN IF EXISTS estado_civil;
ALTER TABLE cortesias DROP COLUMN IF EXISTS profissao;
ALTER TABLE cortesias DROP COLUMN IF EXISTS cep;
ALTER TABLE cortesias DROP COLUMN IF EXISTS endereco;
ALTER TABLE cortesias DROP COLUMN IF EXISTS bairro;
ALTER TABLE cortesias DROP COLUMN IF EXISTS estado;
ALTER TABLE cortesias DROP COLUMN IF EXISTS numero;
ALTER TABLE cortesias DROP COLUMN IF EXISTS complemento;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_cortesias_confirmada ON cortesias(confirmada);
CREATE INDEX IF NOT EXISTS idx_cortesias_cidade ON cortesias(cidade);

-- Verificar resultado
SELECT '✅ COLUNAS AJUSTADAS COM SUCESSO!' as status;

-- Mostrar estrutura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'cortesias' 
AND table_schema = 'public'
ORDER BY ordinal_position; 