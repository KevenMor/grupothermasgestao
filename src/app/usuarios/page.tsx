"use client";
import { useState, useEffect } from "react";
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, IconButton, Chip
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { supabase } from "@/lib/supabase";


type Usuario = {
  id: number;
  nome: string;
  email: string;
  senha: string;
  cargo: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busca, setBusca] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [form, setForm] = useState<Omit<Usuario, "id" | "created_at" | "updated_at">>({ 
    nome: "", 
    email: "", 
    senha: "", 
    cargo: "usuario",
    ativo: true
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "info" | "warning" | "error" }>({ open: false, message: "", severity: "success" });
  const [loading, setLoading] = useState(false);

  // Carregar usuários do Supabase
  async function carregarUsuarios() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setSnackbar({ open: true, message: "Erro ao carregar usuários", severity: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const usuariosFiltrados = usuarios.filter(u =>
    u.nome.toLowerCase().includes(busca.toLowerCase()) ||
    u.email.toLowerCase().includes(busca.toLowerCase()) ||
    u.cargo.toLowerCase().includes(busca.toLowerCase())
  );

  function abrirModal(usuario: Usuario | null = null) {
    setEditando(usuario);
    setForm(usuario ? { 
      nome: usuario.nome, 
      email: usuario.email, 
      senha: "", 
      cargo: usuario.cargo,
      ativo: usuario.ativo
    } : { 
      nome: "", 
      email: "", 
      senha: "", 
      cargo: "usuario",
      ativo: true
    });
    setModalOpen(true);
  }

  function fecharModal() {
    setModalOpen(false);
    setEditando(null);
  }

  async function salvarUsuario() {
    if (!form.nome || !form.email) {
      setSnackbar({ open: true, message: "Preencha todos os campos obrigatórios.", severity: "warning" });
      return;
    }

    if (!editando && !form.senha) {
      setSnackbar({ open: true, message: "Senha é obrigatória para novos usuários.", severity: "warning" });
      return;
    }

    try {
      setLoading(true);
      const dadosUsuario = {
        nome: form.nome,
        email: form.email,
        cargo: form.cargo,
        ativo: form.ativo
      };

      if (editando) {
        // Atualizar usuário existente
        const { error } = await supabase
          .from('usuarios')
          .update(dadosUsuario)
          .eq('id', editando.id);

        if (error) throw error;
        setSnackbar({ open: true, message: "Usuário editado com sucesso!", severity: "success" });
      } else {
        // Criar novo usuário
        const { error } = await supabase
          .from('usuarios')
          .insert([{ ...dadosUsuario, senha: form.senha }]);

        if (error) throw error;
        setSnackbar({ open: true, message: "Usuário cadastrado com sucesso!", severity: "success" });
      }

      await carregarUsuarios();
      fecharModal();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      setSnackbar({ open: true, message: "Erro ao salvar usuário", severity: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function excluirUsuario(id: number) {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSnackbar({ open: true, message: "Usuário excluído!", severity: "info" });
      await carregarUsuarios();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      setSnackbar({ open: true, message: "Erro ao excluir usuário", severity: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} mb={4} gap={2}>
        <Typography variant="h4" fontWeight={700}>Gestão de Usuários</Typography>
        <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 3, fontWeight: 600 }} onClick={() => abrirModal()}>
          Adicionar Usuário
        </Button>
      </Stack>
      <TextField
        label="Buscar usuário"
        variant="outlined"
        size="small"
        value={busca}
        onChange={e => setBusca(e.target.value)}
        sx={{ mb: 3, width: 320 }}
      />
      <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: '0 2px 16px 0 rgba(0,0,0,0.04)', mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'background.default' }}>
              <TableCell sx={{ fontWeight: 700 }}>Nome</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>E-mail</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Perfil</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuariosFiltrados.map((usuario) => (
              <TableRow key={usuario.id} hover sx={{ transition: 'background 0.2s', '&:hover': { bgcolor: 'grey.100' } }}>
                <TableCell>{usuario.nome}</TableCell>
                <TableCell>{usuario.email}</TableCell>
                <TableCell>
                  <Chip label={usuario.cargo} size="small" variant="outlined" color="info" />
                </TableCell>
                <TableCell>
                  <Chip label={usuario.ativo ? 'Ativo' : 'Inativo'} size="small" color={usuario.ativo ? 'success' : 'warning'} variant="filled" sx={{ fontWeight: 600 }} />
                </TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => abrirModal(usuario)} disabled={loading} sx={{ mr: 1 }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => excluirUsuario(usuario.id)} disabled={loading}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal de cadastro/edição */}
      <Dialog open={modalOpen} onClose={fecharModal} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 0, bgcolor: 'background.paper', boxShadow: 6 } }}>
        <DialogTitle sx={{ pb: 1, bgcolor: 'background.default', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
          {editando ? "Editar Usuário" : "Novo Usuário"}
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1, md: 4 }, bgcolor: 'background.paper', borderRadius: 4, boxShadow: 0 }}>
          <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, borderRadius: 4, boxShadow: 0, bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Campos do formulário */}
            </Box>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.default', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, p: 3 }}>
          <Button onClick={fecharModal} variant="outlined" color="secondary" sx={{ borderRadius: 3, fontWeight: 600, minWidth: 120 }}>Cancelar</Button>
          <Button onClick={salvarUsuario} variant="contained" color="primary" sx={{ borderRadius: 3, fontWeight: 700, minWidth: 180 }} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Usuário'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de feedback */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 