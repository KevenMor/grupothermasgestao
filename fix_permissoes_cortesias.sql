-- =====================================================
-- FIX PERMISSÕES DE CORTESIAS - GRUPO THERMAS
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. Primeiro, executar o setup de cortesias se ainda não foi feito
-- (Execute o script supabase_cortesias_setup.sql primeiro)

-- 2. Adicionar permissões de cortesias para todos os usuários existentes
INSERT INTO permissoes_usuarios (usuario_id, funcionalidade_id, pode_visualizar, pode_criar, pode_editar, pode_excluir, pode_exportar)
SELECT 
    u.id as usuario_id,
    f.id as funcionalidade_id,
    CASE 
        WHEN u.email = 'admin@thermas.com' THEN true
        WHEN f.nome = 'cortesias' THEN true
        WHEN f.nome = 'cortesias_visualizar' THEN true
        ELSE false
    END as pode_visualizar,
    CASE 
        WHEN u.email = 'admin@thermas.com' THEN true
        WHEN f.nome = 'cortesias_criar' THEN true
        ELSE false
    END as pode_criar,
    CASE 
        WHEN u.email = 'admin@thermas.com' THEN true
        WHEN f.nome = 'cortesias_editar' THEN true
        ELSE false
    END as pode_editar,
    CASE 
        WHEN u.email = 'admin@thermas.com' THEN true
        WHEN f.nome = 'cortesias_excluir' THEN true
        ELSE false
    END as pode_excluir,
    CASE 
        WHEN u.email = 'admin@thermas.com' THEN true
        WHEN f.nome = 'cortesias_exportar' THEN true
        ELSE false
    END as pode_exportar
FROM usuarios u
CROSS JOIN funcionalidades f
WHERE f.nome LIKE 'cortesias%'
AND f.ativo = true
ON CONFLICT (usuario_id, funcionalidade_id) DO UPDATE SET
    pode_visualizar = EXCLUDED.pode_visualizar,
    pode_criar = EXCLUDED.pode_criar,
    pode_editar = EXCLUDED.pode_editar,
    pode_excluir = EXCLUDED.pode_excluir,
    pode_exportar = EXCLUDED.pode_exportar,
    updated_at = NOW();

-- 3. Verificar resultado
SELECT '✅ PERMISSÕES DE CORTESIAS CONFIGURADAS!' as status;

-- Verificar funcionalidades de cortesias
SELECT 
    'Funcionalidades de cortesias:' as categoria,
    nome,
    descricao,
    categoria as tipo,
    ordem
FROM funcionalidades 
WHERE nome LIKE 'cortesias%'
ORDER BY ordem;

-- Verificar permissões do admin
SELECT 
    'Permissões do admin para cortesias:' as categoria,
    f.nome as funcionalidade,
    pu.pode_visualizar,
    pu.pode_criar,
    pu.pode_editar,
    pu.pode_excluir,
    pu.pode_exportar
FROM permissoes_usuarios pu
JOIN usuarios u ON pu.usuario_id = u.id
JOIN funcionalidades f ON pu.funcionalidade_id = f.id
WHERE u.email = 'admin@thermas.com' 
AND f.nome LIKE 'cortesias%'
ORDER BY f.ordem;

-- =====================================================
-- FIM DO SCRIPT
-- ===================================================== 