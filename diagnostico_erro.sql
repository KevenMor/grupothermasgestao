-- =====================================================
-- DIAGNÓSTICO DO ERRO PGRST116
-- Execute este script para identificar a causa do erro
-- =====================================================

-- Verificar se as tabelas existem
SELECT 
    'Tabelas existentes:' as info,
    table_name,
    CASE 
        WHEN table_name IN ('usuarios', 'vendas', 'configuracoes_integracao', 'dependentes') THEN '✅ Existe'
        ELSE '❌ Não encontrada'
    END as status
FROM information_schema.tables 
WHERE table_name IN ('usuarios', 'vendas', 'configuracoes_integracao', 'dependentes')
AND table_schema = 'public';

-- Verificar se há usuários cadastrados
SELECT 
    'Usuários cadastrados:' as info,
    COUNT(*) as total_usuarios
FROM usuarios;

-- Mostrar usuários existentes (se houver)
SELECT 
    'Dados dos usuários:' as info,
    id,
    nome,
    email,
    cargo,
    ativo
FROM usuarios
LIMIT 5;

-- Verificar configurações de integração
SELECT 
    'Configurações de integração:' as info,
    COUNT(*) as total_configs
FROM configuracoes_integracao;

-- Mostrar configurações existentes (se houver)
SELECT 
    'Dados das configurações:' as info,
    id,
    nome_sistema,
    chave_api,
    ativo
FROM configuracoes_integracao
LIMIT 5;

-- Verificar vendas
SELECT 
    'Vendas cadastradas:' as info,
    COUNT(*) as total_vendas
FROM vendas;

-- Verificar dependentes
SELECT 
    'Dependentes cadastrados:' as info,
    COUNT(*) as total_dependentes
FROM dependentes;

-- =====================================================
-- SOLUÇÕES RECOMENDADAS
-- =====================================================

-- Se não há usuários, criar um usuário padrão:
-- INSERT INTO usuarios (nome, email, senha, cargo, ativo) 
-- VALUES ('Administrador', 'admin@thermas.com', 'admin123', 'admin', true);

-- Se não há configurações de integração, criar uma:
-- INSERT INTO configuracoes_integracao (nome_sistema, chave_api, ativo) 
-- VALUES ('asaas', 'sua_chave_aqui', true);

-- =====================================================
-- FIM DO DIAGNÓSTICO
-- ===================================================== 