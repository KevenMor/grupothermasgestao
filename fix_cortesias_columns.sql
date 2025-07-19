-- =====================================================
-- FIX COLUNAS DA TABELA CORTESIAS - GRUPO THERMAS
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- Verificar estrutura atual da tabela
SELECT 'Estrutura atual da tabela cortesias:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'cortesias' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Adicionar colunas que estão faltando
DO $$
BEGIN
    -- Adicionar coluna confirmada se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'cortesias' AND column_name = 'confirmada') THEN
        ALTER TABLE cortesias ADD COLUMN confirmada BOOLEAN DEFAULT false;
        RAISE NOTICE 'Coluna confirmada adicionada';
    END IF;
    
    -- Adicionar coluna data_confirmacao se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'cortesias' AND column_name = 'data_confirmacao') THEN
        ALTER TABLE cortesias ADD COLUMN data_confirmacao TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Coluna data_confirmacao adicionada';
    END IF;
    
    -- Verificar se a coluna telefone é NOT NULL
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'cortesias' AND column_name = 'telefone' AND is_nullable = 'YES') THEN
        ALTER TABLE cortesias ALTER COLUMN telefone SET NOT NULL;
        RAISE NOTICE 'Coluna telefone definida como NOT NULL';
    END IF;
    
    -- Verificar se a coluna cidade é NOT NULL
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'cortesias' AND column_name = 'cidade' AND is_nullable = 'YES') THEN
        ALTER TABLE cortesias ALTER COLUMN cidade SET NOT NULL;
        RAISE NOTICE 'Coluna cidade definida como NOT NULL';
    END IF;
    
    -- Remover colunas que não são mais necessárias (se existirem)
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'cortesias' AND column_name = 'email') THEN
        ALTER TABLE cortesias DROP COLUMN email;
        RAISE NOTICE 'Coluna email removida';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'cortesias' AND column_name = 'data_nascimento') THEN
        ALTER TABLE cortesias DROP COLUMN data_nascimento;
        RAISE NOTICE 'Coluna data_nascimento removida';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'cortesias' AND column_name = 'estado_civil') THEN
        ALTER TABLE cortesias DROP COLUMN estado_civil;
        RAISE NOTICE 'Coluna estado_civil removida';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'cortesias' AND column_name = 'profissao') THEN
        ALTER TABLE cortesias DROP COLUMN profissao;
        RAISE NOTICE 'Coluna profissao removida';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'cortesias' AND column_name = 'cep') THEN
        ALTER TABLE cortesias DROP COLUMN cep;
        RAISE NOTICE 'Coluna cep removida';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'cortesias' AND column_name = 'endereco') THEN
        ALTER TABLE cortesias DROP COLUMN endereco;
        RAISE NOTICE 'Coluna endereco removida';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'cortesias' AND column_name = 'bairro') THEN
        ALTER TABLE cortesias DROP COLUMN bairro;
        RAISE NOTICE 'Coluna bairro removida';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'cortesias' AND column_name = 'estado') THEN
        ALTER TABLE cortesias DROP COLUMN estado;
        RAISE NOTICE 'Coluna estado removida';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'cortesias' AND column_name = 'numero') THEN
        ALTER TABLE cortesias DROP COLUMN numero;
        RAISE NOTICE 'Coluna numero removida';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'cortesias' AND column_name = 'complemento') THEN
        ALTER TABLE cortesias DROP COLUMN complemento;
        RAISE NOTICE 'Coluna complemento removida';
    END IF;
    
END $$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_cortesias_confirmada ON cortesias(confirmada);
CREATE INDEX IF NOT EXISTS idx_cortesias_cidade ON cortesias(cidade);

-- Verificar estrutura final da tabela
SELECT 'Estrutura final da tabela cortesias:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'cortesias' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se a tabela tem dados
SELECT 'Dados na tabela cortesias:' as info;
SELECT COUNT(*) as total_registros FROM cortesias;

-- =====================================================
-- FIM DO SCRIPT
-- ===================================================== 