-- =====================================================
-- EXECUTAR SETUP COMPLETO DO SISTEMA DE PERMISSÕES
-- Execute este script para configurar todo o sistema
-- =====================================================

-- 1. Executar o script de permissões
\i supabase_sistema_permissoes.sql

-- 2. Executar o script de dados iniciais
\i setup_initial_data.sql

-- 3. Verificar se tudo foi criado corretamente
SELECT '=== VERIFICAÇÃO FINAL ===' as info;

-- Verificar tabelas criadas
SELECT 
    'Tabelas do sistema:' as categoria,
    table_name,
    '✅ Criada' as status
FROM information_schema.tables 
WHERE table_name IN ('usuarios', 'vendas', 'configuracoes_integracao', 'dependentes', 'funcionalidades', 'permissoes_usuarios')
AND table_schema = 'public'
ORDER BY table_name;

-- Verificar funcionalidades criadas
SELECT 
    'Funcionalidades:' as categoria,
    COUNT(*) as total
FROM funcionalidades;

-- Verificar usuário admin
SELECT 
    'Usuário Admin:' as categoria,
    nome,
    email,
    cargo
FROM usuarios
WHERE email = 'admin@thermas.com';

-- Verificar configuração do Asaas
SELECT 
    'Configuração Asaas:' as categoria,
    nome_sistema,
    ativo
FROM configuracoes_integracao
WHERE nome_sistema = 'asaas';

-- Verificar permissões do admin
SELECT 
    'Permissões do Admin:' as categoria,
    COUNT(*) as total_permissoes
FROM permissoes_usuarios pu
JOIN usuarios u ON pu.usuario_id = u.id
WHERE u.email = 'admin@thermas.com';

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================

SELECT '=== INSTRUÇÕES ===' as info;
SELECT '1. Acesse o sistema com: admin@thermas.com / admin123' as instrucao;
SELECT '2. Vá para "Gestão de Usuários"' as instrucao;
SELECT '3. Clique no ícone de segurança para gerenciar permissões' as instrucao;
SELECT '4. Configure as permissões para cada usuário' as instrucao;
SELECT '5. Os menus e funcionalidades serão filtrados automaticamente' as instrucao;

-- =====================================================
-- FIM DO SETUP
-- ===================================================== 