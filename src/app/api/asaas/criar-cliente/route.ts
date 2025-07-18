import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const ASAAS_API_URL = 'https://api.asaas.com/v3';

export async function POST(req: NextRequest) {
  try {
    const { venda_id, cliente } = await req.json();

    if (!venda_id || !cliente) {
      return NextResponse.json({ error: 'Dados obrigatórios não fornecidos.' }, { status: 400 });
    }

    // Buscar o tipo de contrato da venda
    const { data: vendaData, error: vendaError } = await supabase
      .from('vendas')
      .select('tipo_contrato')
      .eq('id', venda_id)
      .single();

    if (vendaError) {
      console.error('ERRO ao buscar tipo de contrato:', vendaError);
      return NextResponse.json({ error: 'Erro ao buscar dados da venda.' }, { status: 400 });
    }

    const tipoContrato = vendaData?.tipo_contrato || 'Lote Vitalício Therra';

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
      company: tipoContrato, // Adicionar o tipo de contrato como empresa
      group: tipoContrato, // Adicionar o tipo de contrato como grupo
    };

    console.log('DEBUG - Criando cliente no Asaas:', clientePayload);

    // Criar cliente no Asaas
    const clienteRes = await fetch(`${ASAAS_API_URL}/customers`, {
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
    console.log('DEBUG - Resposta do Asaas (cliente):', rawBody);

    if (!clienteRes.ok) {
      console.error('ERRO ao criar cliente no Asaas:', rawBody);
      return NextResponse.json({ 
        error: 'Erro ao criar cliente no Asaas', 
        details: rawBody 
      }, { status: 500 });
    }

    // Salvar o ID do customer no Supabase
    const customerId = (clienteAsaas as { id?: string })?.id;
    const { error: updateError } = await supabase
      .from('vendas')
      .update({ 
        asaas_customer_id: customerId,
        updated_at: new Date().toISOString()
      })
      .eq('id', venda_id);

    if (updateError) {
      console.error('ERRO ao salvar customer_id no Supabase:', updateError);
      return NextResponse.json({ 
        error: 'Erro ao salvar ID do cliente no banco', 
        details: updateError 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      customer_id: (clienteAsaas as { id?: string })?.id,
      customer_data: clienteAsaas
    });

  } catch (error) {
    console.error('ERRO geral na criação do cliente:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 