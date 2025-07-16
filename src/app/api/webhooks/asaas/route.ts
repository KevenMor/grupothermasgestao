import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Webhook Asaas recebido:', JSON.stringify(body, null, 2));

    // Verificar se é uma notificação de pagamento
    if (body.event === 'PAYMENT_RECEIVED' || body.event === 'PAYMENT_CONFIRMED') {
      const payment = body.payment;
      
      if (payment && payment.externalReference) {
        // Atualizar o status da venda no banco de dados
        const { error } = await supabase
          .from('vendas')
          .update({ 
            status: 'pago',
            asaas_payment_id: payment.id,
            data_pagamento: new Date().toISOString().split('T')[0]
          })
          .eq('id', payment.externalReference);

        if (error) {
          console.error('Erro ao atualizar venda:', error);
          return NextResponse.json({ error: 'Erro ao atualizar venda' }, { status: 500 });
        }

        console.log(`Venda ${payment.externalReference} marcada como paga`);
        
        // Aqui você pode adicionar outras ações:
        // - Enviar e-mail de confirmação
        // - Gerar recibo
        // - Atualizar status da cobrança
        // - etc.
      }
    }

    // Responder com sucesso para o Asaas
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro no webhook Asaas:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
} 