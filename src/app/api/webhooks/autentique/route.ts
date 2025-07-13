import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Ajuste conforme o payload do Autentique
    const { document_id, status, external_reference, email } = body;

    if (status !== "signed") {
      return NextResponse.json({ ok: true, message: "Não assinado ainda" });
    }

    // Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Atualizar status do cliente pelo email
    let error = null;
    if (email) {
      const update = await supabase
        .from("clientes")
        .update({ autentique_status: "assinado" })
        .eq("email", email);
      error = update.error;
    }

    // (Opcional) Atualizar status do contrato/venda também, se desejar
    // const updateVenda = await supabase
    //   .from("vendas")
    //   .update({ assinatura_status: "assinado" })
    //   .eq("contrato_url", document_id);
    // if (updateVenda.error) error = updateVenda.error;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error?.toString() }, { status: 500 });
  }
} 