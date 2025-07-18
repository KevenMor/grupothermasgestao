-- Criar tabela de logs do sistema
CREATE TABLE IF NOT EXISTS system_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    description TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_action_type ON system_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_entity_type ON system_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- Função para registrar logs automaticamente
CREATE OR REPLACE FUNCTION log_system_action(
    p_action_type TEXT,
    p_entity_type TEXT,
    p_entity_id TEXT,
    p_description TEXT,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO system_logs (
        user_id,
        user_email,
        action_type,
        entity_type,
        entity_id,
        description,
        old_values,
        new_values,
        ip_address,
        user_agent
    ) VALUES (
        auth.uid(),
        (SELECT email FROM auth.users WHERE id = auth.uid()),
        p_action_type,
        p_entity_type,
        p_entity_id,
        p_description,
        p_old_values,
        p_new_values,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers para registrar mudanças automaticamente nas tabelas principais

-- Trigger para vendas
CREATE OR REPLACE FUNCTION log_vendas_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_system_action(
            'CREATE',
            'venda',
            NEW.id::TEXT,
            'Nova venda criada: ' || NEW.cliente_nome,
            NULL,
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_system_action(
            'UPDATE',
            'venda',
            NEW.id::TEXT,
            'Venda atualizada: ' || NEW.cliente_nome,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_system_action(
            'DELETE',
            'venda',
            OLD.id::TEXT,
            'Venda excluída: ' || OLD.cliente_nome,
            to_jsonb(OLD),
            NULL
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para dependentes
CREATE OR REPLACE FUNCTION log_dependentes_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_system_action(
            'CREATE',
            'dependente',
            NEW.id::TEXT,
            'Novo dependente adicionado: ' || NEW.nome || ' (Venda ID: ' || NEW.venda_id || ')',
            NULL,
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_system_action(
            'UPDATE',
            'dependente',
            NEW.id::TEXT,
            'Dependente atualizado: ' || NEW.nome || ' (Venda ID: ' || NEW.venda_id || ')',
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_system_action(
            'DELETE',
            'dependente',
            OLD.id::TEXT,
            'Dependente excluído: ' || OLD.nome || ' (Venda ID: ' || OLD.venda_id || ')',
            to_jsonb(OLD),
            NULL
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers nas tabelas
DROP TRIGGER IF EXISTS trigger_log_vendas ON vendas;
CREATE TRIGGER trigger_log_vendas
    AFTER INSERT OR UPDATE OR DELETE ON vendas
    FOR EACH ROW EXECUTE FUNCTION log_vendas_changes();

DROP TRIGGER IF EXISTS trigger_log_dependentes ON dependentes;
CREATE TRIGGER trigger_log_dependentes
    AFTER INSERT OR UPDATE OR DELETE ON dependentes
    FOR EACH ROW EXECUTE FUNCTION log_dependentes_changes();

-- Política RLS para logs (apenas admins podem ver)
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all logs" ON system_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN (
                SELECT email FROM auth.users 
                WHERE raw_user_meta_data->>'role' = 'admin'
            )
        )
    );

-- Comentários para documentação
COMMENT ON TABLE system_logs IS 'Tabela para armazenar logs de todas as ações do sistema';
COMMENT ON COLUMN system_logs.action_type IS 'Tipo de ação: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.';
COMMENT ON COLUMN system_logs.entity_type IS 'Tipo de entidade afetada: venda, dependente, usuario, etc.';
COMMENT ON COLUMN system_logs.old_values IS 'Valores anteriores (para UPDATE/DELETE)';
COMMENT ON COLUMN system_logs.new_values IS 'Novos valores (para CREATE/UPDATE)'; 