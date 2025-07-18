-- =====================================================
-- ADICIONAR TABELA DE DEPENDENTES
-- Execute este script para criar a tabela de dependentes
-- =====================================================

-- Criar tabela de dependentes
CREATE TABLE IF NOT EXISTS dependentes (
    id BIGSERIAL PRIMARY KEY,
    venda_id BIGINT NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    data_nascimento DATE NOT NULL,
    parentesco VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_dependentes_venda_id ON dependentes(venda_id);
CREATE INDEX IF NOT EXISTS idx_dependentes_nome ON dependentes(nome);
CREATE INDEX IF NOT EXISTS idx_dependentes_parentesco ON dependentes(parentesco);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_dependentes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_dependentes_updated_at ON dependentes;
CREATE TRIGGER update_dependentes_updated_at 
    BEFORE UPDATE ON dependentes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_dependentes_updated_at();

-- Desabilitar RLS para facilitar o desenvolvimento
ALTER TABLE dependentes DISABLE ROW LEVEL SECURITY;

-- Comentários para documentação
COMMENT ON TABLE dependentes IS 'Tabela de dependentes dos sócios/vendas';
COMMENT ON COLUMN dependentes.venda_id IS 'ID da venda/sócio ao qual o dependente pertence';
COMMENT ON COLUMN dependentes.nome IS 'Nome completo do dependente';
COMMENT ON COLUMN dependentes.data_nascimento IS 'Data de nascimento do dependente';
COMMENT ON COLUMN dependentes.parentesco IS 'Tipo de parentesco (Cônjuge, Filho(a), Pai, Mãe, Irmão(a), Outro)';

-- =====================================================
-- VERIFICAR SE A TABELA FOI CRIADA
-- =====================================================
SELECT 
    table_name,
    '✅ Criada com sucesso' as status
FROM information_schema.tables 
WHERE table_name = 'dependentes'
AND table_schema = 'public';

-- Mostrar estrutura da tabela dependentes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'dependentes' 
AND table_schema = 'public'
ORDER BY ordinal_position; 