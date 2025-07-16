"use client";

import { Box, Card, CardContent, Typography, Avatar, useTheme, Grid, Paper } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  totalVendas: number;
  vendasPendentes: number;
  vendasAtivas: number;
  totalReceita: number;
}

export default function Home() {
  const theme = useTheme();
  const [stats, setStats] = useState<DashboardStats>({
    totalVendas: 0,
    vendasPendentes: 0,
    vendasAtivas: 0,
    totalReceita: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        setLoading(true);
        
        // Buscar estatísticas das vendas
        const { data: vendas, error } = await supabase
          .from('vendas')
          .select('valor_total, status');

        if (error) {
          console.error('Erro ao buscar vendas:', error);
          return;
        }

        if (vendas) {
          const totalVendas = vendas.length;
          const vendasPendentes = vendas.filter(v => v.status === 'pendente').length;
          const vendasAtivas = vendas.filter(v => v.status === 'ativo').length;
          const totalReceita = vendas
            .filter(v => v.status === 'ativo')
            .reduce((sum, v) => sum + (v.valor_total || 0), 0);

          setStats({
            totalVendas,
            vendasPendentes,
            vendasAtivas,
            totalReceita
          });
        }
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardStats();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const cards = [
    {
      title: 'Total de Vendas',
      value: stats.totalVendas,
      icon: <ReceiptIcon fontSize="large" />,
      color: 'primary',
      subtitle: 'Contratos cadastrados'
    },
    {
      title: 'Vendas Pendentes',
      value: stats.vendasPendentes,
      icon: <MonetizationOnIcon fontSize="large" />,
      color: 'warning',
      subtitle: 'Aguardando pagamento'
    },
    {
      title: 'Vendas Ativas',
      value: stats.vendasAtivas,
      icon: <CheckCircleIcon fontSize="large" />,
      color: 'success',
      subtitle: 'Sócios ativos'
    },
    {
      title: 'Receita Total',
      value: formatCurrency(stats.totalReceita),
      icon: <PeopleIcon fontSize="large" />,
      color: 'info',
      subtitle: 'Valor total recebido'
    },
  ] as const;

  type CardColor = typeof cards[number]['color'];

  if (loading) {
    return (
      <Box sx={{ width: '100%', py: { xs: 2, md: 4 }, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Carregando estatísticas...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', py: { xs: 2, md: 4 } }}>
      <Typography variant="h4" fontWeight={700} mb={2} color="primary.main">
        Dashboard - Grupo Thermas
      </Typography>
      <Typography variant="h6" color="text.secondary" mb={4}>
        Visão geral do sistema de gestão de vendas e sócios.
      </Typography>
      
      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Card sx={{
              borderRadius: 4,
              boxShadow: '0 2px 16px 0 rgba(0,0,0,0.06)',
              p: 3,
              height: '100%',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': { 
                transform: 'translateY(-4px)', 
                boxShadow: '0 6px 24px 0 rgba(0,0,0,0.10)' 
              },
              bgcolor: 'background.paper',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ 
                  bgcolor: theme.palette[card.color as CardColor].main, 
                  width: 56, 
                  height: 56 
                }}>
                  {card.icon}
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="text.primary">
                    {card.value}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={500}>
                    {card.subtitle}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h6" fontWeight={600} color="text.primary">
                {card.title}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {stats.totalVendas === 0 && (
        <Paper sx={{ 
          mt: 4, 
          p: 4, 
          textAlign: 'center', 
          borderRadius: 4,
          bgcolor: 'background.default'
        }}>
          <Typography variant="h6" color="text.secondary" mb={2}>
            Nenhuma venda cadastrada ainda
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comece cadastrando sua primeira venda no sistema.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
