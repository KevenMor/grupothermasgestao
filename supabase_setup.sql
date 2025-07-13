-- Criar tabela de usuários no Supabase
CREATE TABLE usuarios (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  perfil VARCHAR(50) NOT NULL DEFAULT 'vendedor',
  funcoes TEXT[] DEFAULT '{}',
  senha VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca por email
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- Criar índice para busca por perfil
CREATE INDEX idx_usuarios_perfil ON usuarios(perfil);

-- Habilitar Row Level Security (RLS)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura de todos os usuários (ajuste conforme necessário)
CREATE POLICY "Permitir leitura de usuários" ON usuarios
  FOR SELECT USING (true);

-- Política para permitir inserção de usuários
CREATE POLICY "Permitir inserção de usuários" ON usuarios
  FOR INSERT WITH CHECK (true);

-- Política para permitir atualização de usuários
CREATE POLICY "Permitir atualização de usuários" ON usuarios
  FOR UPDATE USING (true);

-- Política para permitir exclusão de usuários
CREATE POLICY "Permitir exclusão de usuários" ON usuarios
  FOR DELETE USING (true);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_usuarios_updated_at 
  BEFORE UPDATE ON usuarios 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 