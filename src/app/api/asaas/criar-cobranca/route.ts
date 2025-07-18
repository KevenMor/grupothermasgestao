import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const ASAAS_API_URL = 'https://api.asaas.com/v3';

// Configurações de split de pagamento
type SplitKey = 'PIX' | 'CREDIT_CARD_1' | 'CREDIT_CARD_2' | 'CREDIT_CARD_3' | 'CREDIT_CARD_4' | 'CREDIT_CARD_5' | 'CREDIT_CARD_6' | 'CREDIT_CARD_7' | 'CREDIT_CARD_8' | 'CREDIT_CARD_9' | 'CREDIT_CARD_10' | 'CREDIT_CARD_11' | 'CREDIT_CARD_12';

const SPLIT_CONFIG: Record<string, Record<SplitKey, number>> = {
  'ad764cfb-dd06-47ee-8be7-86bcec14bde4': {
    'PIX': 35.1636,
    'CREDIT_CARD_1': 35.1636,
    'CREDIT_CARD_2': 34.4854,
    'CREDIT_CARD_3': 34.8033,
    'CREDIT_CARD_4': 35.1355,
    'CREDIT_CARD_5': 34.3157,
    'CREDIT_CARD_6': 34.6454,
    'CREDIT_CARD_7': 35.1627,
    'CREDIT_CARD_8': 34.2315,
    'CREDIT_CARD_9': 34.5762,
    'CREDIT_CARD_10': 34.9226,
    'CREDIT_CARD_11': 34.2029,
    'CREDIT_CARD_12': 34.5536,
  },
  'e8334c42-f892-4ce4-948e-2b8a13845534': {
    'PIX': 7.2396,
    'CREDIT_CARD_1': 7.2396,
    'CREDIT_CARD_2': 7.0999,
    'CREDIT_CARD_3': 7.1654,
    'CREDIT_CARD_4': 7.2338,
    'CREDIT_CARD_5': 7.065,
    'CREDIT_CARD_6': 7.1329,
    'CREDIT_CARD_7': 7.2394,
    'CREDIT_CARD_8': 7.0477,
    'CREDIT_CARD_9': 7.1186,
    'CREDIT_CARD_10': 7.1899,
    'CREDIT_CARD_11': 7.0418,
    'CREDIT_CARD_12': 7.114,
  }
};

// Função para obter a porcentagem de split baseada na forma de pagamento e parcelas
function getSplitPercentage(billingType: string, installmentCount: number): { wallet1: number, wallet2: number } {
  const isPix = billingType === 'PIX';
  const key: SplitKey = isPix ? 'PIX' : `CREDIT_CARD_${installmentCount}` as SplitKey;
  
  return {
    wallet1: SPLIT_CONFIG['ad764cfb-dd06-47ee-8be7-86bcec14bde4'][key] || 0,
    wallet2: SPLIT_CONFIG['e8334c42-f892-4ce4-948e-2b8a13845534'][key] || 0
  };
}

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

    // Determinar forma de pagamento e número de parcelas
    const billingType = cobranca.forma_pagamento === 'PIX' ? 'PIX' : 'CREDIT_CARD';
    const installmentCount = cobranca.quantidade_parcelas || 1;

    // Obter porcentagens de split
    const splitPercentages = getSplitPercentage(billingType, installmentCount);

    // Preparar payload da cobrança para o Asaas
    const cobrancaPayload = {
      customer: customerId,
      billingType: billingType,
      value: cobranca.valor_total,
      dueDate: converterDataParaAsaas(cobranca.data_pagamento),
      description: `Contrato - ${cobranca.cliente_nome}`,
      externalReference: venda_id.toString(),
      installmentCount: installmentCount > 1 ? installmentCount : undefined,
      installmentValue: installmentCount > 1 ? (cobranca.valor_total / installmentCount).toFixed(2) : undefined,
      // Configuração de split de pagamento
      split: [
        {
          walletId: 'ad764cfb-dd06-47ee-8be7-86bcec14bde4',
          fixedValue: 0,
          percentualValue: splitPercentages.wallet1,
          chargeFee: true,
          chargebackFee: true
        },
        {
          walletId: 'e8334c42-f892-4ce4-948e-2b8a13845534',
          fixedValue: 0,
          percentualValue: splitPercentages.wallet2,
          chargeFee: true,
          chargebackFee: true
        }
      ]
    };

    console.log('DEBUG - Criando cobrança no Asaas:', cobrancaPayload);
    console.log('DEBUG - Split configurado:', {
      forma_pagamento: billingType,
      parcelas: installmentCount,
      wallet1_percentual: splitPercentages.wallet1,
      wallet2_percentual: splitPercentages.wallet2
    });

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
      payment_data: cobrancaAsaas,
      split_config: {
        forma_pagamento: billingType,
        parcelas: installmentCount,
        wallet1_percentual: splitPercentages.wallet1,
        wallet2_percentual: splitPercentages.wallet2
      }
    });

  } catch (error) {
    console.error('ERRO geral na criação da cobrança:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 