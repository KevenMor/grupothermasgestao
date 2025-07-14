import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Webhook DocuPilot recebido:', body);
    
    // Extrair dados do payload
    const { 
      venda_id, 
      contrato_url, 
      document_id,
      status = 'gerado'
    } = body;

    if (!venda_id || !contrato_url) {
      return NextResponse.json({ 
        error: "venda_id e contrato_url são obrigatórios" 
      }, { status: 400 });
    }

    // Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Atualizar a venda com a URL do contrato
    const updateData: any = {
      contrato_url: contrato_url,
      assinatura_status: status,
      updated_at: new Date().toISOString()
    };

    // Se temos o document_id, salvar também
    if (document_id) {
      updateData.autentique_document_id = document_id;
    }

    const { error } = await supabase
      .from("vendas")
      .update(updateData)
      .eq("id", venda_id);

    if (error) {
      console.error('Erro ao atualizar venda:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Venda atualizada com sucesso:', { venda_id, contrato_url, document_id });

    return NextResponse.json({ 
      ok: true, 
      message: "URL do contrato salva com sucesso",
      venda_id,
      contrato_url 
    });
  } catch (error) {
    console.error('Erro no webhook DocuPilot:', error);
    return NextResponse.json({ error: error?.toString() }, { status: 500 });
  }
} 