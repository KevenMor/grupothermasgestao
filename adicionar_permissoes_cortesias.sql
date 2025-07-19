-- =====================================================
-- ADICIONAR PERMISSÕES DE CORTESIAS PARA USUÁRIO ADMIN
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- Verificar se as funcionalidades de cortesias existem
SELECT 'Verificando funcionalidades de cortesias...' as status;

SELECT 
    nome,
    descricao,
    categoria,
    rota
FROM funcionalidades 
WHERE nome LIKE 'cortesias%'
ORDER BY ordem;

-- Adicionar permissões de cortesias para o usuário admin
DO $$
DECLARE
    admin_id BIGINT;
    funcionalidade_id BIGINT;
BEGIN
    -- Buscar ID do usuário admin
    SELECT id INTO admin_id FROM usuarios WHERE email = 'admin@thermas.com' LIMIT 1;
    
    IF admin_id IS NULL THEN
        RAISE NOTICE 'Usuário admin não encontrado!';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Usuário admin encontrado com ID: %', admin_id;
    
    -- Adicionar permissões para cada funcionalidade de cortesias
    FOR funcionalidade_id IN 
        SELECT id FROM funcionalidades WHERE nome LIKE 'cortesias%'
    LOOP
        -- Inserir ou atualizar permissão
        INSERT INTO permissoes_usuarios (
            usuario_id, 
            funcionalidade_id, 
            pode_visualizar, 
            pode_criar, 
            pode_editar, 
            pode_excluir, 
            pode_exportar
        ) VALUES (
            admin_id,
            funcionalidade_id,
            true,  -- pode_visualizar
            true,  -- pode_criar
            true,  -- pode_editar
            true,  -- pode_excluir
            true   -- pode_exportar
        )
        ON CONFLICT (usuario_id, funcionalidade_id) 
        DO UPDATE SET
            pode_visualizar = EXCLUDED.pode_visualizar,
            pode_criar = EXCLUDED.pode_criar,
            pode_editar = EXCLUDED.pode_editar,
            pode_excluir = EXCLUDED.pode_excluir,
            pode_exportar = EXCLUDED.pode_exportar,
            updated_at = NOW();
            
        RAISE NOTICE 'Permissão adicionada para funcionalidade ID: %', funcionalidade_id;
    END LOOP;
    
    RAISE NOTICE 'Todas as permissões de cortesias foram adicionadas para o usuário admin!';
END $$;

-- Verificar permissões adicionadas
SELECT 
    'Permissões de cortesias do admin:' as categoria,
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