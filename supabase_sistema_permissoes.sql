-- =====================================================
-- SISTEMA DE PERMISSÕES - GRUPO THERMAS
-- Estrutura completa para controle de acesso
-- =====================================================

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

CREATE TRIGGER trigger_novo_usuario
    AFTER INSERT ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION trigger_criar_permissoes_usuario();

-- =====================================================
-- VERIFICAR RESULTADO
-- =====================================================
SELECT '✅ Sistema de permissões criado com sucesso!' as status;
SELECT 'Total de funcionalidades:' as info, COUNT(*) as total FROM funcionalidades; 