"use client";
import { useEffect, useState } from "react";
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
  CircularProgress, 
  Chip, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button, 
  Pagination, 
  Card, 
  CardContent, 
  Grid,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from "@mui/material";
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  Eye, 
  Calendar,
  User,
  Activity,
  Database,
  Clock
} from "lucide-react";
import BarChartIcon from '@mui/icons-material/BarChart';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import PaymentIcon from '@mui/icons-material/Payment';
import DescriptionIcon from '@mui/icons-material/Description';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SystemLog {
  id: number;
  user_id: string;
  user_email: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  description: string;
  old_values: any;
  new_values: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface LogStats {
  last24h: {
    actions: Record<string, number>;
    entities: Record<string, number>;
  };
}

export default function LogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    actionType: '',
    entityType: '',
    startDate: '',
    endDate: ''
  });

  // Modal para detalhes
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const actionTypes = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT'];
  const entityTypes = ['venda', 'dependente', 'usuario', 'cobranca', 'contrato'];

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'info';
      case 'DELETE': return 'error';
      case 'LOGIN': return 'primary';
      case 'LOGOUT': return 'warning';
      default: return 'default';
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'venda': return <AssignmentIcon sx={{ fontSize: 16 }} />;
      case 'dependente': return <PeopleIcon sx={{ fontSize: 16 }} />;
      case 'usuario': return <PersonIcon sx={{ fontSize: 16 }} />;
      case 'cobranca': return <PaymentIcon sx={{ fontSize: 16 }} />;
      case 'contrato': return <DescriptionIcon sx={{ fontSize: 16 }} />;
      default: return <BarChartIcon sx={{ fontSize: 16 }} />;
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...filters
      });

      const response = await fetch(`/api/logs?${params}`);
      const result = await response.json();

      if (response.ok) {
        setLogs(result.data);
        setTotalPages(result.pagination.totalPages);
        setTotal(result.pagination.total);
        setStats(result.stats);
      } else {
        console.error('Erro ao buscar logs:', result.error);
      }
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1); // Reset para primeira página
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      actionType: '',
      entityType: '',
      startDate: '',
      endDate: ''
    });
    setPage(1);
  };

  const exportLogs = async () => {
    try {
      const params = new URLSearchParams({
        ...filters,
        limit: '1000' // Exportar mais registros
      });

      const response = await fetch(`/api/logs?${params}`);
      const result = await response.json();

      if (response.ok) {
        const csvContent = [
          ['Data/Hora', 'Usuário', 'Ação', 'Entidade', 'ID', 'Descrição', 'IP'],
          ...result.data.map((log: SystemLog) => [
            format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }),
            log.user_email,
            log.action_type,
            log.entity_type,
            log.entity_id,
            log.description,
            log.ip_address
          ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs_sistema_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Erro ao exportar logs:', error);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '1400px', mx: 'auto' }}>
      <Typography variant="h4" fontWeight={700} mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'text.primary' }}>
        <BarChartIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        Logs do Sistema
      </Typography>

      {/* Estatísticas */}
      {stats && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Activity size={20} />
                  Ações nas últimas 24h
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(stats.last24h.actions).map(([action, count]) => (
                    <Chip
                      key={action}
                      label={`${action}: ${count}`}
                      color={getActionColor(action) as any}
                      size="small"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Database size={20} />
                  Entidades afetadas
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(stats.last24h.entities).map(([entity, count]) => (
                    <Chip
                      key={entity}
                      label={`${entity}: ${count}`}
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filtros */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Filter size={20} />
          Filtros
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Buscar"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Buscar por descrição ou usuário..."
              InputProps={{
                startAdornment: <Search size={20} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Ação</InputLabel>
              <Select
                value={filters.actionType}
                onChange={(e) => handleFilterChange('actionType', e.target.value)}
                label="Tipo de Ação"
              >
                <MenuItem value="">Todos</MenuItem>
                {actionTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Entidade</InputLabel>
              <Select
                value={filters.entityType}
                onChange={(e) => handleFilterChange('entityType', e.target.value)}
                label="Tipo de Entidade"
              >
                <MenuItem value="">Todas</MenuItem>
                {entityTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="date"
              label="Data Início"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="date"
              label="Data Fim"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={1}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Limpar filtros">
                <IconButton onClick={clearFilters} color="inherit">
                  <RefreshCw size={20} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Exportar logs">
                <IconButton onClick={exportLogs} color="primary">
                  <Download size={20} />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabela de Logs */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Histórico de Atividades ({total} registros)
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : logs.length > 0 ? (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Data/Hora</TableCell>
                    <TableCell>Usuário</TableCell>
                    <TableCell>Ação</TableCell>
                    <TableCell>Entidade</TableCell>
                    <TableCell>Descrição</TableCell>
                    <TableCell>IP</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(log.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(log.created_at), 'HH:mm:ss', { locale: ptBR })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {log.user_email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.action_type}
                          color={getActionColor(log.action_type) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getEntityIcon(log.entity_type)}
                          <Typography variant="body2">
                            {log.entity_type}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 300 }}>
                          {log.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {log.ip_address}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ver detalhes">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedLog(log);
                              setModalOpen(true);
                            }}
                          >
                            <Eye size={16} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Paginação */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              Nenhum log encontrado com os filtros aplicados.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Modal de Detalhes */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalhes do Log
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Data/Hora</Typography>
                  <Typography variant="body1">
                    {format(new Date(selectedLog.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Usuário</Typography>
                  <Typography variant="body1">{selectedLog.user_email}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Ação</Typography>
                  <Chip
                    label={selectedLog.action_type}
                    color={getActionColor(selectedLog.action_type) as any}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Entidade</Typography>
                  <Typography variant="body1">{selectedLog.entity_type}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Descrição</Typography>
                  <Typography variant="body1">{selectedLog.description}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">IP</Typography>
                  <Typography variant="body1">{selectedLog.ip_address}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">User Agent</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {selectedLog.user_agent}
                  </Typography>
                </Grid>
              </Grid>

              {(selectedLog.old_values || selectedLog.new_values) && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" mb={1}>Alterações</Typography>
                  <Grid container spacing={2}>
                    {selectedLog.old_values && (
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Valores Anteriores</Typography>
                        <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 200, overflow: 'auto' }}>
                          <pre style={{ margin: 0, fontSize: '0.8rem' }}>
                            {JSON.stringify(selectedLog.old_values, null, 2)}
                          </pre>
                        </Paper>
                      </Grid>
                    )}
                    {selectedLog.new_values && (
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Novos Valores</Typography>
                        <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 200, overflow: 'auto' }}>
                          <pre style={{ margin: 0, fontSize: '0.8rem' }}>
                            {JSON.stringify(selectedLog.new_values, null, 2)}
                          </pre>
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 