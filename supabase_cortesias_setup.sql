-- =====================================================
-- SETUP TABELA DE CORTESIAS - GRUPO THERMAS
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA DE CORTESIAS
-- =====================================================
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

-- =====================================================
-- TABELA DE DEPENDENTES DE CORTESIAS
-- =====================================================
CREATE TABLE IF NOT EXISTS dependentes_cortesias (
    id BIGSERIAL PRIMARY KEY,
    cortesia_id BIGINT REFERENCES cortesias(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    data_nascimento DATE,
    parentesco VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_cortesias_nome ON cortesias(nome);
CREATE INDEX IF NOT EXISTS idx_cortesias_cpf ON cortesias(cpf);
CREATE INDEX IF NOT EXISTS idx_cortesias_telefone ON cortesias(telefone);
CREATE INDEX IF NOT EXISTS idx_cortesias_cidade ON cortesias(cidade);
CREATE INDEX IF NOT EXISTS idx_cortesias_status ON cortesias(status);
CREATE INDEX IF NOT EXISTS idx_cortesias_corretor ON cortesias(corretor);
CREATE INDEX IF NOT EXISTS idx_cortesias_confirmada ON cortesias(confirmada);
CREATE INDEX IF NOT EXISTS idx_cortesias_created_at ON cortesias(created_at);
CREATE INDEX IF NOT EXISTS idx_dependentes_cortesia_id ON dependentes_cortesias(cortesia_id);

-- =====================================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE cortesias ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependentes_cortesias ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS DE SEGURANÇA
-- =====================================================

-- Políticas para cortesias
CREATE POLICY "Permitir leitura de cortesias" ON cortesias
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de cortesias" ON cortesias
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de cortesias" ON cortesias
  FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão de cortesias" ON cortesias
  FOR DELETE USING (true);

-- Políticas para dependentes de cortesias
CREATE POLICY "Permitir leitura de dependentes cortesias" ON dependentes_cortesias
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de dependentes cortesias" ON dependentes_cortesias
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de dependentes cortesias" ON dependentes_cortesias
  FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão de dependentes cortesias" ON dependentes_cortesias
  FOR DELETE USING (true);

-- =====================================================
-- TRIGGER PARA ATUALIZAR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger na tabela cortesias
DROP TRIGGER IF EXISTS update_cortesias_updated_at ON cortesias;
CREATE TRIGGER update_cortesias_updated_at
    BEFORE UPDATE ON cortesias
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ADICIONAR FUNCIONALIDADES AO SISTEMA DE PERMISSÕES
-- =====================================================

-- Inserir funcionalidades de cortesias (se não existirem)
INSERT INTO funcionalidades (nome, descricao, categoria, rota, icone, ordem) VALUES
('cortesias', 'Menu de Cortesias', 'menu', '/cortesias', 'CardGiftcard', 45),
('cortesias_visualizar', 'Visualizar lista de cortesias', 'acao', '/cortesias', 'Visibility', 46),
('cortesias_criar', 'Criar nova cortesia', 'acao', '/cortesias', 'Add', 47),
('cortesias_editar', 'Editar cortesias', 'acao', '/cortesias', 'Edit', 48),
('cortesias_excluir', 'Excluir cortesias', 'acao', '/cortesias', 'Delete', 49),
('cortesias_exportar', 'Exportar cortesias', 'acao', '/cortesias', 'Download', 50)
ON CONFLICT (nome) DO NOTHING;

-- =====================================================
-- VERIFICAR RESULTADO
-- =====================================================
SELECT '✅ SETUP DE CORTESIAS CONCLUÍDO!' as status;

-- Verificar tabelas criadas
SELECT 
    'Tabelas criadas:' as categoria,
    table_name,
    '✅ Criada' as status
FROM information_schema.tables 
WHERE table_name IN ('cortesias', 'dependentes_cortesias')
AND table_schema = 'public'
ORDER BY table_name;

-- Verificar funcionalidades adicionadas
SELECT 
    'Funcionalidades de cortesias:' as categoria,
    COUNT(*) as total
FROM funcionalidades
WHERE nome LIKE 'cortesias%';

-- =====================================================
-- FIM DO SETUP
-- ===================================================== 