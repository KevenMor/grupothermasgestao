-- =====================================================
-- VERIFICAÇÃO DA TABELA DE DEPENDENTES
-- Execute este script para verificar se a tabela foi criada
-- =====================================================

-- Verificar se a tabela dependentes existe
SELECT 
    table_name,
    CASE 
        WHEN table_name = 'dependentes' THEN '✅ Tabela dependentes criada com sucesso!'
        ELSE '❌ Tabela dependentes não encontrada'
    END as status
FROM information_schema.tables 
WHERE table_name = 'dependentes'
AND table_schema = 'public';

-- Mostrar estrutura da tabela dependentes (se existir)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name = 'venda_id' THEN 'Chave estrangeira para vendas'
        WHEN column_name = 'nome' THEN 'Nome completo do dependente'
        WHEN column_name = 'data_nascimento' THEN 'Data de nascimento'
        WHEN column_name = 'parentesco' THEN 'Tipo de parentesco'
        ELSE 'Campo padrão'
    END as descricao
FROM information_schema.columns 
WHERE table_name = 'dependentes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se os índices foram criados
SELECT 
    indexname,
    tablename,
    CASE 
        WHEN indexname LIKE '%dependentes%' THEN '✅ Índice criado'
        ELSE '❌ Índice não encontrado'
    END as status
FROM pg_indexes 
WHERE tablename = 'dependentes'
AND schemaname = 'public';

-- Verificar se o trigger foi criado
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    '✅ Trigger criado' as status
FROM information_schema.triggers 
WHERE event_object_table = 'dependentes'
AND trigger_schema = 'public';

-- Verificar relacionamento com a tabela vendas
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    '✅ Relacionamento criado' as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'dependentes';

-- =====================================================
-- TESTE DE INSERÇÃO (OPCIONAL)
-- =====================================================
-- Descomente as linhas abaixo para testar a inserção de um dependente
/*
INSERT INTO dependentes (venda_id, nome, data_nascimento, parentesco) 
VALUES (1, 'João Silva', '1990-01-01', 'Filho(a)')
ON CONFLICT DO NOTHING;

SELECT '✅ Teste de inserção realizado com sucesso' as resultado;
*/ 