-- =====================================================
-- VERIFICAÇÃO E CORREÇÃO DO SUPABASE
-- Execute este script para verificar e criar tabelas faltantes
-- =====================================================

-- Verificar se a tabela usuarios existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'usuarios') THEN
        CREATE TABLE usuarios (
            id BIGSERIAL PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            senha VARCHAR(255) NOT NULL,
            cargo VARCHAR(100) NOT NULL DEFAULT 'usuario',
            ativo BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Tabela usuarios criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela usuarios já existe';
    END IF;
END $$;

-- Verificar se a tabela vendas existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'vendas') THEN
        CREATE TABLE vendas (
            id BIGSERIAL PRIMARY KEY,
            cliente_nome VARCHAR(255) NOT NULL,
            cliente_cpf VARCHAR(14) NOT NULL,
            cliente_data_nascimento DATE,
            cliente_estado_civil VARCHAR(50),
            cliente_profissao VARCHAR(100),
            cliente_cep VARCHAR(9),
            cliente_endereco VARCHAR(255),
            cliente_bairro VARCHAR(100),
            cliente_cidade VARCHAR(100),
            cliente_estado VARCHAR(2),
            cliente_numero VARCHAR(20),
            cliente_complemento VARCHAR(100),
            cliente_telefone VARCHAR(15),
            forma_pagamento VARCHAR(50) NOT NULL,
            quantidade_parcelas INTEGER DEFAULT 1,
            valor_total DECIMAL(10,2) NOT NULL,
            data_pagamento DATE NOT NULL,
            corretor VARCHAR(255) NOT NULL,
            status VARCHAR(50) DEFAULT 'pendente',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Tabela vendas criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela vendas já existe';
    END IF;
END $$;

-- Verificar se a tabela configuracoes existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'configuracoes') THEN
        CREATE TABLE configuracoes (
            id BIGSERIAL PRIMARY KEY,
            chave VARCHAR(100) UNIQUE NOT NULL,
            valor TEXT,
            descricao TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Tabela configuracoes criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela configuracoes já existe';
    END IF;
END $$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_cargo ON usuarios(cargo);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente_nome ON vendas(cliente_nome);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente_cpf ON vendas(cliente_cpf);
CREATE INDEX IF NOT EXISTS idx_vendas_corretor ON vendas(corretor);
CREATE INDEX IF NOT EXISTS idx_vendas_status ON vendas(status);
CREATE INDEX IF NOT EXISTS idx_vendas_data_pagamento ON vendas(data_pagamento);
CREATE INDEX IF NOT EXISTS idx_vendas_created_at ON vendas(created_at);

-- Inserir dados iniciais se não existirem
INSERT INTO usuarios (nome, email, senha, cargo) VALUES 
('Administrador', 'admin@thermas.com', '$2a$10$rQZ8K9mN2pL1vX3yU6wQ7eR4tY5uI8oP9aB2cD3eF4gH5iJ6kL7mN8oP9qR', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO configuracoes (chave, valor, descricao) VALUES 
('empresa_nome', 'Grupo Thermas', 'Nome da empresa'),
('empresa_cnpj', '00.000.000/0000-00', 'CNPJ da empresa'),
('empresa_endereco', 'Endereço da empresa', 'Endereço completo da empresa'),
('empresa_telefone', '(11) 99999-9999', 'Telefone da empresa'),
('empresa_email', 'contato@thermas.com', 'Email de contato'),
('timezone', 'America/Sao_Paulo', 'Fuso horário padrão'),
('moeda', 'BRL', 'Moeda padrão do sistema')
ON CONFLICT (chave) DO NOTHING;

-- Criar função de update se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers se não existirem
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendas_updated_at ON vendas;
CREATE TRIGGER update_vendas_updated_at BEFORE UPDATE ON vendas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_configuracoes_updated_at ON configuracoes;
CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON configuracoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Desabilitar RLS para facilitar o desenvolvimento
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendas DISABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes DISABLE ROW LEVEL SECURITY;

-- Verificar se tudo foi criado corretamente
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('usuarios', 'vendas', 'configuracoes') THEN '✅ Criada'
        ELSE '❌ Não encontrada'
    END as status
FROM information_schema.tables 
WHERE table_name IN ('usuarios', 'vendas', 'configuracoes')
AND table_schema = 'public';

-- =====================================================
-- FIM DA VERIFICAÇÃO
-- ===================================================== 