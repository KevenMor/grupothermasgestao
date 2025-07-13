-- =====================================================
-- CORREÇÃO DA TABELA VENDAS
-- Execute este script para adicionar todas as colunas necessárias
-- =====================================================

-- Verificar se a tabela vendas existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'vendas') THEN
        -- Criar tabela completa se não existir
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
        RAISE NOTICE 'Tabela vendas já existe - verificando estrutura...';
        
        -- Verificar e adicionar cada coluna se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vendas' AND column_name = 'cliente_nome') THEN
            ALTER TABLE vendas ADD COLUMN cliente_nome VARCHAR(255) NOT NULL DEFAULT 'Cliente';
            RAISE NOTICE 'Coluna cliente_nome adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vendas' AND column_name = 'cliente_cpf') THEN
            ALTER TABLE vendas ADD COLUMN cliente_cpf VARCHAR(14) NOT NULL DEFAULT '000.000.000-00';
            RAISE NOTICE 'Coluna cliente_cpf adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vendas' AND column_name = 'cliente_data_nascimento') THEN
            ALTER TABLE vendas ADD COLUMN cliente_data_nascimento DATE;
            RAISE NOTICE 'Coluna cliente_data_nascimento adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vendas' AND column_name = 'cliente_estado_civil') THEN
            ALTER TABLE vendas ADD COLUMN cliente_estado_civil VARCHAR(50);
            RAISE NOTICE 'Coluna cliente_estado_civil adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vendas' AND column_name = 'cliente_profissao') THEN
            ALTER TABLE vendas ADD COLUMN cliente_profissao VARCHAR(100);
            RAISE NOTICE 'Coluna cliente_profissao adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vendas' AND column_name = 'cliente_cep') THEN
            ALTER TABLE vendas ADD COLUMN cliente_cep VARCHAR(9);
            RAISE NOTICE 'Coluna cliente_cep adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vendas' AND column_name = 'cliente_endereco') THEN
            ALTER TABLE vendas ADD COLUMN cliente_endereco VARCHAR(255);
            RAISE NOTICE 'Coluna cliente_endereco adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vendas' AND column_name = 'cliente_bairro') THEN
            ALTER TABLE vendas ADD COLUMN cliente_bairro VARCHAR(100);
            RAISE NOTICE 'Coluna cliente_bairro adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vendas' AND column_name = 'cliente_cidade') THEN
            ALTER TABLE vendas ADD COLUMN cliente_cidade VARCHAR(100);
            RAISE NOTICE 'Coluna cliente_cidade adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vendas' AND column_name = 'cliente_estado') THEN
            ALTER TABLE vendas ADD COLUMN cliente_estado VARCHAR(2);
            RAISE NOTICE 'Coluna cliente_estado adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vendas' AND column_name = 'cliente_numero') THEN
            ALTER TABLE vendas ADD COLUMN cliente_numero VARCHAR(20);
            RAISE NOTICE 'Coluna cliente_numero adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vendas' AND column_name = 'cliente_complemento') THEN
            ALTER TABLE vendas ADD COLUMN cliente_complemento VARCHAR(100);
            RAISE NOTICE 'Coluna cliente_complemento adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vendas' AND column_name = 'cliente_telefone') THEN
            ALTER TABLE vendas ADD COLUMN cliente_telefone VARCHAR(15);
            RAISE NOTICE 'Coluna cliente_telefone adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vendas' AND column_name = 'forma_pagamento') THEN
            ALTER TABLE vendas ADD COLUMN forma_pagamento VARCHAR(50) NOT NULL DEFAULT 'PIX';
            RAISE NOTICE 'Coluna forma_pagamento adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vendas' AND column_name = 'quantidade_parcelas') THEN
            ALTER TABLE vendas ADD COLUMN quantidade_parcelas INTEGER DEFAULT 1;
            RAISE NOTICE 'Coluna quantidade_parcelas adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vendas' AND column_name = 'valor_total') THEN
            ALTER TABLE vendas ADD COLUMN valor_total DECIMAL(10,2) NOT NULL DEFAULT 0;
            RAISE NOTICE 'Coluna valor_total adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vendas' AND column_name = 'data_pagamento') THEN
            ALTER TABLE vendas ADD COLUMN data_pagamento DATE NOT NULL DEFAULT CURRENT_DATE;
            RAISE NOTICE 'Coluna data_pagamento adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vendas' AND column_name = 'corretor') THEN
            ALTER TABLE vendas ADD COLUMN corretor VARCHAR(255) NOT NULL DEFAULT 'Corretor';
            RAISE NOTICE 'Coluna corretor adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vendas' AND column_name = 'status') THEN
            ALTER TABLE vendas ADD COLUMN status VARCHAR(50) DEFAULT 'pendente';
            RAISE NOTICE 'Coluna status adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vendas' AND column_name = 'created_at') THEN
            ALTER TABLE vendas ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Coluna created_at adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vendas' AND column_name = 'updated_at') THEN
            ALTER TABLE vendas ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Coluna updated_at adicionada';
        END IF;
    END IF;
END $$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_vendas_cliente_nome ON vendas(cliente_nome);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente_cpf ON vendas(cliente_cpf);
CREATE INDEX IF NOT EXISTS idx_vendas_corretor ON vendas(corretor);
CREATE INDEX IF NOT EXISTS idx_vendas_status ON vendas(status);
CREATE INDEX IF NOT EXISTS idx_vendas_data_pagamento ON vendas(data_pagamento);
CREATE INDEX IF NOT EXISTS idx_vendas_created_at ON vendas(created_at);

-- Criar trigger para updated_at se não existir
DROP TRIGGER IF EXISTS update_vendas_updated_at ON vendas;
CREATE TRIGGER update_vendas_updated_at BEFORE UPDATE ON vendas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Desabilitar RLS para facilitar o desenvolvimento
ALTER TABLE vendas DISABLE ROW LEVEL SECURITY;

-- Mostrar estrutura final da tabela vendas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'vendas' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- FIM DA CORREÇÃO
-- ===================================================== 
ALTER TABLE vendas
  ADD COLUMN contrato_url TEXT,
  ADD COLUMN assinatura_status VARCHAR(50),
  ADD COLUMN assinatura_id VARCHAR(100),
  ADD COLUMN pagamentos JSONB,
  ADD COLUMN historico_envio JSONB; 