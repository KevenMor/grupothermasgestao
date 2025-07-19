-- Adicionar constraint única para CPF na tabela cortesias
-- Isso impede que o mesmo CPF seja cadastrado mais de uma vez

-- Primeiro, verificar se já existe alguma constraint única no CPF
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE' 
    AND tc.table_name = 'cortesias'
    AND kcu.column_name = 'cpf';

-- Adicionar constraint única se não existir
DO $$ 
BEGIN
    -- Verificar se a constraint já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'cortesias_cpf_unique' 
        AND table_name = 'cortesias'
    ) THEN
        -- Adicionar constraint única
        ALTER TABLE cortesias 
        ADD CONSTRAINT cortesias_cpf_unique 
        UNIQUE (cpf);
        
        RAISE NOTICE 'Constraint única adicionada ao campo CPF';
    ELSE
        RAISE NOTICE 'Constraint única já existe no campo CPF';
    END IF;
END $$;

-- Verificar se a constraint foi criada
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    tc.constraint_type
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'cortesias'
    AND kcu.column_name = 'cpf';

-- Mostrar resultado
SELECT '✅ CONSTRAINT ÚNICA ADICIONADA AO CPF COM SUCESSO!' as status; 