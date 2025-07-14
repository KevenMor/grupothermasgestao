import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Webhook Autentique recebido:', body);
    
    // Ajuste conforme o payload do Autentique
    const { 
      event, 
      data 
    } = body;

    // Verificar se é o evento de assinatura aceita
    if (event !== "signature.accepted") {
      return NextResponse.json({ ok: true, message: "Evento não relevante" });
    }

    const documentId = data?.document?.id;
    const documentUrl = data?.document?.download_url;
    const externalReference = data?.document?.external_reference;

    if (!documentId) {
      return NextResponse.json({ error: "Document ID não encontrado" }, { status: 400 });
    }

    // Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Atualizar a venda com o status de assinatura e URL do contrato
    let updateData: any = {
      assinatura_status: "assinado",
      updated_at: new Date().toISOString()
    };

    // Se temos a URL do documento, salvar também
    if (documentUrl) {
      updateData.contrato_url = documentUrl;
    }

    // Se temos o external_reference, usar para identificar a venda
    let query = supabase
      .from("vendas")
      .update(updateData);

    if (externalReference) {
      // Usar external_reference se disponível
      query = query.eq("id", externalReference);
    } else {
      // Fallback: usar document_id (se você salvar o document_id na venda)
      query = query.eq("autentique_document_id", documentId);
    }

    const { error } = await query;

    if (error) {
      console.error('Erro ao atualizar venda:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Venda atualizada com sucesso:', { documentId, documentUrl, externalReference });

    return NextResponse.json({ 
      ok: true, 
      message: "Status atualizado com sucesso",
      documentId,
      documentUrl 
    });
  } catch (error) {
    console.error('Erro no webhook:', error);
    return NextResponse.json({ error: error?.toString() }, { status: 500 });
  }
} 