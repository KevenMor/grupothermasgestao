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
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Cobranças e Pagamentos
        </Typography>
        <Tooltip title="Atualizar">
          <IconButton onClick={carregarCobrancas} color="primary">
            <RefreshCw />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Estatísticas */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, 
        gap: 3, 
        mb: 3 
      }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total
            </Typography>
            <Typography variant="h4">
              {stats.total}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Pendentes
            </Typography>
            <Typography variant="h4" color="warning.main">
              {stats.pendentes}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Pagas
            </Typography>
            <Typography variant="h4" color="success.main">
              {stats.pagas}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Vencidas
            </Typography>
            <Typography variant="h4" color="error.main">
              {stats.vencidas}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Canceladas
            </Typography>
            <Typography variant="h4" color="textSecondary">
              {stats.canceladas}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Tabela de Cobranças */}
      <Paper>
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