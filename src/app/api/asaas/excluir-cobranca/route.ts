import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { paymentId, vendaId } = body;
    if (!paymentId) {
      return NextResponse.json({ error: "paymentId obrigatório" }, { status: 400 });
    }
    // Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    // Buscar chave Asaas
    const { data: configData, error: configError } = await supabase
      .from("configuracoes_integracao")
      .select("chave_api")
      .eq("nome_sistema", "asaas")
      .eq("ativo", true)
      .single();
    if (configError || !configData) {
      return NextResponse.json({ error: "Chave da API do Asaas não encontrada." }, { status: 500 });
    }
    const ASAAS_API_KEY = configData.chave_api;
    // Excluir cobrança no Asaas
    const response = await fetch(`${process.env.ASAAS_API_URL || 'https://api.asaas.com/v3'}/payments/${paymentId}`, {
      method: 'DELETE',
      headers: {
        'access_token': ASAAS_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    const asaasResult = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: asaasResult }, { status: 400 });
    }
    // Opcional: remover do Supabase se houver tabela de cobranças
    // if (vendaId) {
    //   await supabase.from('cobrancas').delete().eq('payment_id', paymentId).eq('venda_id', vendaId);
    // }
    return NextResponse.json({ success: true, asaas: asaasResult });
  } catch (error) {
    return NextResponse.json({ error: error?.toString() }, { status: 500 });
  }
} 