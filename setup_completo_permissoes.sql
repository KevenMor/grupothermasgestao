-- =====================================================
-- SETUP COMPLETO DO SISTEMA DE PERMISSÕES - GRUPO THERMAS
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA DE FUNCIONALIDADES DO SISTEMA
-- =====================================================
CREATE TABLE IF NOT EXISTS funcionalidades (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(100) UNIQUE NOT NULL,
    descricao TEXT,
    categoria VARCHAR(50) NOT NULL, -- 'menu', 'acao', 'relatorio'
    rota VARCHAR(100), -- rota da página ou API
    icone VARCHAR(50), -- nome do ícone
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA DE PERMISSÕES DE USUÁRIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS permissoes_usuarios (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT REFERENCES usuarios(id) ON DELETE CASCADE,
    funcionalidade_id BIGINT REFERENCES funcionalidades(id) ON DELETE CASCADE,
    pode_visualizar BOOLEAN DEFAULT false,
    pode_criar BOOLEAN DEFAULT false,
    pode_editar BOOLEAN DEFAULT false,
    pode_excluir BOOLEAN DEFAULT false,
    pode_exportar BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id, funcionalidade_id)
);

-- =====================================================
-- TABELA DE CONFIGURAÇÕES DE INTEGRAÇÃO (se não existir)
-- =====================================================
CREATE TABLE IF NOT EXISTS configuracoes_integracao (
    id BIGSERIAL PRIMARY KEY,
    nome_sistema VARCHAR(100) UNIQUE NOT NULL,
    chave_api TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INSERIR FUNCIONALIDADES PADRÃO DO SISTEMA
-- =====================================================

-- Menus principais
INSERT INTO funcionalidades (nome, descricao, categoria, rota, icone, ordem) VALUES
-- Dashboard
('dashboard', 'Visualizar Dashboard', 'menu', '/dashboard', 'Dashboard', 1),
('dashboard_metricas', 'Ver métricas do dashboard', 'acao', '/dashboard', 'Analytics', 2),

-- Vendas
('vendas', 'Menu de Vendas/Sócios', 'menu', '/vendas', 'ShoppingCart', 10),
('vendas_visualizar', 'Visualizar lista de vendas', 'acao', '/vendas', 'Visibility', 11),
('vendas_criar', 'Criar nova venda', 'acao', '/vendas', 'Add', 12),
('vendas_editar', 'Editar vendas existentes', 'acao', '/vendas', 'Edit', 13),
('vendas_excluir', 'Excluir vendas', 'acao', '/vendas', 'Delete', 14),
('vendas_exportar', 'Exportar dados de vendas', 'acao', '/vendas', 'Download', 15),
('vendas_detalhes', 'Ver detalhes de vendas', 'acao', '/vendas', 'Info', 16),

-- Usuários
('usuarios', 'Menu de Usuários', 'menu', '/usuarios', 'People', 20),
('usuarios_visualizar', 'Visualizar lista de usuários', 'acao', '/usuarios', 'Visibility', 21),
('usuarios_criar', 'Criar novo usuário', 'acao', '/usuarios', 'Add', 22),
('usuarios_editar', 'Editar usuários', 'acao', '/usuarios', 'Edit', 23),
('usuarios_excluir', 'Excluir usuários', 'acao', '/usuarios', 'Delete', 24),
('usuarios_permissoes', 'Gerenciar permissões de usuários', 'acao', '/usuarios', 'Security', 25),

-- Configurações
('configuracoes', 'Menu de Configurações', 'menu', '/configuracoes', 'Settings', 30),
('configuracoes_visualizar', 'Visualizar configurações', 'acao', '/configuracoes', 'Visibility', 31),
('configuracoes_editar', 'Editar configurações', 'acao', '/configuracoes', 'Edit', 32),
('configuracoes_integracao', 'Configurar integrações (Asaas)', 'acao', '/configuracoes', 'Integration', 33),

-- Cobranças
('cobrancas', 'Menu de Cobranças', 'menu', '/cobrancas', 'Payment', 40),
('cobrancas_visualizar', 'Visualizar cobranças', 'acao', '/cobrancas', 'Visibility', 41),
('cobrancas_criar', 'Criar cobranças', 'acao', '/cobrancas', 'Add', 42),
('cobrancas_editar', 'Editar cobranças', 'acao', '/cobrancas', 'Edit', 43),
('cobrancas_excluir', 'Excluir cobranças', 'acao', '/cobrancas', 'Delete', 44),
('cobrancas_exportar', 'Exportar cobranças', 'acao', '/cobrancas', 'Download', 45),

-- Logs
('logs', 'Menu de Logs', 'menu', '/logs', 'History', 50),
('logs_visualizar', 'Visualizar logs do sistema', 'acao', '/logs', 'Visibility', 51),
('logs_exportar', 'Exportar logs', 'acao', '/logs', 'Download', 52),

-- Relatórios
('relatorios', 'Menu de Relatórios', 'menu', '/relatorios', 'Assessment', 60),
('relatorios_vendas', 'Relatório de vendas', 'relatorio', '/relatorios/vendas', 'BarChart', 61),
('relatorios_financeiro', 'Relatório financeiro', 'relatorio', '/relatorios/financeiro', 'TrendingUp', 62),
('relatorios_usuarios', 'Relatório de usuários', 'relatorio', '/relatorios/usuarios', 'People', 63),

-- Sistema
('sistema_backup', 'Backup do sistema', 'acao', '/sistema/backup', 'Backup', 70),
('sistema_restore', 'Restaurar sistema', 'acao', '/sistema/restore', 'Restore', 71),
('sistema_logs', 'Logs do sistema', 'acao', '/sistema/logs', 'BugReport', 72)

ON CONFLICT (nome) DO NOTHING;

-- =====================================================
-- CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_funcionalidades_categoria ON funcionalidades(categoria);
CREATE INDEX IF NOT EXISTS idx_funcionalidades_ordem ON funcionalidades(ordem);
CREATE INDEX IF NOT EXISTS idx_funcionalidades_ativo ON funcionalidades(ativo);
CREATE INDEX IF NOT EXISTS idx_permissoes_usuario_id ON permissoes_usuarios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_permissoes_funcionalidade_id ON permissoes_usuarios(funcionalidade_id);
CREATE INDEX IF NOT EXISTS idx_config_integracao_sistema ON configuracoes_integracao(nome_sistema);
CREATE INDEX IF NOT EXISTS idx_config_integracao_ativo ON configuracoes_integracao(ativo);

-- =====================================================
-- INSERIR DADOS PADRÃO
-- =====================================================

-- Inserir usuário administrador padrão (se não existir)
INSERT INTO usuarios (nome, email, senha, cargo, ativo)
SELECT 'Administrador', 'admin@thermas.com', 'admin123', 'admin', true
WHERE NOT EXISTS (
    SELECT 1 FROM usuarios WHERE email = 'admin@thermas.com'
);

-- Inserir configuração padrão do Asaas (se não existir)
INSERT INTO configuracoes_integracao (nome_sistema, chave_api, ativo)
SELECT 'asaas', 'sua_chave_api_aqui', true
WHERE NOT EXISTS (
    SELECT 1 FROM configuracoes_integracao WHERE nome_sistema = 'asaas'
);

-- =====================================================
-- FUNÇÃO PARA CRIAR PERMISSÕES PADRÃO PARA NOVO USUÁRIO
-- =====================================================
CREATE OR REPLACE FUNCTION criar_permissoes_padrao_usuario(novo_usuario_id BIGINT)
RETURNS VOID AS $$
BEGIN
    -- Inserir permissões padrão para todas as funcionalidades
    INSERT INTO permissoes_usuarios (usuario_id, funcionalidade_id, pode_visualizar, pode_criar, pode_editar, pode_excluir, pode_exportar)
    SELECT 
        novo_usuario_id,
        f.id,
        CASE 
            WHEN f.categoria = 'menu' THEN true
            WHEN f.nome IN ('dashboard_metricas', 'vendas_visualizar') THEN true
            ELSE false
        END as pode_visualizar,
        CASE 
            WHEN f.nome IN ('vendas_criar') THEN true
            ELSE false
        END as pode_criar,
        CASE 
            WHEN f.nome IN ('vendas_editar') THEN true
            ELSE false
        END as pode_editar,
        false as pode_excluir,
        false as pode_exportar
    FROM funcionalidades f
    WHERE f.ativo = true
    ON CONFLICT (usuario_id, funcionalidade_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER PARA CRIAR PERMISSÕES AUTOMATICAMENTE
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_criar_permissoes_usuario()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM criar_permissoes_padrao_usuario(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger se existir e criar novamente
DROP TRIGGER IF EXISTS trigger_novo_usuario ON usuarios;
CREATE TRIGGER trigger_novo_usuario
    AFTER INSERT ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION trigger_criar_permissoes_usuario();

-- =====================================================
-- CRIAR PERMISSÕES PARA USUÁRIOS EXISTENTES
-- =====================================================

-- Criar permissões para o usuário admin (se existir)
DO $$
DECLARE
    admin_id BIGINT;
BEGIN
    SELECT id INTO admin_id FROM usuarios WHERE email = 'admin@thermas.com' LIMIT 1;
    
    IF admin_id IS NOT NULL THEN
        -- Dar todas as permissões para o admin
        INSERT INTO permissoes_usuarios (usuario_id, funcionalidade_id, pode_visualizar, pode_criar, pode_editar, pode_excluir, pode_exportar)
        SELECT 
            admin_id,
            f.id,
            true as pode_visualizar,
            true as pode_criar,
            true as pode_editar,
            true as pode_excluir,
            true as pode_exportar
        FROM funcionalidades f
        WHERE f.ativo = true
        ON CONFLICT (usuario_id, funcionalidade_id) DO UPDATE SET
            pode_visualizar = EXCLUDED.pode_visualizar,
            pode_criar = EXCLUDED.pode_criar,
            pode_editar = EXCLUDED.pode_editar,
            pode_excluir = EXCLUDED.pode_excluir,
            pode_exportar = EXCLUDED.pode_exportar,
            updated_at = NOW();
    END IF;
END $$;

-- =====================================================
-- VERIFICAR RESULTADO
-- =====================================================
SELECT '✅ SETUP COMPLETO CONCLUÍDO!' as status;

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