import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { Security, Home } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  funcionalidade: string;
  acao: 'visualizar' | 'criar' | 'editar' | 'excluir' | 'exportar';
  usuarioId?: number;
  fallback?: React.ReactNode;
}

export default function PermissionGuard({ 
  children, 
  funcionalidade, 
  acao, 
  usuarioId,
  fallback 
}: PermissionGuardProps) {
  const { temPermissao } = usePermissions(usuarioId);
  const router = useRouter();

  // Se não tem usuário ID, permitir acesso (para casos onde ainda não carregou)
  if (!usuarioId) {
    return <>{children}</>;
  }

  // Verificar se tem permissão
  const temAcesso = temPermissao(funcionalidade, acao);

  if (!temAcesso) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          p: 4,
          textAlign: 'center',
        }}
      >
        <Security
          sx={{
            fontSize: 80,
            color: 'warning.main',
            mb: 3,
          }}
        />
        
        <Typography variant="h4" fontWeight={700} color="text.primary" mb={2}>
          Acesso Negado
        </Typography>
        
        <Typography variant="body1" color="text.secondary" mb={3} maxWidth={500}>
          Você não tem permissão para acessar esta funcionalidade. 
          Entre em contato com o administrador do sistema para solicitar acesso.
        </Typography>

        <Alert severity="warning" sx={{ mb: 3, maxWidth: 500 }}>
          <Typography variant="body2">
            <strong>Funcionalidade:</strong> {funcionalidade}<br />
            <strong>Ação:</strong> {acao}
          </Typography>
        </Alert>

        <Button
          variant="contained"
          startIcon={<Home />}
          onClick={() => router.push('/dashboard')}
          sx={{ borderRadius: 3, fontWeight: 600 }}
        >
          Voltar ao Dashboard
        </Button>
      </Box>
    );
  }

  return <>{children}</>;
} 