'use client';

import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box, Divider, IconButton, Typography } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PaymentIcon from '@mui/icons-material/Payment';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import Link from 'next/link';
import { useState } from 'react';

const drawerWidth = 256;
const menu = [
  { name: "Dashboard", href: "/", icon: <DashboardIcon /> },
  { name: "Gestão de Usuários", href: "/usuarios", icon: <PeopleIcon /> },
  { name: "Gestão de Vendas/Sócios", href: "/vendas", icon: <MonetizationOnIcon /> },
  { name: "Cobranças e Pagamentos", href: "/cobrancas", icon: <PaymentIcon /> },
  { name: "Futuro", href: "#", icon: <MoreHorizIcon /> },
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const drawerContent = (
    <>
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
      <List sx={{ mt: 2 }}>
        {menu.map((item) => (
          <ListItem key={item.name} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              component={Link}
              href={item.href}
              sx={{
                mx: 2,
                borderRadius: 3,
                py: 1.5,
                px: 2,
                '&:hover': { bgcolor: '#e3f2fd', color: 'primary.main' },
                transition: 'all 0.2s',
              }}
              onClick={() => setMobileOpen(false)}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.name} primaryTypographyProps={{ fontWeight: 500, fontSize: 16 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
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
          boxShadow: 2,
          borderRadius: 2,
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
            borderTopRightRadius: 32,
            borderBottomRightRadius: 32,
            p: 0,
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
            borderTopRightRadius: 32,
            borderBottomRightRadius: 32,
            p: 0,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
          <IconButton onClick={() => setMobileOpen(false)} color="inherit">
            <CloseIcon />
          </IconButton>
        </Box>
        {drawerContent}
      </Drawer>
    </>
  );
} 