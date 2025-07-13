import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const ASAAS_API_URL = 'https://api.asaas.com/v3';

export async function DELETE(req: NextRequest) {
  try {
    const { venda_id } = await req.json();

    if (!venda_id) {
      return NextResponse.json({ error: 'ID da venda não fornecido.' }, { status: 400 });
    }

    // Buscar o customer_id da venda
    const { data: vendaData, error: vendaError } = await supabase
      .from('vendas')
      .select('asaas_customer_id')
      .eq('id', venda_id)
      .single();

    if (vendaError || !vendaData?.asaas_customer_id) {
      return NextResponse.json({ error: 'Cliente não encontrado no Asaas.' }, { status: 400 });
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

    console.log('DEBUG - Excluindo cliente no Asaas:', { customerId });

    // Excluir cliente no Asaas
    const clienteRes = await fetch(`${ASAAS_API_URL}/customers/${customerId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY,
      },
    });

    const rawBody = await clienteRes.text();
    console.log('DEBUG - Resposta do Asaas (exclusão):', rawBody);

    if (!clienteRes.ok) {
      console.error('ERRO ao excluir cliente no Asaas:', rawBody);
      return NextResponse.json({ 
        error: 'Erro ao excluir cliente no Asaas', 
        details: rawBody 
      }, { status: 500 });
    }

    // Limpar o asaas_customer_id no Supabase
    const { error: updateError } = await supabase
      .from('vendas')
      .update({ 
        asaas_customer_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', venda_id);

    if (updateError) {
      console.error('ERRO ao limpar customer_id no Supabase:', updateError);
      return NextResponse.json({ 
        error: 'Erro ao atualizar registro no banco', 
        details: updateError 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Cliente excluído com sucesso do Asaas'
    });

  } catch (error) {
    console.error('ERRO geral na exclusão do cliente:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 