-- =====================================================
-- CORREÇÃO DO ERRO PGRST116
-- Execute este script para corrigir o erro "0 rows returned"
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CRIAR TABELA DE USUÁRIOS (se não existir)
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    cargo VARCHAR(100) NOT NULL DEFAULT 'usuario',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CRIAR TABELA DE CONFIGURAÇÕES DE INTEGRAÇÃO (se não existir)
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
-- CRIAR TABELA DE DEPENDENTES (se não existir)
-- =====================================================
CREATE TABLE IF NOT EXISTS dependentes (
    id BIGSERIAL PRIMARY KEY,
    venda_id BIGINT REFERENCES vendas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    data_nascimento DATE,
    parentesco VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INSERIR DADOS PADRÃO (se não existirem)
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
-- CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);
CREATE INDEX IF NOT EXISTS idx_config_integracao_sistema ON configuracoes_integracao(nome_sistema);
CREATE INDEX IF NOT EXISTS idx_config_integracao_ativo ON configuracoes_integracao(ativo);
CREATE INDEX IF NOT EXISTS idx_dependentes_venda_id ON dependentes(venda_id);

-- =====================================================
-- VERIFICAR RESULTADO
-- =====================================================
SELECT 'Verificação final:' as info;

SELECT 
    'Usuários:' as tabela,
    COUNT(*) as total
FROM usuarios;

SELECT 
    'Configurações de integração:' as tabela,
    COUNT(*) as total
FROM configuracoes_integracao;

SELECT 
    'Dependentes:' as tabela,
    COUNT(*) as total
FROM dependentes;

-- Mostrar dados inseridos
SELECT 
    'Usuário criado:' as info,
    nome,
    email,
    cargo
FROM usuarios
WHERE email = 'admin@thermas.com';

SELECT 
    'Configuração criada:' as info,
    nome_sistema,
    ativo
FROM configuracoes_integracao
WHERE nome_sistema = 'asaas';

-- =====================================================
-- FIM DA CORREÇÃO
-- ===================================================== 