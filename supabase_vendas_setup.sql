-- Criar tabela de vendas no Supabase com campos completos do contrato
CREATE TABLE vendas (
  id BIGSERIAL PRIMARY KEY,
  cliente_nome VARCHAR(255) NOT NULL,
  cliente_cpf VARCHAR(14) NOT NULL,
  cliente_data_nascimento VARCHAR(10),
  cliente_estado_civil VARCHAR(50),
  cliente_profissao VARCHAR(255),
  cliente_cep VARCHAR(9),
  cliente_endereco VARCHAR(255),
  cliente_bairro VARCHAR(100),
  cliente_cidade VARCHAR(100),
  cliente_estado VARCHAR(2),
  cliente_numero VARCHAR(20),
  cliente_complemento VARCHAR(255),
  cliente_telefone VARCHAR(15) NOT NULL,
  forma_pagamento VARCHAR(50) NOT NULL,
  quantidade_parcelas INTEGER DEFAULT 1,
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  data_pagamento DATE NOT NULL DEFAULT CURRENT_DATE,
  corretor VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX idx_vendas_cliente_cpf ON vendas(cliente_cpf);
CREATE INDEX idx_vendas_cliente_nome ON vendas(cliente_nome);
CREATE INDEX idx_vendas_status ON vendas(status);
CREATE INDEX idx_vendas_data_pagamento ON vendas(data_pagamento);
CREATE INDEX idx_vendas_corretor ON vendas(corretor);
CREATE INDEX idx_vendas_forma_pagamento ON vendas(forma_pagamento);

-- Habilitar Row Level Security (RLS)
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;

-- Políticas para vendas
CREATE POLICY "Permitir leitura de vendas" ON vendas
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de vendas" ON vendas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de vendas" ON vendas
  FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão de vendas" ON vendas
  FOR DELETE USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_vendas_updated_at 
  BEFORE UPDATE ON vendas 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 