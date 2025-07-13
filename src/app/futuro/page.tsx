"use client";
import { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Paper, Stack, Chip, LinearProgress, Grid
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PeopleIcon from "@mui/icons-material/People";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { supabase } from "@/lib/supabase";

type Metricas = {
  totalUsuarios: number;
  totalVendas: number;
  vendasMes: number;
  receitaMes: number;
  vendasPendentes: number;
  taxaConversao: number;
};

export default function FuturoPage() {
  const [metricas, setMetricas] = useState<Metricas>({
    totalUsuarios: 0,
    totalVendas: 0,
    vendasMes: 0,
    receitaMes: 0,
    vendasPendentes: 0,
    taxaConversao: 0
  });

  async function carregarMetricas() {
    try {
      // Carregar dados do Supabase
      const [usuariosResponse, vendasResponse] = await Promise.all([
        supabase.from('usuarios').select('*'),
        supabase.from('vendas').select('*')
      ]);

      const usuarios = usuariosResponse.data || [];
      const vendas = vendasResponse.data || [];
      
      // Calcular métricas
      const mesAtual = new Date().getMonth();
      const anoAtual = new Date().getFullYear();
      
      const vendasMes = vendas.filter(v => {
        const dataVenda = new Date(v.data_venda);
        return dataVenda.getMonth() === mesAtual && dataVenda.getFullYear() === anoAtual;
      });
      
      const vendasPendentes = vendas.filter(v => v.status === 'pendente');
      const receitaMes = vendasMes.reduce((total, v) => total + (v.valor || 0), 0);
      
      setMetricas({
        totalUsuarios: usuarios.length,
        totalVendas: vendas.length,
        vendasMes: vendasMes.length,
        receitaMes: receitaMes,
        vendasPendentes: vendasPendentes.length,
        taxaConversao: vendas.length > 0 ? Math.round((vendas.filter(v => v.status === 'aprovada').length / vendas.length) * 100) : 0
      });
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    }
  }

  useEffect(() => {
    carregarMetricas();
  }, []);

  function formatarMoeda(valor: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  const cards = [
    {
      titulo: "Total de Usuários",
      valor: metricas.totalUsuarios,
      icone: <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      cor: "primary",
      variacao: "+12% este mês"
    },
    {
      titulo: "Vendas do Mês",
      valor: metricas.vendasMes,
      icone: <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      cor: "success",
      variacao: "+8% vs mês anterior"
    },
    {
      titulo: "Receita Mensal",
      valor: formatarMoeda(metricas.receitaMes),
      icone: <AttachMoneyIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      cor: "warning",
      variacao: "+15% vs mês anterior"
    },
    {
      titulo: "Taxa de Conversão",
      valor: `${metricas.taxaConversao}%`,
      icone: <AssessmentIcon sx={{ fontSize: 40, color: 'info.main' }} />,
      cor: "info",
      variacao: "+5% vs mês anterior"
    }
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={4}>
        Dashboard - Visão Geral
      </Typography>

      {/* Cards de Métricas */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        {cards.map((card, index) => (
          <Box key={index}>
            <Card sx={{ 
              borderRadius: 3, 
              boxShadow: 2,
              '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
              transition: 'all 0.3s ease'
            }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {card.titulo}
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color={`${card.cor}.main`}>
                      {card.valor}
                    </Typography>
                  </Box>
                  {card.icone}
                </Stack>
                <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendingUpIcon sx={{ fontSize: 16 }} />
                  {card.variacao}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Seção de Atividades Recentes */}
      <Grid container spacing={3}>
        <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 2' }, width: '100%' }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Atividades Recentes
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stack alignItems="center" spacing={2}>
                <AssessmentIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
                <Typography variant="h6" color="text.secondary">
                  Gráficos e Relatórios
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Em breve: gráficos de vendas, relatórios de performance<br />
                  e análises detalhadas do negócio.
                </Typography>
              </Stack>
            </Box>
          </Paper>
        </Box>
        <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 1' }, width: '100%' }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Status das Vendas
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Aprovadas</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {metricas.totalVendas > 0 ? Math.round((metricas.totalVendas - metricas.vendasPendentes) / metricas.totalVendas * 100) : 0}%
                  </Typography>
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={metricas.totalVendas > 0 ? (metricas.totalVendas - metricas.vendasPendentes) / metricas.totalVendas * 100 : 0}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Box>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Pendentes</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {metricas.vendasPendentes}
                  </Typography>
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={metricas.totalVendas > 0 ? metricas.vendasPendentes / metricas.totalVendas * 100 : 0}
                  color="warning"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Stack>
          </Paper>
        </Box>
      </Grid>

      {/* Seção de Funcionalidades Futuras */}
      <Paper sx={{ p: 3, borderRadius: 3, mt: 3 }}>
        <Typography variant="h6" fontWeight={600} mb={3}>
          Próximas Funcionalidades
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
          {[
            "Relatórios Avançados",
            "Integração com Pagamentos",
            "Sistema de Notificações",
            "App Mobile",
            "API para Integrações",
            "Dashboard em Tempo Real"
          ].map((funcionalidade, index) => (
            <Box key={index}>
              <Chip 
                label={funcionalidade} 
                variant="outlined" 
                color="primary"
                sx={{ borderRadius: 2 }}
              />
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
} 