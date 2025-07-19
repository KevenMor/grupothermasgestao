"use client";
import { useState, useEffect } from "react";
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, MenuItem, IconButton, Chip, Card, CardContent, InputAdornment, CircularProgress
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import PeopleIcon from "@mui/icons-material/People";
import { supabase } from "@/lib/supabase";
import CepMask from '@/components/CepMask';
import { useRouter } from "next/navigation";
import ClearIcon from "@mui/icons-material/Clear";
import { usePermissions } from '@/hooks/usePermissions';
import PermissionGuard from '@/components/PermissionGuard';

type Cortesia = {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
  cidade: string;
  corretor: string;
  status: string;
  confirmada: boolean;
  data_confirmacao?: string;
  observacoes: string;
  created_at?: string;
};

const statusCortesia = ["ativa", "inativa", "utilizada"];

export default function CortesiasPage() {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [usuarioLogado, setUsuarioLogado] = useState<{ id: number; nome: string; email: string } | null>(null);
  const { temPermissao } = usePermissions(usuarioLogado?.id);
  const [form, setForm] = useState<Omit<Cortesia, "id" | "created_at">>({
    nome: "",
    cpf: "",
    telefone: "",
    cidade: "",
    corretor: "",
    status: "ativa",
    confirmada: false,
    observacoes: ""
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "info" | "warning" | "error" }>({ open: false, message: "", severity: "success" });
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState<Cortesia | null>(null);
  const [cortesias, setCortesias] = useState<Cortesia[]>([]);
  const [modalOpen, setModalOpen] = useState(false);


  // Carregar cortesias do Supabase
  async function carregarCortesias() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cortesias')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCortesias(data || []);
    } catch (error) {
      console.error('Erro ao carregar cortesias:', error);
      setSnackbar({ open: true, message: "Erro ao carregar cortesias", severity: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarCortesias();
    
    // Carregar dados do usuário logado
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('Usuário logado:', user);
        setUsuarioLogado(user);
        // Preencher automaticamente o corretor com o usuário logado
        setForm(prev => ({ ...prev, corretor: user.nome }));
        console.log('Campo corretor preenchido com:', user.nome);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    } else {
      console.log('Nenhum usuário encontrado no localStorage');
    }
  }, []);

  // Atualizar corretor sempre que o usuário logado mudar
  useEffect(() => {
    if (usuarioLogado?.nome) {
      setForm(prev => ({ ...prev, corretor: usuarioLogado.nome }));
      console.log('Corretor atualizado para:', usuarioLogado.nome);
    }
  }, [usuarioLogado]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    
    // Formatação automática para campos específicos
    if (name === 'nome') {
      setForm({ ...form, [name]: formatarNome(value) });
      return;
    }
    if (name === 'cidade') {
      setForm({ ...form, [name]: formatarNome(value) });
      return;
    }
    
    // Para CPF, aplicar formatação manual
    if (name === 'cpf') {
      const cpfLimpo = value.replace(/\D/g, '');
      if (cpfLimpo.length <= 11) {
        const cpfFormatado = cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        setForm({ ...form, [name]: cpfFormatado });
      }
      return;
    }
    
    // Para telefone, aplicar formatação manual
    if (name === 'telefone') {
      const telefoneLimpo = value.replace(/\D/g, '');
      if (telefoneLimpo.length <= 11) {
        // Formato: (11) 98765-4321 (9 dígitos + DDD)
        const telefoneFormatado = telefoneLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        setForm({ ...form, [name]: telefoneFormatado });
      }
      return;
    }
    
    setForm({ ...form, [name]: value });
  }

  async function confirmarCortesia(id: number) {
    if (!confirm('Confirmar que o cliente visitou o parque e validou na portaria?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('cortesias')
        .update({ 
          confirmada: true, 
          data_confirmacao: new Date().toISOString(),
          status: 'utilizada'
        })
        .eq('id', id);
      
      if (error) throw error;
      
      setSnackbar({ open: true, message: "Cortesia confirmada com sucesso!", severity: "success" });
      await carregarCortesias();
    } catch (error) {
      console.error('Erro ao confirmar cortesia:', error);
      setSnackbar({ open: true, message: "Erro ao confirmar cortesia", severity: "error" });
    } finally {
      setLoading(false);
    }
  }

  function formatarDataParaISO(data: string) {
    if (!data || !data.includes('/')) return data;
    const [dia, mes, ano] = data.split('/');
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }

  // Função para formatar nome com primeira letra maiúscula
  function formatarNome(nome: string): string {
    if (!nome) return '';
    return nome
      .toLowerCase()
      .split(' ')
      .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(' ');
  }

  // Função para formatar data no padrão DD/MM/AAAA
  function formatarDataParaBR(data: string): string {
    if (!data) return '';
    
    // Se já está no formato DD/MM/AAAA, retorna como está
    if (data.includes('/') && data.length === 10) {
      return data;
    }
    
    // Se está no formato ISO (YYYY-MM-DD), converte para DD/MM/AAAA
    if (data.includes('-') && !data.includes('T')) {
      const [ano, mes, dia] = data.split('-');
      if (ano && mes && dia) {
        return `${dia}/${mes}/${ano}`;
      }
    }
    
    return data;
  }



  async function salvarCortesia() {
    if (!form.nome || !form.cpf || !form.telefone || !form.cidade || !form.corretor) {
      setSnackbar({ open: true, message: "Preencha todos os campos obrigatórios.", severity: "warning" });
      return;
    }

    // Validação básica de CPF (deve ter 14 caracteres com máscara)
    if (form.cpf.replace(/\D/g, '').length !== 11) {
      setSnackbar({ open: true, message: "CPF deve ter 11 dígitos.", severity: "warning" });
      return;
    }

    // Validação básica de telefone (deve ter 11 dígitos com máscara)
    if (form.telefone.replace(/\D/g, '').length !== 11) {
      setSnackbar({ open: true, message: "Telefone deve ter 11 dígitos.", severity: "warning" });
      return;
    }

    // Verificar se o CPF já existe (exceto se estiver editando a mesma cortesia)
    const cpfLimpo = form.cpf.replace(/\D/g, '');
    const cortesiaExistente = cortesias.find(cortesia => {
      const cpfExistente = cortesia.cpf.replace(/\D/g, '');
      return cpfExistente === cpfLimpo && cortesia.id !== editando?.id;
    });

    if (cortesiaExistente) {
      setSnackbar({ 
        open: true, 
        message: `CPF já cadastrado para ${cortesiaExistente.nome}.`, 
        severity: "error" 
      });
      return;
    }

    try {
      setLoading(true);
      
      const dadosCortesia = {
        nome: formatarNome(form.nome),
        cpf: form.cpf.trim(),
        telefone: form.telefone.trim(),
        cidade: formatarNome(form.cidade),
        corretor: form.corretor,
        status: form.status,
        confirmada: false,
        observacoes: form.observacoes || null
      };

      let result;
      if (editando) {
        // Atualizar cortesia existente
        const { data, error } = await supabase
          .from('cortesias')
          .update(dadosCortesia)
          .eq('id', editando.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        
        // Não há dependentes no novo formato simplificado
        
        setSnackbar({ open: true, message: "Cortesia atualizada com sucesso!", severity: "success" });
      } else {
        // Criar nova cortesia
        const { data, error } = await supabase
          .from('cortesias')
          .insert(dadosCortesia)
          .select()
          .single();
        
        if (error) {
          // Verificar se é erro de CPF duplicado
          if (error.message.includes('duplicate') || error.message.includes('unique')) {
            setSnackbar({ 
              open: true, 
              message: "CPF já cadastrado no sistema.", 
              severity: "error" 
            });
            return;
          }
          throw error;
        }
        result = data;
        
        // Não há dependentes no novo formato simplificado
        
        setSnackbar({ open: true, message: "Cortesia criada com sucesso!", severity: "success" });
      }

      await carregarCortesias();
      fecharModal();
    } catch (error) {
      console.error('Erro ao salvar cortesia:', error);
      setSnackbar({ open: true, message: "Erro ao salvar cortesia", severity: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function excluirCortesia(id: number) {
    if (!confirm('Tem certeza que deseja excluir esta cortesia?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('cortesias')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setSnackbar({ open: true, message: "Cortesia excluída com sucesso!", severity: "success" });
      await carregarCortesias();
    } catch (error) {
      console.error('Erro ao excluir cortesia:', error);
      setSnackbar({ open: true, message: "Erro ao excluir cortesia", severity: "error" });
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string): "success" | "warning" | "error" | "info" | "default" {
    switch (status) {
      case 'ativa':
        return 'success';
      case 'inativa':
        return 'error';
      case 'utilizada':
        return 'warning';
      default:
        return 'default';
    }
  }

  function fecharModal() {
    setModalOpen(false);
    setEditando(null);
    setForm({
      nome: "",
      cpf: "",
      telefone: "",
      cidade: "",
      corretor: usuarioLogado?.nome || "",
      status: "ativa",
      confirmada: false,
      observacoes: ""
    });
  }

  function abrirModal(cortesia: Cortesia | null = null) {
    if (cortesia) {
      setEditando(cortesia);
      setForm({
        nome: cortesia.nome,
        cpf: cortesia.cpf || "",
        telefone: cortesia.telefone || "",
        cidade: cortesia.cidade || "",
        corretor: cortesia.corretor,
        status: cortesia.status,
        confirmada: cortesia.confirmada || false,
        observacoes: cortesia.observacoes || ""
      });
    } else {
      setEditando(null);
      setForm({
        nome: "",
        cpf: "",
        telefone: "",
        cidade: "",
        corretor: usuarioLogado?.nome || "",
        status: "ativa",
        confirmada: false,
        observacoes: ""
      });
    }
    setModalOpen(true);
  }



  // Filtrar cortesias baseado na busca
  const cortesiasFiltradas = cortesias.filter(cortesia =>
    cortesia.nome.toLowerCase().includes(busca.toLowerCase()) ||
    cortesia.cpf?.includes(busca) ||
    cortesia.telefone?.includes(busca) ||
    cortesia.cidade?.toLowerCase().includes(busca.toLowerCase()) ||
    cortesia.corretor.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <Box sx={{ p: 3, maxWidth: '100%', mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CardGiftcardIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Cortesias
          </Typography>
        </Box>
        
        <PermissionGuard funcionalidade="cortesias" acao="criar" usuarioId={usuarioLogado?.id} fallback={null}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => abrirModal()}
            disabled={loading}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem'
            }}
          >
            Nova Cortesia
          </Button>
        </PermissionGuard>
      </Box>

      {/* Busca */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar por nome, CPF, telefone, cidade ou corretor..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PeopleIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: busca && (
              <InputAdornment position="end">
                <IconButton onClick={() => setBusca("")} size="small">
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: 'background.paper'
            }
          }}
        />
      </Box>

      {/* Tabela Desktop */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <Table sx={{ minWidth: 'auto', width: '100%' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '1rem', pl: 3, pr: 1 }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '1rem', px: 1 }}>CPF</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '1rem', px: 1 }}>Telefone</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '1rem', px: 1 }}>Cidade</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '1rem', px: 1 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '1rem', display: { xs: 'none', lg: 'table-cell' }, px: 1 }}>Corretor</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1rem', pr: 3, pl: 1 }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cortesiasFiltradas.map((cortesia) => (
                <TableRow key={cortesia.id} hover sx={{ transition: 'background 0.2s', '&:hover': { bgcolor: 'grey.50' } }}>
                  <TableCell sx={{ fontSize: '1rem', pl: 3, pr: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                      {cortesia.nome}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '1rem', px: 1 }}>
                    {cortesia.cpf}
                  </TableCell>
                  <TableCell sx={{ fontSize: '1rem', px: 1 }}>
                    {cortesia.telefone}
                  </TableCell>
                  <TableCell sx={{ fontSize: '1rem', px: 1 }}>
                    {cortesia.cidade}
                  </TableCell>
                  <TableCell sx={{ fontSize: '1rem', px: 1 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Chip
                        label={cortesia.status} 
                        size="small" 
                        color={getStatusColor(cortesia.status)}
                        variant="filled"
                        sx={{ fontWeight: 600 }}
                      />
                      {cortesia.confirmada && (
                        <Chip
                          label="Confirmada" 
                          size="small" 
                          color="success"
                          variant="outlined"
                          sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '1rem', display: { xs: 'none', lg: 'table-cell' }, px: 1 }}>{cortesia.corretor}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '1rem', pr: 3, pl: 1 }}>
                    {!cortesia.confirmada && (
                      <IconButton 
                        color="success" 
                        onClick={() => confirmarCortesia(cortesia.id)} 
                        disabled={loading} 
                        sx={{ mr: 1 }}
                        title="Confirmar visita"
                      >
                        <CheckCircleIcon />
                      </IconButton>
                    )}
                    <PermissionGuard funcionalidade="cortesias" acao="editar" usuarioId={usuarioLogado?.id} fallback={null}>
                      <IconButton color="primary" onClick={() => abrirModal(cortesia)} disabled={loading} sx={{ mr: 1 }}>
                        <EditIcon />
                      </IconButton>
                    </PermissionGuard>
                    <PermissionGuard funcionalidade="cortesias" acao="excluir" usuarioId={usuarioLogado?.id} fallback={null}>
                      <IconButton color="error" onClick={() => excluirCortesia(cortesia.id)} disabled={loading}>
                        <DeleteIcon />
                      </IconButton>
                    </PermissionGuard>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Mobile: Cards modernos */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, px: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {cortesiasFiltradas.map((cortesia) => (
            <Card 
              key={cortesia.id} 
              sx={{ 
                borderRadius: 4,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid rgba(0,0,0,0.08)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                {/* Header do card */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 0.5 }}>
                      {cortesia.nome}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {cortesia.cpf}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {cortesia.telefone}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {cortesia.cidade}
                    </Typography>
                  </Box>
                  <Chip 
                    label={cortesia.status} 
                    size="small" 
                    color={getStatusColor(cortesia.status)}
                    variant="filled"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>

                {/* Informações adicionais */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Corretor:</strong> {cortesia.corretor}
                  </Typography>
                  {cortesia.confirmada && (
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                      ✓ Confirmada na portaria
                    </Typography>
                  )}
                </Box>

                {/* Ações */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  {!cortesia.confirmada && (
                    <IconButton 
                      color="success" 
                      onClick={() => confirmarCortesia(cortesia.id)} 
                      disabled={loading}
                      size="small"
                      title="Confirmar visita"
                    >
                      <CheckCircleIcon />
                    </IconButton>
                  )}
                  <PermissionGuard funcionalidade="cortesias" acao="editar" usuarioId={usuarioLogado?.id} fallback={null}>
                    <IconButton 
                      color="primary" 
                      onClick={() => abrirModal(cortesia)} 
                      disabled={loading}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                  </PermissionGuard>
                  <PermissionGuard funcionalidade="cortesias" acao="excluir" usuarioId={usuarioLogado?.id} fallback={null}>
                    <IconButton 
                      color="error" 
                      onClick={() => excluirCortesia(cortesia.id)} 
                      disabled={loading}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </PermissionGuard>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>

      {/* Modal de Cadastro/Edição */}
      <Dialog 
        open={modalOpen} 
        onClose={fecharModal} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            maxHeight: '90vh',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.05)'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          borderRadius: '12px 12px 0 0'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            color: 'white'
          }}>
            <CardGiftcardIcon sx={{ fontSize: 24 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {editando ? 'Editar Cortesia' : 'Nova Cortesia'}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Dados da Cortesia */}
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                <CardGiftcardIcon sx={{ fontSize: 24 }} />
                Dados da Cortesia
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <TextField
                  name="nome"
                  label="Nome Completo *"
                  value={form.nome}
                  onChange={handleChange}
                  fullWidth
                  required
                  sx={{ 
                    gridColumn: { xs: '1', md: '1 / -1' },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: 'background.paper',
                      '&:hover': {
                        backgroundColor: 'grey.50'
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white'
                      }
                    }
                  }}
                />
                <TextField
                  name="cpf"
                  label="CPF *"
                  value={form.cpf}
                  onChange={handleChange}
                  fullWidth
                  required
                  placeholder="000.000.000-00"
                  inputProps={{
                    maxLength: 14
                  }}
                  error={(() => {
                    if (!form.cpf || form.cpf.replace(/\D/g, '').length !== 11) return false;
                    const cpfLimpo = form.cpf.replace(/\D/g, '');
                    const cortesiaExistente = cortesias.find(cortesia => {
                      const cpfExistente = cortesia.cpf.replace(/\D/g, '');
                      return cpfExistente === cpfLimpo && cortesia.id !== editando?.id;
                    });
                    return !!cortesiaExistente;
                  })()}
                  helperText={(() => {
                    if (!form.cpf || form.cpf.replace(/\D/g, '').length !== 11) return '';
                    const cpfLimpo = form.cpf.replace(/\D/g, '');
                    const cortesiaExistente = cortesias.find(cortesia => {
                      const cpfExistente = cortesia.cpf.replace(/\D/g, '');
                      return cpfExistente === cpfLimpo && cortesia.id !== editando?.id;
                    });
                    return cortesiaExistente ? `CPF já cadastrado para ${cortesiaExistente.nome}` : '';
                  })()}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: 'background.paper',
                      '&:hover': {
                        backgroundColor: 'grey.50'
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white'
                      }
                    }
                  }}
                />
                <TextField
                  name="telefone"
                  label="Telefone *"
                  value={form.telefone}
                  onChange={handleChange}
                  fullWidth
                  required
                  placeholder="(00) 00000-0000"
                  inputProps={{
                    maxLength: 15
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: 'background.paper',
                      '&:hover': {
                        backgroundColor: 'grey.50'
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white'
                      }
                    }
                  }}
                />
                <TextField
                  name="cidade"
                  label="Cidade *"
                  value={form.cidade}
                  onChange={handleChange}
                  fullWidth
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: 'background.paper',
                      '&:hover': {
                        backgroundColor: 'grey.50'
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white'
                      }
                    }
                  }}
                />
                <TextField
                  name="corretor"
                  label="Corretor *"
                  value={form.corretor}
                  onChange={handleChange}
                  fullWidth
                  required
                  disabled
                  sx={{ 
                    gridColumn: { xs: '1', md: '1 / -1' },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: 'grey.100',
                      '&.Mui-disabled': {
                        backgroundColor: 'grey.100',
                        color: 'text.primary'
                      }
                    }
                  }}
                  helperText="Preenchido automaticamente com o usuário logado"
                />
                <TextField
                  name="status"
                  label="Status"
                  select
                  value={form.status}
                  onChange={handleChange}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: 'background.paper',
                      '&:hover': {
                        backgroundColor: 'grey.50'
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white'
                      }
                    }
                  }}
                >
                  {statusCortesia.map((status) => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  name="observacoes"
                  label="Observações"
                  multiline
                  rows={4}
                  value={form.observacoes}
                  onChange={handleChange}
                  fullWidth
                  placeholder="Digite observações adicionais sobre a cortesia..."
                  sx={{ 
                    gridColumn: { xs: '1', md: '1 / -1' },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: 'background.paper',
                      '&:hover': {
                        backgroundColor: 'grey.50'
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white'
                      }
                    }
                  }}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1, gap: 2 }}>
          <Button 
            onClick={fecharModal} 
            variant="outlined"
            sx={{ 
              borderRadius: 3,
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: 'grey.300',
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'grey.400',
                backgroundColor: 'grey.50'
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={salvarCortesia} 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
            sx={{ 
              borderRadius: 3,
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              boxShadow: '0 3px 5px 2px rgba(25, 118, 210, .3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                boxShadow: '0 3px 7px 2px rgba(25, 118, 210, .4)'
              }
            }}
          >
            {loading ? 'Salvando...' : (editando ? 'Atualizar' : 'Criar Cortesia')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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