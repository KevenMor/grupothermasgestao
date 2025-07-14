# Fluxo de Contrato com DocuPilot + Autentique

## Problema Identificado
O DocuPilot gera a URL do contrato, mas ela não estava sendo salva no sistema. O webhook do Autentique estava tentando sobrescrever a URL, mas deveria apenas atualizar o status da assinatura.

## Fluxo Correto

### 1. Criação da Venda
```
Sistema → Cria venda no Supabase
Sistema → Envia webhook para Make: https://hook.us2.make.com/vbkyv4fdmodakql1ofqe7fg4scrpdmnk
```

### 2. Processamento no Make
```
Make → Recebe dados da venda
Make → DocuPilot gera contrato
Make → Autentique cria documento para assinatura
Make → Envia webhook para sistema: /api/webhooks/docupilot
```

### 3. Salvamento da URL do DocuPilot
**Endpoint**: `/api/webhooks/docupilot`

**Payload esperado**:
```json
{
  "venda_id": "123",
  "contrato_url": "https://docupilot.com/contrato/abc123.pdf",
  "document_id": "autentique_doc_456",
  "status": "gerado"
}
```

**Ação**: Salva a URL do DocuPilot no campo `contrato_url` da tabela `vendas`

### 4. Assinatura no Autentique
```
Cliente → Assina contrato no Autentique
Autentique → Envia webhook: /api/webhooks/autentique
```

### 5. Atualização do Status
**Endpoint**: `/api/webhooks/autentique`

**Payload do Autentique**:
```json
{
  "event": "signature.accepted",
  "data": {
    "document": {
      "id": "autentique_doc_456",
      "external_reference": "123"
    }
  }
}
```

**Ação**: Apenas atualiza `assinatura_status: "assinado"` (não sobrescreve a URL)

## Configuração no Make

### Webhook para DocuPilot
Após gerar o contrato no DocuPilot e enviar para o Autentique, adicione um módulo HTTP Request:

**URL**: `https://seu-dominio.com/api/webhooks/docupilot`

**Método**: `POST`

**Headers**: 
```
Content-Type: application/json
```

**Body**:
```json
{
  "venda_id": "{{venda.id}}",
  "contrato_url": "{{docupilot.contrato_url}}",
  "document_id": "{{autentique.document_id}}",
  "status": "gerado"
}
```

### Webhook do Autentique
Configure o webhook do Autentique para apontar para:
```
https://seu-dominio.com/api/webhooks/autentique
```

## Campos no Supabase

A tabela `vendas` deve ter os campos:
- `contrato_url` - URL do contrato gerado pelo DocuPilot
- `assinatura_status` - Status da assinatura (gerado/assinado)
- `autentique_document_id` - ID do documento no Autentique

## Resultado Final

1. **Contrato gerado**: URL do DocuPilot salva em `contrato_url`
2. **Contrato assinado**: Status atualizado para "assinado"
3. **Sistema exibe**: Link para download do contrato na tela de detalhes da venda

## Teste

1. Crie uma nova venda
2. Verifique se o Make está enviando webhook para `/api/webhooks/docupilot`
3. Verifique se a URL aparece na tela de detalhes da venda
4. Assine o contrato no Autentique
5. Verifique se o status muda para "assinado" 