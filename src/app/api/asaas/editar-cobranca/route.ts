import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { paymentId, valor, vencimento, descricao } = body;
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

    // Editar cobrança no Asaas
    const response = await fetch(`${process.env.ASAAS_API_URL || 'https://api.asaas.com/v3'}/payments/${paymentId}`, {
      method: 'POST',
      headers: {
        'access_token': ASAAS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        value: valor,
        dueDate: vencimento,
        description: descricao
      })
    });
    const asaasResult = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: asaasResult }, { status: 400 });
    }
    // Opcional: atualizar dados no Supabase se necessário
    // ...
    return NextResponse.json({ success: true, asaas: asaasResult });
  } catch (error) {
    return NextResponse.json({ error: error?.toString() }, { status: 500 });
  }
} 