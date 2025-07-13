import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const ASAAS_API_URL = 'https://api.asaas.com/v3';

export async function POST(req: NextRequest) {
  try {
    const { cliente, venda } = await req.json();

    // Buscar chave da API do Asaas no banco
    const { data, error } = await supabase
      .from('configuracoes_integracao')
      .select('chave_api')
      .eq('nome_sistema', 'asaas')
      .eq('ativo', true)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Chave da API do Asaas não encontrada.' }, { status: 400 });
    }

    const ASAAS_API_KEY = data.chave_api;

    // 1. Criar cliente no Asaas
    const clientePayload = {
      name: cliente.nome,
      cpfCnpj: cliente.cpf,
      email: cliente.email,
      phone: cliente.telefone,
      postalCode: cliente.cep,
      address: cliente.endereco,
      addressNumber: cliente.numero,
      complement: cliente.complemento,
      province: cliente.estado,
      city: cliente.cidade,
    };
    console.log('DEBUG - Payload enviado ao Asaas:', clientePayload);
    const clienteRes = await fetch(`${ASAAS_API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY,
      },
      body: JSON.stringify(clientePayload),
    });
    const clienteAsaas = await clienteRes.json();
    console.log('DEBUG - Resposta do Asaas (cliente):', clienteAsaas);
    if (!clienteRes.ok) {
      console.error('ERRO ao criar cliente no Asaas:', clienteAsaas);
      return NextResponse.json({ error: 'Erro ao criar cliente no Asaas', details: clienteAsaas }, { status: 500 });
    }

    // 2. Criar cobrança(s)
    const cobrancas = [];
    for (let i = 0; i < (venda.quantidade_parcelas || 1); i++) {
      // Calcular vencimento da parcela
      const vencimento = new Date(venda.data_pagamento);
      vencimento.setMonth(vencimento.getMonth() + i);
      const vencimentoStr = vencimento.toISOString().split('T')[0];

      const cobrancaRes = await fetch(`${ASAAS_API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': ASAAS_API_KEY,
        },
        body: JSON.stringify({
          customer: clienteAsaas.id,
          billingType: venda.forma_pagamento, // 'BOLETO', 'PIX', 'CREDIT_CARD'
          value: Number(venda.valor_total) / (venda.quantidade_parcelas || 1),
          dueDate: vencimentoStr,
          description: venda.descricao,
        }),
      });
      const cobranca = await cobrancaRes.json();
      cobrancas.push(cobranca);
    }

    return NextResponse.json({ clienteAsaas, cobrancas });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 