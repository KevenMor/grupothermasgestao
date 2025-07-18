-- =====================================================
-- ADICIONAR TABELA DE DEPENDENTES (VERSÃO ROBUSTA)
-- Execute este script para criar a tabela de dependentes
-- =====================================================

-- Verificar se a tabela já existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'dependentes' AND table_schema = 'public') THEN
        -- Criar tabela de dependentes
        CREATE TABLE dependentes (
            id BIGSERIAL PRIMARY KEY,
            venda_id BIGINT NOT NULL,
            nome VARCHAR(255) NOT NULL,
            data_nascimento DATE NOT NULL,
            parentesco VARCHAR(50) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE '✅ Tabela dependentes criada com sucesso!';
    ELSE
        RAISE NOTICE 'ℹ️ Tabela dependentes já existe';
    END IF;
END $$;

-- Verificar se a tabela vendas existe antes de criar a foreign key
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'vendas' AND table_schema = 'public') THEN
        -- Adicionar foreign key se não existir
        IF NOT EXISTS (
            SELECT FROM information_schema.table_constraints 
            WHERE constraint_name = 'dependentes_venda_id_fkey' 
            AND table_name = 'dependentes'
        ) THEN
            ALTER TABLE dependentes 
            ADD CONSTRAINT dependentes_venda_id_fkey 
            FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE;
            
            RAISE NOTICE '✅ Foreign key criada com sucesso!';
        ELSE
            RAISE NOTICE 'ℹ️ Foreign key já existe';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Tabela vendas não encontrada - foreign key não criada';
    END IF;
END $$;

-- Criar índices se não existirem
DO $$
BEGIN
    -- Índice para venda_id
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_dependentes_venda_id') THEN
        CREATE INDEX idx_dependentes_venda_id ON dependentes(venda_id);
        RAISE NOTICE '✅ Índice idx_dependentes_venda_id criado';
    ELSE
        RAISE NOTICE 'ℹ️ Índice idx_dependentes_venda_id já existe';
    END IF;
    
    -- Índice para nome
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_dependentes_nome') THEN
        CREATE INDEX idx_dependentes_nome ON dependentes(nome);
        RAISE NOTICE '✅ Índice idx_dependentes_nome criado';
    ELSE
        RAISE NOTICE 'ℹ️ Índice idx_dependentes_nome já existe';
    END IF;
    
    -- Índice para parentesco
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_dependentes_parentesco') THEN
        CREATE INDEX idx_dependentes_parentesco ON dependentes(parentesco);
        RAISE NOTICE '✅ Índice idx_dependentes_parentesco criado';
    ELSE
        RAISE NOTICE 'ℹ️ Índice idx_dependentes_parentesco já existe';
    END IF;
END $$;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_dependentes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.triggers WHERE trigger_name = 'update_dependentes_updated_at') THEN
        CREATE TRIGGER update_dependentes_updated_at 
            BEFORE UPDATE ON dependentes 
            FOR EACH ROW 
            EXECUTE FUNCTION update_dependentes_updated_at();
        RAISE NOTICE '✅ Trigger update_dependentes_updated_at criado';
    ELSE
        RAISE NOTICE 'ℹ️ Trigger update_dependentes_updated_at já existe';
    END IF;
END $$;

-- Desabilitar RLS para facilitar o desenvolvimento
ALTER TABLE dependentes DISABLE ROW LEVEL SECURITY;

-- Comentários para documentação
COMMENT ON TABLE dependentes IS 'Tabela de dependentes dos sócios/vendas';
COMMENT ON COLUMN dependentes.venda_id IS 'ID da venda/sócio ao qual o dependente pertence';
COMMENT ON COLUMN dependentes.nome IS 'Nome completo do dependente';
COMMENT ON COLUMN dependentes.data_nascimento IS 'Data de nascimento do dependente';
COMMENT ON COLUMN dependentes.parentesco IS 'Tipo de parentesco (Cônjuge, Filho(a), Pai, Mãe, Irmão(a), Outro)';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Mostrar status final
SELECT 
    'TABELA DEPENDENTES' as item,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'dependentes') 
        THEN '✅ CRIADA COM SUCESSO'
        ELSE '❌ NÃO CRIADA'
    END as status
UNION ALL
SELECT 
    'FOREIGN KEY' as item,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'dependentes_venda_id_fkey')
        THEN '✅ CRIADA COM SUCESSO'
        ELSE '❌ NÃO CRIADA'
    END as status
UNION ALL
SELECT 
    'ÍNDICES' as item,
    CASE 
        WHEN EXISTS (SELECT FROM pg_indexes WHERE tablename = 'dependentes' AND indexname LIKE 'idx_dependentes_%')
        THEN '✅ CRIADOS COM SUCESSO'
        ELSE '❌ NÃO CRIADOS'
    END as status
UNION ALL
SELECT 
    'TRIGGER' as item,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.triggers WHERE trigger_name = 'update_dependentes_updated_at')
        THEN '✅ CRIADO COM SUCESSO'
        ELSE '❌ NÃO CRIADO'
    END as status;

-- Mostrar estrutura final da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'dependentes' 
AND table_schema = 'public'
ORDER BY ordinal_position; 