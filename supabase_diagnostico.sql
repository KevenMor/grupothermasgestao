-- =====================================================
-- DIAGNÓSTICO DAS TABELAS DO SUPABASE
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

-- Mostrar estrutura da tabela usuarios
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

-- Mostrar estrutura da tabela vendas
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

-- Mostrar estrutura da tabela configuracoes
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

-- Verificar se há dados nas tabelas
SELECT 
    'usuarios' as tabela,
    COUNT(*) as total_registros
FROM usuarios
UNION ALL
SELECT 
    'vendas' as tabela,
    COUNT(*) as total_registros
FROM vendas
UNION ALL
SELECT 
    'configuracoes' as tabela,
    COUNT(*) as total_registros
FROM configuracoes;

-- =====================================================
-- FIM DO DIAGNÓSTICO
-- ===================================================== 