'use client';

import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box, Divider, IconButton, Typography, useTheme, useMediaQuery } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PaymentIcon from '@mui/icons-material/Payment';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import LogoutIcon from '@mui/icons-material/Logout';
import { useRouter } from 'next/navigation';
import PersonIcon from '@mui/icons-material/Person';
import { usePermissions } from '@/hooks/usePermissions';

const drawerWidth = 280;
const menu = [
  { name: "Dashboard", href: "/dashboard", icon: <DashboardIcon /> },
  { name: "Gestão de Usuários", href: "/usuarios", icon: <PeopleIcon /> },
  { name: "Gestão de Vendas/Sócios", href: "/vendas", icon: <MonetizationOnIcon /> },
  { name: "Cortesias", href: "/cortesias", icon: <CardGiftcardIcon /> },
  { name: "Cobranças e Pagamentos", href: "/cobrancas", icon: <PaymentIcon /> },
  { name: "Futuro", href: "/futuro", icon: <MoreHorizIcon /> },
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [usuarioLogado, setUsuarioLogado] = useState<{ id: number; nome: string; email: string } | null>(null);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Carregar permissões do usuário
  const { podeAcessarMenu } = usePermissions(usuarioLogado?.id);

  useEffect(() => {
    // Carregar dados do usuário logado
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUsuarioLogado(user);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.replace('/login');
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header com logo */}
      <Toolbar sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            boxShadow: 2,
            overflow: 'hidden',
          }}
        >
          <img
            src="https://static.wixstatic.com/media/1fe811_885a4937ced44f5cae82c5ebef44348c~mv2.png/v1/crop/x_45,y_0,w_1151,h_958/fill/w_213,h_177,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/logo-grupothermas_Prancheta%201.png"
            alt="Logo Grupo Thermas"
            style={{ width: '70px', height: '70px', objectFit: 'contain' }}
          />
        </Box>
        <Typography variant="h6" fontWeight={700} color="white" mt={1} mb={0} sx={{ letterSpacing: 1 }}>Grupo Thermas</Typography>
      </Toolbar>
      <Divider sx={{ bgcolor: 'white', opacity: 0.2, mx: 2, borderRadius: 2 }} />
      
      {/* Menu principal */}
      <List sx={{ mt: 2, px: 1, flex: 1 }}>
        {menu.map((item) => {
          // Verificar se usuário pode acessar este menu
          const menuKey = item.href.replace('/', '');
          const podeAcessar = podeAcessarMenu(menuKey);
          
          // Debug: mostrar permissões no console
          console.log(`Menu ${item.name} (${menuKey}): podeAcessar = ${podeAcessar}`);
          
          // Temporariamente mostrar todos os menus para debug
          // if (!podeAcessar) return null;
          
          return (
            <ListItem key={item.name} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component={Link}
                href={item.href}
                sx={{
                  mx: 1,
                  borderRadius: 3,
                  py: 1.5,
                  px: 2,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: 'white' },
                  '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.15)' },
                  transition: 'all 0.2s',
                }}
                onClick={() => setMobileOpen(false)}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText 
                  primary={item.name} 
                  primaryTypographyProps={{ 
                    fontWeight: 500, 
                    fontSize: isMobile ? 14 : 16 
                  }} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
        <ListItem disablePadding sx={{ mt: 2 }}>
          <ListItemButton 
            onClick={handleLogout} 
            sx={{ 
              mx: 1, 
              borderRadius: 3, 
              py: 1.5, 
              px: 2,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
              transition: 'all 0.2s',
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
              <LogoutIcon fontSize="medium" />
            </ListItemIcon>
            <ListItemText 
              primary="Sair" 
              primaryTypographyProps={{ 
                fontWeight: 500, 
                fontSize: isMobile ? 14 : 16 
              }} 
            />
          </ListItemButton>
        </ListItem>
      </List>
      
      {/* Footer com informações do usuário */}
      {usuarioLogado && (
        <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <PersonIcon sx={{ fontSize: 20, color: 'rgba(255,255,255,0.8)' }} />
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255,255,255,0.9)', 
                fontWeight: 600,
                fontSize: isMobile ? 12 : 14
              }}
            >
              {usuarioLogado.nome}
            </Typography>
          </Box>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255,255,255,0.6)', 
              fontSize: isMobile ? 10 : 12,
              display: 'block',
              ml: 3
            }}
          >
            {usuarioLogado.email}
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <>
      {/* Botão de menu para mobile */}
      <IconButton
        color="primary"
        aria-label="open drawer"
        edge="start"
        onClick={() => setMobileOpen(true)}
        sx={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 1300,
          display: { xs: 'flex', md: 'none' },
          bgcolor: 'white',
          boxShadow: 3,
          borderRadius: 2,
          '&:hover': { bgcolor: 'grey.50' },
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* Drawer para desktop */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          display: { xs: 'none', md: 'block' },
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: 'primary.main',
            color: 'white',
            borderTopRightRadius: 24,
            borderBottomRightRadius: 24,
            p: 0,
            boxShadow: 3,
            position: 'fixed',
            height: '100vh',
            overflow: 'hidden',
            left: 0,
            top: 0,
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      {/* Drawer para mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: 'primary.main',
            color: 'white',
            borderTopRightRadius: 24,
            borderBottomRightRadius: 24,
            p: 0,
            boxShadow: 3,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
          <IconButton 
            onClick={() => setMobileOpen(false)} 
            color="inherit"
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.1)', 
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } 
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        {drawerContent}
      </Drawer>
    </>
  );
} 