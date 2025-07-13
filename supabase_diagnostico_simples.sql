-- =====================================================
-- DIAGNÓSTICO SIMPLES DAS TABELAS DO SUPABASE
-- Execute este script para verificar a estrutura atual
-- =====================================================

-- Verificar se as tabelas existem
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('usuarios', 'vendas', 'configuracoes') THEN '✅ Existe'
        ELSE '❌ Não encontrada'
    END as status
FROM information_schema.tables 
WHERE table_name IN ('usuarios', 'vendas', 'configuracoes')
AND table_schema = 'public';

-- Mostrar estrutura da tabela usuarios (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'usuarios' AND table_schema = 'public') THEN
        RAISE NOTICE '=== ESTRUTURA DA TABELA USUARIOS ===';
    ELSE
        RAISE NOTICE '❌ Tabela usuarios não existe';
    END IF;
END $$;

SELECT 
    'usuarios' as tabela,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Mostrar estrutura da tabela vendas (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'vendas' AND table_schema = 'public') THEN
        RAISE NOTICE '=== ESTRUTURA DA TABELA VENDAS ===';
    ELSE
        RAISE NOTICE '❌ Tabela vendas não existe';
    END IF;
END $$;

SELECT 
    'vendas' as tabela,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'vendas' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Mostrar estrutura da tabela configuracoes (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'configuracoes' AND table_schema = 'public') THEN
        RAISE NOTICE '=== ESTRUTURA DA TABELA CONFIGURAÇÕES ===';
    ELSE
        RAISE NOTICE '❌ Tabela configuracoes não existe';
    END IF;
END $$;

SELECT 
    'configuracoes' as tabela,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'configuracoes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se há dados nas tabelas (apenas se existirem)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'usuarios' AND table_schema = 'public') THEN
        RAISE NOTICE '=== DADOS DA TABELA USUARIOS ===';
        PERFORM COUNT(*) FROM usuarios;
        RAISE NOTICE 'Total de registros em usuarios: %', (SELECT COUNT(*) FROM usuarios);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'vendas' AND table_schema = 'public') THEN
        RAISE NOTICE '=== DADOS DA TABELA VENDAS ===';
        PERFORM COUNT(*) FROM vendas;
        RAISE NOTICE 'Total de registros em vendas: %', (SELECT COUNT(*) FROM vendas);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'configuracoes' AND table_schema = 'public') THEN
        RAISE NOTICE '=== DADOS DA TABELA CONFIGURAÇÕES ===';
        PERFORM COUNT(*) FROM configuracoes;
        RAISE NOTICE 'Total de registros em configuracoes: %', (SELECT COUNT(*) FROM configuracoes);
    END IF;
END $$;

-- =====================================================
-- FIM DO DIAGNÓSTICO
-- ===================================================== 