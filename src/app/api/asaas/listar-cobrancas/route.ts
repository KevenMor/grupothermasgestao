import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Interface para tipar as cobranças do Asaas
interface CobrancaAsaas {
  id: string;
  externalReference: string | null;
  value: number;
  status: string;
  dueDate: string;
  description: string;
  customer: string;
  billingType: string;
  dateCreated: string;
  [key: string]: unknown;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendaId = searchParams.get('venda_id');
    const clienteId = searchParams.get('cliente_id');
    const limit = searchParams.get('limit') || '50';

    // Inicialize o Supabase Admin Client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Busque a chave da API do Asaas
    const { data: configData, error: configError } = await supabase
      .from("configuracoes_integracao")
      .select("chave_api")
      .eq("nome_sistema", "asaas")
      .eq("ativo", true)
      .single();

    if (configError || !configData) {
      return NextResponse.json(
        { error: "Chave da API do Asaas não encontrada." },
        { status: 500 }
      );
    }

    const ASAAS_API_KEY = configData.chave_api;

    // Buscar cobranças do Asaas
    const response = await fetch(`${process.env.ASAAS_API_URL || 'https://api.asaas.com/v3'}/payments?limit=${limit}`, {
      headers: {
        'access_token': ASAAS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar cobranças: ${response.statusText}`);
    }

    const asaasData = await response.json();

    // Buscar todos os IDs de vendas válidos no Supabase
    const { data: vendasValidas, error: vendasError } = await supabase
      .from('vendas')
      .select('id');

    if (vendasError) {
      console.error("Erro ao buscar vendas no Supabase:", vendasError);
      return NextResponse.json(
        { error: "Erro ao buscar vendas no Supabase." },
        { status: 500 }
      );
    }

    const idsVendasValidas = vendasValidas?.map(v => v.id.toString()) || [];

    // Filtrar cobranças: só as que têm externalReference igual a um id de venda válido
    let cobrancasFiltradas = asaasData.data.filter(
      (cobranca: CobrancaAsaas) =>
        cobranca.externalReference &&
        idsVendasValidas.includes(cobranca.externalReference)
    );

    // Se foi especificado um venda_id, filtrar apenas essa venda
    if (vendaId) {
      cobrancasFiltradas = cobrancasFiltradas.filter(
        (cobranca: CobrancaAsaas) => cobranca.externalReference === vendaId
      );
    }

    // Se foi especificado um cliente_id, buscar as vendas desse cliente e filtrar
    if (clienteId && !vendaId) {
      const { data: vendasCliente } = await supabase
        .from('vendas')
        .select('id')
        .eq('cliente_id', clienteId);

      if (vendasCliente && vendasCliente.length > 0) {
        const vendaIds = vendasCliente.map(v => v.id.toString());
        cobrancasFiltradas = cobrancasFiltradas.filter(
          (cobranca: CobrancaAsaas) => 
            cobranca.externalReference && vendaIds.includes(cobranca.externalReference)
        );
      } else {
        cobrancasFiltradas = [];
      }
    }

    // Se não foi especificado nenhum filtro, mostrar apenas cobranças dos últimos 30 dias
    if (!vendaId && !clienteId) {
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
      
      cobrancasFiltradas = cobrancasFiltradas.filter(
        (cobranca: CobrancaAsaas) => {
          const dataCriacao = new Date(cobranca.dateCreated);
          return dataCriacao >= trintaDiasAtras;
        }
      );
    }

    console.log(`Total de cobranças no Asaas: ${asaasData.data?.length || 0}`);
    console.log(`Cobranças filtradas (criadas pelo sistema): ${cobrancasFiltradas.length}`);
    if (vendaId) console.log(`Filtrado por venda_id: ${vendaId}`);
    if (clienteId) console.log(`Filtrado por cliente_id: ${clienteId}`);

    return NextResponse.json({ 
      data: cobrancasFiltradas,
      total: asaasData.data?.length || 0,
      filtradas: cobrancasFiltradas.length,
      filtros: { venda_id: vendaId, cliente_id: clienteId }
    });

  } catch (error) {
    console.error("Erro ao listar cobranças:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 