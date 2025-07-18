'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Modal,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Grid,
  Snackbar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

import { 
  RefreshCw, 
  Eye, 
  Download, 
  Copy, 
  MoreVertical, 
  FileText, 
  CreditCard, 
  QrCode,
  Send,
  Calendar,
  DollarSign,
  User,
  Mail,
  Phone,
  MapPin,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Ban
} from 'lucide-react';

interface Cobranca {
  id: string;
  customer: {
    object: string;
    id: string;
    dateCreated: string;
    name: string;
    email: string;
    company: string | null;
    phone: string;
    mobilePhone: string;
    address: string;
    addressNumber: string;
    complement: string | null;
    province: string;
    postalCode: string;
    cpfCnpj: string;
    personType: string;
    deleted: boolean;
    additionalEmails: string | null;
    externalReference: string | null;
    notificationDisabled: boolean;
    observations: string | null;
    municipalInscription: string | null;
    stateInscription: string | null;
    canDelete: boolean;
    cannotBeDeletedReason: string | null;
    canEdit: boolean;
    cannotEditReason: string | null;
    city: number;
    cityName: string;
    state: string;
    country: string;
  };
  subscription: string | null;
  installment: string | null;
  installmentNumber: number | null;
  installmentCount: number | null;
  installmentValue: number | null;
  installmentDescription: string | null;
  dueDate: string;
  endDate: string | null;
  value: number;
  netValue: number;
  originalValue: number | null;
  interestValue: number | null;
  description: string;
  billingType: string;
  status: string;
  pixTransaction: string | null;
  confirmedDate: string | null;
  paymentDate: string | null;
  clientPaymentDate: string | null;
  installmentId: string | null;
  refunded: boolean;
  refundedValue: number | null;
  refundedDate: string | null;
  chargeback: boolean;
  chargebackDate: string | null;
  chargebackValue: number | null;
  chargebackRefundedValue: number | null;
  chargebackRefundedDate: string | null;
  chargebackRefunded: boolean;
  discount: {
    value: number;
    dueDateLimitDays: number;
    type: string;
  } | null;
  fine: {
    value: number;
    type: string;
  } | null;
  interest: {
    value: number;
    type: string;
  } | null;
  postalService: boolean;
  split: unknown[] | null;
  externalReference: string | null;
  notificationDisabled: boolean;
  observations: string | null;
  margin: number | null;
  marginValue: number | null;
  originalDueDate: string | null;
  interestRate: number | null;
  interestRateValue: number | null;
  earlyPaymentDiscount: number | null;
  earlyPaymentDiscounts: unknown[] | null;
  bankSlipUrl: string | null;
  transactionReceiptUrl: string | null;
  invoiceUrl: string | null;
  dateCreated: string;
}

export default function CobrancasPageWrapper() {
  return (
    <Suspense fallback={<div>Carregando cobranças...</div>}>
      <CobrancasPage />
    </Suspense>
  );
}

function CobrancasPage() {
  const searchParams = useSearchParams();
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    pagas: 0,
    vencidas: 0,
    canceladas: 0,
  });

  // Estados para modal e ações
  const [selectedCobranca, setSelectedCobranca] = useState<Cobranca | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeCobrancaId, setActiveCobrancaId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Adicionar novo estado para modal de cadastro
  const [modalCadastroOpen, setModalCadastroOpen] = useState(false);

  const carregarCobrancas = async () => {
    try {
      setLoading(true);
      setError(null);

      // Pegar parâmetros da URL
      const vendaId = searchParams?.get('venda_id');
      const clienteId = searchParams?.get('cliente_id');

      // Construir URL com filtros
      let url = '/api/asaas/listar-cobrancas';
      const params = new URLSearchParams();
      
      if (vendaId) params.append('venda_id', vendaId);
      if (clienteId) params.append('cliente_id', clienteId);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      // Buscar cobranças do Asaas via API interna
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Erro ao buscar cobranças do Asaas');
      }

      const data = await response.json();
      setCobrancas(data.data || []);

      // Calcular estatísticas
      const stats = {
        total: data.data?.length || 0,
        pendentes: data.data?.filter((c: Cobranca) => c.status === 'PENDING')?.length || 0,
        pagas: data.data?.filter((c: Cobranca) => c.status === 'RECEIVED')?.length || 0,
        vencidas: data.data?.filter((c: Cobranca) => c.status === 'OVERDUE')?.length || 0,
        canceladas: data.data?.filter((c: Cobranca) => c.status === 'CANCELLED')?.length || 0,
      };
      setStats(stats);

    } catch (err) {
      console.error('Erro ao carregar cobranças:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarCobrancas();
  }, [searchParams]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'RECEIVED':
        return 'success';
      case 'OVERDUE':
        return 'error';
      case 'CANCELLED':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendente';
      case 'RECEIVED':
        return 'Pago';
      case 'OVERDUE':
        return 'Vencido';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Funções de ação
  const handleOpenModal = (cobranca: Cobranca) => {
    setSelectedCobranca(cobranca);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedCobranca(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, cobrancaId: string) => {
    setAnchorEl(event.currentTarget);
    setActiveCobrancaId(cobrancaId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setActiveCobrancaId(null);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSnackbar({
        open: true,
        message: `${label} copiado para a área de transferência!`,
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Erro ao copiar para a área de transferência',
        severity: 'error'
      });
    }
  };

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reenviarCobranca = async (cobrancaId: string) => {
    try {
      // Aqui você implementaria a lógica para reenviar a cobrança
      // Por enquanto, apenas simula o envio
      setSnackbar({
        open: true,
        message: 'Cobrança reenviada com sucesso!',
        severity: 'success'
      });
      handleMenuClose();
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Erro ao reenviar cobrança',
        severity: 'error'
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock size={16} />;
      case 'RECEIVED':
        return <CheckCircle size={16} />;
      case 'OVERDUE':
        return <AlertCircle size={16} />;
      case 'CANCELLED':
        return <Ban size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const getBillingTypeIcon = (billingType: string) => {
    switch (billingType) {
      case 'PIX':
        return <QrCode size={16} />;
      case 'CREDIT_CARD':
        return <CreditCard size={16} />;
      case 'BOLETO':
        return <FileText size={16} />;
      default:
        return <DollarSign size={16} />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', pl: 0, pr: 0 }}>
      <Box sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
            Cobranças e Pagamentos
          </Typography>
          <Box display="flex" gap={2}>
            <Tooltip title="Atualizar">
              <IconButton 
                onClick={carregarCobrancas} 
                color="primary"
                sx={{ 
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  width: { xs: 48, sm: 40 },
                  height: { xs: 48, sm: 40 }
                }}
              >
                <RefreshCw size={20} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Estatísticas */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' }, 
        gap: { xs: 2, sm: 3 }, 
        mb: 3 
      }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography color="textSecondary" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Total
            </Typography>
            <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
              {stats.total}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography color="textSecondary" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Pendentes
            </Typography>
            <Typography variant="h4" color="warning.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
              {stats.pendentes}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography color="textSecondary" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Pagas
            </Typography>
            <Typography variant="h4" color="success.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
              {stats.pagas}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography color="textSecondary" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Vencidas
            </Typography>
            <Typography variant="h4" color="error.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
              {stats.vencidas}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography color="textSecondary" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Canceladas
            </Typography>
            <Typography variant="h4" color="textSecondary" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
              {stats.canceladas}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Paper sx={{ borderRadius: 4, boxShadow: '0 2px 16px 0 rgba(0,0,0,0.04)' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Descrição</TableCell>
                  <TableCell>Valor</TableCell>
                  <TableCell>Vencimento</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Forma de Pagamento</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cobrancas.map((cobranca) => (
                  <TableRow key={cobranca.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {cobranca.customer?.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {cobranca.customer?.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {cobranca.description}
                      </Typography>
                      {cobranca.externalReference && (
                        <Typography variant="caption" color="textSecondary">
                          Ref: {cobranca.externalReference}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(cobranca.value)}
                      </Typography>
                      {cobranca.installmentCount && cobranca.installmentCount > 1 && (
                        <Typography variant="caption" color="textSecondary">
                          {cobranca.installmentNumber}/{cobranca.installmentCount} parcelas
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(cobranca.dueDate)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(cobranca.status)}
                        label={getStatusText(cobranca.status)}
                        color={getStatusColor(cobranca.status) as 'warning' | 'success' | 'error' | 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getBillingTypeIcon(cobranca.billingType)}
                        <Typography variant="body2">
                          {cobranca.billingType === 'PIX' ? 'PIX' : 
                           cobranca.billingType === 'CREDIT_CARD' ? 'Cartão de Crédito' :
                           cobranca.billingType === 'BOLETO' ? 'Boleto' : cobranca.billingType}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={1} justifyContent="center">
                        <Tooltip title="Ver detalhes">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenModal(cobranca)}
                            color="primary"
                          >
                            <Eye size={16} />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Mais ações">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, cobranca.id)}
                          >
                            <MoreVertical size={16} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {cobrancas.map((cobranca) => (
            <Paper
              key={cobranca.id}
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s ease',
                '&:hover': {
                  elevation: 4,
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                }
              }}
            >
              {/* Header do Card */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}>
                    {cobranca.customer?.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                    {cobranca.customer?.email}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenModal(cobranca)}
                    color="primary"
                    sx={{ 
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                      width: 36,
                      height: 36
                    }}
                  >
                    <Eye size={16} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, cobranca.id)}
                    sx={{ 
                      bgcolor: 'grey.200',
                      color: 'grey.700',
                      '&:hover': { bgcolor: 'grey.300' },
                      width: 36,
                      height: 36
                    }}
                  >
                    <MoreVertical size={16} />
                  </IconButton>
                </Box>
              </Box>

              {/* Informações da Cobrança */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 80 }}>
                    Descrição:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {cobranca.description}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 80 }}>
                    Valor:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {formatCurrency(cobranca.value)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 80 }}>
                    Vencimento:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formatDate(cobranca.dueDate)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 80 }}>
                    Status:
                  </Typography>
                  <Chip
                    icon={getStatusIcon(cobranca.status)}
                    label={getStatusText(cobranca.status)}
                    color={getStatusColor(cobranca.status) as 'warning' | 'success' | 'error' | 'default'}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 80 }}>
                    Pagamento:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getBillingTypeIcon(cobranca.billingType)}
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {cobranca.billingType === 'PIX' ? 'PIX' : 
                       cobranca.billingType === 'CREDIT_CARD' ? 'Cartão de Crédito' :
                       cobranca.billingType === 'BOLETO' ? 'Boleto' : cobranca.billingType}
                    </Typography>
                  </Box>
                </Box>

                {cobranca.installmentCount && cobranca.installmentCount > 1 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 80 }}>
                      Parcelas:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {cobranca.installmentNumber}/{cobranca.installmentCount}
                    </Typography>
                  </Box>
                )}

                {cobranca.externalReference && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 80 }}>
                      Referência:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {cobranca.externalReference}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* Menu de ações contextuais */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {activeCobrancaId && (() => {
          const cobranca = cobrancas.find(c => c.id === activeCobrancaId);
          if (!cobranca) return null;

          return (
            <>
              <MenuItem onClick={() => {
                copyToClipboard(cobranca.id, 'ID da cobrança');
                handleMenuClose();
              }}>
                <ListItemIcon>
                  <Copy size={16} />
                </ListItemIcon>
                <ListItemText>Copiar ID</ListItemText>
              </MenuItem>

              {cobranca.externalReference && (
                <MenuItem onClick={() => {
                  copyToClipboard(cobranca.externalReference!, 'Referência');
                  handleMenuClose();
                }}>
                  <ListItemIcon>
                    <Copy size={16} />
                  </ListItemIcon>
                  <ListItemText>Copiar referência</ListItemText>
                </MenuItem>
              )}

              {cobranca.bankSlipUrl && (
                <MenuItem onClick={() => {
                  window.open(cobranca.bankSlipUrl!, '_blank');
                  handleMenuClose();
                }}>
                  <ListItemIcon>
                    <FileText size={16} />
                  </ListItemIcon>
                  <ListItemText>Visualizar boleto</ListItemText>
                </MenuItem>
              )}

              {cobranca.transactionReceiptUrl && (
                <MenuItem onClick={() => {
                  downloadFile(cobranca.transactionReceiptUrl!, `recibo-${cobranca.id}.pdf`);
                  handleMenuClose();
                }}>
                  <ListItemIcon>
                    <Download size={16} />
                  </ListItemIcon>
                  <ListItemText>Baixar recibo</ListItemText>
                </MenuItem>
              )}

              {cobranca.invoiceUrl && (
                <MenuItem onClick={() => {
                  downloadFile(cobranca.invoiceUrl!, `fatura-${cobranca.id}.pdf`);
                  handleMenuClose();
                }}>
                  <ListItemIcon>
                    <Download size={16} />
                  </ListItemIcon>
                  <ListItemText>Baixar fatura</ListItemText>
                </MenuItem>
              )}

              {cobranca.status === 'PENDING' && (
                <MenuItem onClick={() => reenviarCobranca(cobranca.id)}>
                  <ListItemIcon>
                    <Send size={16} />
                  </ListItemIcon>
                  <ListItemText>Reenviar cobrança</ListItemText>
                </MenuItem>
              )}

              {cobranca.customer?.email && (
                <MenuItem onClick={() => {
                  copyToClipboard(cobranca.customer.email, 'Email do cliente');
                  handleMenuClose();
                }}>
                  <ListItemIcon>
                    <Mail size={16} />
                  </ListItemIcon>
                  <ListItemText>Copiar email</ListItemText>
                </MenuItem>
              )}
            </>
          );
        })()}
      </Menu>

      {/* Modal de detalhes */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        aria-labelledby="cobranca-details-modal"
        aria-describedby="cobranca-details-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '95%', sm: '80%', md: '70%' },
          maxWidth: 800,
          maxHeight: '90vh',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          overflow: 'auto'
        }}>
          {selectedCobranca && (
            <>
              <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h5" component="h2">
                    Detalhes da Cobrança
                  </Typography>
                  <IconButton onClick={handleCloseModal}>
                    <X />
                  </IconButton>
                </Box>
              </Box>

              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {/* Informações da Cobrança */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Informações da Cobrança
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        ID da Cobrança
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {selectedCobranca.id}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        Descrição
                      </Typography>
                      <Typography variant="body1">
                        {selectedCobranca.description}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        Valor
                      </Typography>
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        {formatCurrency(selectedCobranca.value)}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        Status
                      </Typography>
                      <Chip
                        icon={getStatusIcon(selectedCobranca.status)}
                        label={getStatusText(selectedCobranca.status)}
                        color={getStatusColor(selectedCobranca.status) as 'warning' | 'success' | 'error' | 'default'}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        Forma de Pagamento
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
                        {getBillingTypeIcon(selectedCobranca.billingType)}
                        <Typography variant="body1">
                          {selectedCobranca.billingType === 'PIX' ? 'PIX' : 
                           selectedCobranca.billingType === 'CREDIT_CARD' ? 'Cartão de Crédito' :
                           selectedCobranca.billingType === 'BOLETO' ? 'Boleto' : selectedCobranca.billingType}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Informações de Datas */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Datas
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        Data de Criação
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(selectedCobranca.dateCreated)}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        Data de Vencimento
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(selectedCobranca.dueDate)}
                      </Typography>
                    </Box>
                    {selectedCobranca.paymentDate && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          Data de Pagamento
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(selectedCobranca.paymentDate)}
                        </Typography>
                      </Box>
                    )}
                    {selectedCobranca.confirmedDate && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          Data de Confirmação
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(selectedCobranca.confirmedDate)}
                        </Typography>
                      </Box>
                    )}
                  </Grid>

                  {/* Informações do Cliente */}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Informações do Cliente
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="textSecondary">
                            Nome
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {selectedCobranca.customer?.name}
                          </Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="textSecondary">
                            Email
                          </Typography>
                          <Typography variant="body1">
                            {selectedCobranca.customer?.email}
                          </Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="textSecondary">
                            CPF/CNPJ
                          </Typography>
                          <Typography variant="body1">
                            {selectedCobranca.customer?.cpfCnpj}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="textSecondary">
                            Telefone
                          </Typography>
                          <Typography variant="body1">
                            {selectedCobranca.customer?.phone}
                          </Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="textSecondary">
                            Celular
                          </Typography>
                          <Typography variant="body1">
                            {selectedCobranca.customer?.mobilePhone}
                          </Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="textSecondary">
                            Cidade/Estado
                          </Typography>
                          <Typography variant="body1">
                            {selectedCobranca.customer?.cityName} - {selectedCobranca.customer?.state}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Links e Documentos */}
                  {(selectedCobranca.bankSlipUrl || selectedCobranca.transactionReceiptUrl || selectedCobranca.invoiceUrl) && (
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Documentos
                      </Typography>
                      <Box display="flex" gap={2} flexWrap="wrap">
                        {selectedCobranca.bankSlipUrl && (
                          <Button
                            variant="outlined"
                            startIcon={<FileText />}
                            onClick={() => window.open(selectedCobranca.bankSlipUrl!, '_blank')}
                          >
                            Visualizar Boleto
                          </Button>
                        )}
                        {selectedCobranca.transactionReceiptUrl && (
                          <Button
                            variant="outlined"
                            startIcon={<Download />}
                            onClick={() => downloadFile(selectedCobranca.transactionReceiptUrl!, `recibo-${selectedCobranca.id}.pdf`)}
                          >
                            Baixar Recibo
                          </Button>
                        )}
                        {selectedCobranca.invoiceUrl && (
                          <Button
                            variant="outlined"
                            startIcon={<Download />}
                            onClick={() => downloadFile(selectedCobranca.invoiceUrl!, `fatura-${selectedCobranca.id}.pdf`)}
                          >
                            Baixar Fatura
                          </Button>
                        )}
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>

              <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button onClick={handleCloseModal}>
                    Fechar
                  </Button>
                  {selectedCobranca.status === 'PENDING' && (
                    <Button
                      variant="contained"
                      startIcon={<Send />}
                      onClick={() => {
                        reenviarCobranca(selectedCobranca.id);
                        handleCloseModal();
                      }}
                    >
                      Reenviar Cobrança
                    </Button>
                  )}
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Modal>

      {/* Snackbar para notificações */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 