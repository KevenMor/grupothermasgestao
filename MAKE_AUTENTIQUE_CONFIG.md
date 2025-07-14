# Configuração do Make para Autentique

## Problema Identificado
O contrato está sendo gerado no Autentique, mas a URL não está sendo salva no sistema porque o webhook não consegue identificar qual venda atualizar.

## Solução

### 1. Configuração no Make (Integromat)

Quando você criar o documento no Autentique através do Make, **certifique-se de incluir o `external_reference`**:

```json
{
  "name": "Contrato - {{venda.cliente_nome}}",
  "content": "{{contrato_gerado}}",
  "signers": [
    {
      "name": "{{venda.cliente_nome}}",
      "email": "{{venda.cliente_email}}",
      "send_automatic": true
    }
  ],
  "external_reference": "{{venda.id}}",  // ← IMPORTANTE: ID da venda
  "folder": "Contratos"
}
```

### 2. Fluxo Correto no Make

1. **Receber dados da venda** (webhook do seu sistema)
2. **Gerar contrato** (template + dados)
3. **Criar documento no Autentique** com `external_reference: {{venda.id}}`
4. **Salvar dados no Supabase** (opcional, para backup)
5. **Enviar para assinatura** (Autentique faz automaticamente)

### 3. Configuração do Webhook

O webhook do Autentique (`/api/webhooks/autentique`) está configurado para:

- Receber o evento `signature.accepted`
- Extrair o `external_reference` do payload
- Atualizar a venda correspondente com:
  - `assinatura_status: "assinado"`
  - `contrato_url: download_url` (se disponível)

### 4. Verificação

Para verificar se está funcionando:

1. **No Make**: Confirme que está enviando `external_reference: {{venda.id}}`
2. **No Autentique**: Verifique se o documento tem o external_reference correto
3. **No webhook**: Verifique os logs para ver se está recebendo o evento
4. **No sistema**: Verifique se a URL do contrato aparece na tela de detalhes da venda

### 5. Logs do Webhook

O webhook agora tem logs detalhados. Verifique no console do servidor:

```
Webhook Autentique recebido: { event: "signature.accepted", data: { document: { id: "abc123", download_url: "...", external_reference: "123" } } }
Venda atualizada com sucesso: { documentId: "abc123", documentUrl: "...", externalReference: "123" }
```

### 6. Campos Necessários no Supabase

Execute o script `supabase_add_autentique_fields.sql` para adicionar os campos:

- `autentique_document_id` - ID do documento no Autentique
- `contrato_url` - URL para download do PDF
- `assinatura_status` - Status da assinatura (pendente/assinado)
- `assinatura_id` - ID da assinatura (opcional)

## Teste

1. Crie uma nova venda
2. Verifique se o Make está enviando o `external_reference`
3. Assine o contrato no Autentique
4. Verifique se a URL aparece na tela de detalhes da venda 