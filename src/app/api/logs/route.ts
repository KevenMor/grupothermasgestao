import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const actionType = searchParams.get('action_type');
    const entityType = searchParams.get('entity_type');
    const userId = searchParams.get('user_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const search = searchParams.get('search');

    // Calcular offset para paginação
    const offset = (page - 1) * limit;

    // Construir query base
    let query = supabase
      .from('system_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (actionType) {
      query = query.eq('action_type', actionType);
    }

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    if (search) {
      query = query.or(`description.ilike.%${search}%,user_email.ilike.%${search}%`);
    }

    // Aplicar paginação
    query = query.range(offset, offset + limit - 1);

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar logs:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar logs do sistema' },
        { status: 500 }
      );
    }

    // Buscar estatísticas
    const { data: stats } = await supabase
      .from('system_logs')
      .select('action_type, entity_type')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Últimas 24h

    const actionStats = stats?.reduce((acc, log) => {
      acc[log.action_type] = (acc[log.action_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const entityStats = stats?.reduce((acc, log) => {
      acc[log.entity_type] = (acc[log.entity_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return NextResponse.json({
      data: logs,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats: {
        last24h: {
          actions: actionStats,
          entities: entityStats
        }
      }
    });

  } catch (error) {
    console.error('Erro na API de logs:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action_type, entity_type, entity_id, description, old_values, new_values } = body;

    // Validar campos obrigatórios
    if (!action_type || !entity_type || !description) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: action_type, entity_type, description' },
        { status: 400 }
      );
    }

    // Registrar log manual
    const { data, error } = await supabase
      .from('system_logs')
      .insert({
        action_type,
        entity_type,
        entity_id,
        description,
        old_values,
        new_values,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao registrar log:', error);
      return NextResponse.json(
        { error: 'Erro ao registrar log' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });

  } catch (error) {
    console.error('Erro na API de logs:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 