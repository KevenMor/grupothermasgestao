-- =====================================================
-- ATUALIZAÇÃO DA TABELA USUÁRIOS - SISTEMA DE PERMISSÕES
-- Execute este script para adicionar os novos campos necessários
-- =====================================================

-- Adicionar novos campos à tabela usuarios
DO $$
BEGIN
    -- Adicionar campo telefone se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'telefone') THEN
        ALTER TABLE usuarios ADD COLUMN telefone VARCHAR(20);
        RAISE NOTICE 'Campo telefone adicionado com sucesso';
    ELSE
        RAISE NOTICE 'Campo telefone já existe';
    END IF;

    -- Adicionar campo departamento se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'departamento') THEN
        ALTER TABLE usuarios ADD COLUMN departamento VARCHAR(50) DEFAULT 'comercial';
        RAISE NOTICE 'Campo departamento adicionado com sucesso';
    ELSE
        RAISE NOTICE 'Campo departamento já existe';
    END IF;

    -- Adicionar campo funcoes (array de permissões) se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'funcoes') THEN
        ALTER TABLE usuarios ADD COLUMN funcoes TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Campo funcoes adicionado com sucesso';
    ELSE
        RAISE NOTICE 'Campo funcoes já existe';
    END IF;

    -- Atualizar campo cargo para incluir os novos departamentos
    -- Primeiro, vamos criar uma função para atualizar os cargos existentes
    UPDATE usuarios 
    SET departamento = CASE 
        WHEN cargo = 'admin' THEN 'admin'
        WHEN cargo = 'gerente' THEN 'gerente'
        ELSE 'comercial'
    END
    WHERE departamento IS NULL;

    RAISE NOTICE 'Departamentos atualizados com base nos cargos existentes';

END $$;

-- Criar tabela de funções/permissões do sistema
CREATE TABLE IF NOT EXISTS funcoes_sistema (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(100) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100) NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir funções padrão do sistema
INSERT INTO funcoes_sistema (codigo, nome, descricao, categoria) VALUES 
-- Gestão de Usuários
('usuarios.visualizar', 'Visualizar Usuários', 'Permite visualizar a lista de usuários', 'Gestão de Usuários'),
('usuarios.criar', 'Criar Usuários', 'Permite criar novos usuários', 'Gestão de Usuários'),
('usuarios.editar', 'Editar Usuários', 'Permite editar usuários existentes', 'Gestão de Usuários'),
('usuarios.excluir', 'Excluir Usuários', 'Permite excluir usuários', 'Gestão de Usuários'),

-- Gestão de Vendas
('vendas.visualizar', 'Visualizar Vendas', 'Permite visualizar a lista de vendas', 'Gestão de Vendas'),
('vendas.criar', 'Criar Vendas', 'Permite criar novas vendas', 'Gestão de Vendas'),
('vendas.editar', 'Editar Vendas', 'Permite editar vendas existentes', 'Gestão de Vendas'),
('vendas.excluir', 'Excluir Vendas', 'Permite excluir vendas', 'Gestão de Vendas'),
('vendas.exportar', 'Exportar Vendas', 'Permite exportar dados de vendas', 'Gestão de Vendas'),

-- Gestão de Cobranças
('cobrancas.visualizar', 'Visualizar Cobranças', 'Permite visualizar cobranças', 'Gestão de Cobranças'),
('cobrancas.criar', 'Criar Cobranças', 'Permite criar novas cobranças', 'Gestão de Cobranças'),
('cobrancas.editar', 'Editar Cobranças', 'Permite editar cobranças', 'Gestão de Cobranças'),
('cobrancas.excluir', 'Excluir Cobranças', 'Permite excluir cobranças', 'Gestão de Cobranças'),

-- Gestão de Dependentes
('dependentes.visualizar', 'Visualizar Dependentes', 'Permite visualizar dependentes', 'Gestão de Dependentes'),
('dependentes.criar', 'Criar Dependentes', 'Permite criar novos dependentes', 'Gestão de Dependentes'),
('dependentes.editar', 'Editar Dependentes', 'Permite editar dependentes', 'Gestão de Dependentes'),
('dependentes.excluir', 'Excluir Dependentes', 'Permite excluir dependentes', 'Gestão de Dependentes'),

-- Configurações do Sistema
('configuracoes.visualizar', 'Visualizar Configurações', 'Permite visualizar configurações', 'Configurações'),
('configuracoes.editar', 'Editar Configurações', 'Permite editar configurações do sistema', 'Configurações'),

-- Logs do Sistema
('logs.visualizar', 'Visualizar Logs', 'Permite visualizar logs do sistema', 'Logs'),
('logs.exportar', 'Exportar Logs', 'Permite exportar logs do sistema', 'Logs'),

-- Dashboard e Relatórios
('dashboard.visualizar', 'Visualizar Dashboard', 'Permite acessar o dashboard', 'Dashboard'),
('relatorios.visualizar', 'Visualizar Relatórios', 'Permite visualizar relatórios', 'Relatórios'),
('relatorios.exportar', 'Exportar Relatórios', 'Permite exportar relatórios', 'Relatórios')

ON CONFLICT (codigo) DO NOTHING;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_departamento ON usuarios(departamento);
CREATE INDEX IF NOT EXISTS idx_usuarios_telefone ON usuarios(telefone);
CREATE INDEX IF NOT EXISTS idx_funcoes_sistema_categoria ON funcoes_sistema(categoria);
CREATE INDEX IF NOT EXISTS idx_funcoes_sistema_ativo ON funcoes_sistema(ativo);

-- Criar trigger para atualizar updated_at na tabela funcoes_sistema
CREATE TRIGGER update_funcoes_sistema_updated_at 
    BEFORE UPDATE ON funcoes_sistema 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Atualizar usuário admin com todas as permissões
UPDATE usuarios 
SET funcoes = ARRAY[
    'usuarios.visualizar', 'usuarios.criar', 'usuarios.editar', 'usuarios.excluir',
    'vendas.visualizar', 'vendas.criar', 'vendas.editar', 'vendas.excluir', 'vendas.exportar',
    'cobrancas.visualizar', 'cobrancas.criar', 'cobrancas.editar', 'cobrancas.excluir',
    'dependentes.visualizar', 'dependentes.criar', 'dependentes.editar', 'dependentes.excluir',
    'configuracoes.visualizar', 'configuracoes.editar',
    'logs.visualizar', 'logs.exportar',
    'dashboard.visualizar', 'relatorios.visualizar', 'relatorios.exportar'
]
WHERE email = 'admin@thermas.com';

-- Mostrar estrutura atualizada da tabela usuarios
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

-- Mostrar funções criadas
SELECT 
    codigo,
    nome,
    categoria,
    ativo
FROM funcoes_sistema
ORDER BY categoria, nome;

-- =====================================================
-- FIM DA ATUALIZAÇÃO
-- ===================================================== 