import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const ASAAS_API_URL = 'https://api.asaas.com/v3';

export async function PUT(req: NextRequest) {
  try {
    const { venda_id, cliente } = await req.json();

    if (!venda_id || !cliente) {
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

    // Preparar payload do cliente para o Asaas
    const telefoneLimpo = cliente.cliente_telefone.replace(/\D/g, ''); // Remove caracteres não numéricos
    
    const clientePayload = {
      name: cliente.cliente_nome,
      cpfCnpj: cliente.cliente_cpf.replace(/\D/g, ''), // Remove caracteres não numéricos
      email: cliente.cliente_email,
      phone: telefoneLimpo, // Telefone fixo
      mobilePhone: telefoneLimpo, // Telefone celular (mesmo número)
      postalCode: cliente.cliente_cep?.replace(/\D/g, '') || '',
      address: cliente.cliente_endereco || '',
      addressNumber: cliente.cliente_numero || '',
      complement: cliente.cliente_complemento || '',
      province: cliente.cliente_estado || '',
      city: cliente.cliente_cidade || '',
    };

    console.log('DEBUG - Editando cliente no Asaas:', { customerId, clientePayload });

    // Editar cliente no Asaas
    const clienteRes = await fetch(`${ASAAS_API_URL}/customers/${customerId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY,
      },
      body: JSON.stringify(clientePayload),
    });

    let clienteAsaas: unknown = null;
    const rawBody = await clienteRes.text();
    try {
      clienteAsaas = JSON.parse(rawBody);
    } catch {
      clienteAsaas = null;
    }
    console.log('DEBUG - Resposta do Asaas (edição):', rawBody);

    if (!clienteRes.ok) {
      console.error('ERRO ao editar cliente no Asaas:', rawBody);
      return NextResponse.json({ 
        error: 'Erro ao editar cliente no Asaas', 
        details: rawBody 
      }, { status: 500 });
    }

    // Atualizar updated_at no Supabase
    const { error: updateError } = await supabase
      .from('vendas')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('id', venda_id);

    if (updateError) {
      console.error('ERRO ao atualizar timestamp no Supabase:', updateError);
      return NextResponse.json({ 
        error: 'Erro ao atualizar registro no banco', 
        details: updateError 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      customer_id: customerId,
      customer_data: clienteAsaas
    });

  } catch (error) {
    console.error('ERRO geral na edição do cliente:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 