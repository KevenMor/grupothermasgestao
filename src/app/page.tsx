"use client";

import { Box, Card, CardContent, Typography, Avatar, useTheme } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DashboardIcon from '@mui/icons-material/Dashboard';

const cards = [
  {
    title: 'Usuários Ativos',
    value: 128,
    icon: <PeopleIcon fontSize="large" />, 
    color: 'primary',
  },
  {
    title: 'Vendas no Mês',
    value: 42,
    icon: <MonetizationOnIcon fontSize="large" />, 
    color: 'secondary',
  },
  {
    title: 'Receita Total',
    value: 'R$ 12.500',
    icon: <TrendingUpIcon fontSize="large" />, 
    color: 'success',
  },
  {
    title: 'Dashboard',
    value: 'Resumo',
    icon: <DashboardIcon fontSize="large" />, 
    color: 'info',
  },
] as const;

type CardColor = typeof cards[number]['color'];

export default function Home() {
  const theme = useTheme();
  return (
    <Box sx={{ width: '100%', py: { xs: 2, md: 4 } }}>
      <Typography variant="h4" fontWeight={700} mb={2} color="primary.main">
        Bem-vindo ao SaaS Grupo Thermas
      </Typography>
      <Typography variant="h6" color="text.secondary" mb={4}>
        Sistema de gestão de usuários e vendas/sócios.
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 3,
        }}
      >
        {cards.map((card) => (
          <Card key={card.title} sx={{
            borderRadius: 4,
            boxShadow: '0 2px 16px 0 rgba(0,0,0,0.06)',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 6px 24px 0 rgba(0,0,0,0.10)' },
            bgcolor: 'background.paper',
          }}>
            <Avatar sx={{ bgcolor: theme.palette[card.color as CardColor].main, width: 56, height: 56 }}>
              {card.icon}
            </Avatar>
            <CardContent sx={{ p: 0 }}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={500} mb={0.5}>{card.title}</Typography>
              <Typography variant="h5" fontWeight={700} color="text.primary">{card.value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
