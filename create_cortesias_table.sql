-- =====================================================
-- CRIAR TABELA CORTESIAS - GRUPO THERMAS
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- Criar tabela de cortesias
CREATE TABLE IF NOT EXISTS cortesias (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    telefone VARCHAR(15) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    corretor VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'ativa',
    confirmada BOOLEAN DEFAULT false,
    data_confirmacao TIMESTAMP WITH TIME ZONE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_cortesias_nome ON cortesias(nome);
CREATE INDEX IF NOT EXISTS idx_cortesias_cpf ON cortesias(cpf);
CREATE INDEX IF NOT EXISTS idx_cortesias_telefone ON cortesias(telefone);
CREATE INDEX IF NOT EXISTS idx_cortesias_cidade ON cortesias(cidade);
CREATE INDEX IF NOT EXISTS idx_cortesias_status ON cortesias(status);
CREATE INDEX IF NOT EXISTS idx_cortesias_corretor ON cortesias(corretor);
CREATE INDEX IF NOT EXISTS idx_cortesias_confirmada ON cortesias(confirmada);
CREATE INDEX IF NOT EXISTS idx_cortesias_created_at ON cortesias(created_at);

-- Habilitar RLS
ALTER TABLE cortesias ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Permitir leitura de cortesias" ON cortesias FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de cortesias" ON cortesias FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de cortesias" ON cortesias FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de cortesias" ON cortesias FOR DELETE USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_cortesias_updated_at ON cortesias;
CREATE TRIGGER update_cortesias_updated_at
    BEFORE UPDATE ON cortesias
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verificar resultado
SELECT '✅ TABELA CORTESIAS CRIADA COM SUCESSO!' as status;

-- Mostrar estrutura
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'cortesias' 
AND table_schema = 'public'
ORDER BY ordinal_position; 