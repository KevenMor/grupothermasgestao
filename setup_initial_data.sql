-- =====================================================
-- CONFIGURAÇÃO INICIAL DO SISTEMA
-- Execute este script para configurar dados iniciais
-- =====================================================

-- Criar tabela de usuários se não existir
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

-- Criar tabela de configurações de integração se não existir
CREATE TABLE IF NOT EXISTS configuracoes_integracao (
    id BIGSERIAL PRIMARY KEY,
    nome_sistema VARCHAR(100) UNIQUE NOT NULL,
    chave_api TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir usuário administrador padrão
INSERT INTO usuarios (nome, email, senha, cargo, ativo)
VALUES ('Administrador', 'admin@thermas.com', 'admin123', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Inserir configuração padrão do Asaas
INSERT INTO configuracoes_integracao (nome_sistema, chave_api, ativo)
VALUES ('asaas', 'sua_chave_api_aqui', true)
ON CONFLICT (nome_sistema) DO NOTHING;

-- Verificar resultado
SELECT '✅ Configuração inicial concluída!' as status;
SELECT 'Usuário padrão: admin@thermas.com / admin123' as credenciais; 