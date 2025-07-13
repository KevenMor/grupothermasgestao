import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const ASAAS_API_URL = 'https://api.asaas.com/v3';

// Função para converter data de DD/MM/AAAA para YYYY-MM-DD
function converterDataParaAsaas(data: string): string {
  if (!data) return '';
  
  // Se já está no formato YYYY-MM-DD, retorna como está
  if (data.includes('-') && data.split('-')[0].length === 4) {
    return data;
  }
  
  // Se está no formato DD/MM/AAAA, converte para YYYY-MM-DD
  if (data.includes('/')) {
    const [dia, mes, ano] = data.split('/');
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }
  
  return data;
}

export async function POST(req: NextRequest) {
  try {
    const { venda_id, cobranca } = await req.json();

    if (!venda_id || !cobranca) {
      return NextResponse.json({ error: 'Dados obrigatórios não fornecidos.' }, { status: 400 });
    }

    // Buscar o customer_id da venda
    const { data: vendaData, error: vendaError } = await supabase
      .from('vendas')
      .select('asaas_customer_id')
      .eq('id', venda_id)
      .single();

    if (vendaError || !vendaData?.asaas_customer_id) {
      return NextResponse.json({ error: 'Cliente não encontrado no Asaas. Crie o cliente primeiro.' }, { status: 400 });
    }

    const customerId = vendaData.asaas_customer_id;

    // Buscar chave da API do Asaas no banco
    const { data: configData, error: configError } = await supabase
      .from('configuracoes_integracao')
      .select('chave_api')
      .eq('nome_sistema', 'asaas')
      .eq('ativo', true)
      .single();

    if (configError || !configData) {
      return NextResponse.json({ error: 'Chave da API do Asaas não encontrada.' }, { status: 400 });
    }

    const ASAAS_API_KEY = configData.chave_api;

    // Preparar payload da cobrança para o Asaas
    const cobrancaPayload = {
      customer: customerId,
      billingType: cobranca.forma_pagamento === 'PIX' ? 'PIX' : 'CREDIT_CARD',
      value: cobranca.valor_total,
      dueDate: converterDataParaAsaas(cobranca.data_pagamento),
      description: `Contrato - ${cobranca.cliente_nome}`,
      externalReference: venda_id.toString(),
      installmentCount: cobranca.quantidade_parcelas > 1 ? cobranca.quantidade_parcelas : undefined,
      installmentValue: cobranca.quantidade_parcelas > 1 ? (cobranca.valor_total / cobranca.quantidade_parcelas).toFixed(2) : undefined,
    };

    console.log('DEBUG - Criando cobrança no Asaas:', cobrancaPayload);

    // Criar cobrança no Asaas
    const cobrancaRes = await fetch(`${ASAAS_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY,
      },
      body: JSON.stringify(cobrancaPayload),
    });

    let cobrancaAsaas: unknown = null;
    const rawBody = await cobrancaRes.text();
    try {
      cobrancaAsaas = JSON.parse(rawBody);
    } catch {
      cobrancaAsaas = null;
    }
    console.log('DEBUG - Resposta do Asaas (cobrança):', rawBody);

    if (!cobrancaRes.ok) {
      console.error('ERRO ao criar cobrança no Asaas:', rawBody);
      return NextResponse.json({ 
        error: 'Erro ao criar cobrança no Asaas', 
        details: rawBody 
      }, { status: 500 });
    }

    // Salvar o ID da cobrança no Supabase
    const paymentId = (cobrancaAsaas as { id?: string })?.id;
    const { error: updateError } = await supabase
      .from('vendas')
      .update({ 
        asaas_payment_id: paymentId,
        updated_at: new Date().toISOString()
      })
      .eq('id', venda_id);

    if (updateError) {
      console.error('ERRO ao salvar payment_id no Supabase:', updateError);
      return NextResponse.json({ 
        error: 'Erro ao salvar ID da cobrança no banco', 
        details: updateError 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      payment_id: (cobrancaAsaas as { id?: string })?.id,
      payment_data: cobrancaAsaas
    });

  } catch (error) {
    console.error('ERRO geral na criação da cobrança:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 