"use client";
import { useState, useEffect } from "react";
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, IconButton, Chip, Accordion, AccordionSummary, AccordionDetails, FormControlLabel, Checkbox, Divider
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
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
  const [funcionalidades, setFuncionalidades] = useState<any[]>([]);
  const [permissoesForm, setPermissoesForm] = useState<{[key: number]: any}>({});

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
    carregarFuncionalidades();
  }, []);

  // Carregar funcionalidades do Supabase
  async function carregarFuncionalidades() {
    try {
      const { data, error } = await supabase
        .from('funcionalidades')
        .select('*')
        .eq('ativo', true)
        .order('ordem');

      if (error) throw error;
      setFuncionalidades(data || []);
    } catch (error) {
      console.error('Erro ao carregar funcionalidades:', error);
    }
  }

  const usuariosFiltrados = usuarios.filter(u =>
    u.nome.toLowerCase().includes(busca.toLowerCase()) ||
    u.email.toLowerCase().includes(busca.toLowerCase()) ||
    u.cargo.toLowerCase().includes(busca.toLowerCase())
  );

  async function abrirModal(usuario: Usuario | null = null) {
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
    
    // Carregar permissões se for edição
    if (usuario) {
      await carregarPermissoesUsuario(usuario.id);
    } else {
      // Limpar permissões para novo usuário
      setPermissoesForm({});
    }
    
    setModalOpen(true);
  }

  // Carregar permissões do usuário
  async function carregarPermissoesUsuario(usuarioId: number) {
    try {
      const { data, error } = await supabase
        .from('permissoes_usuarios')
        .select('*')
        .eq('usuario_id', usuarioId);

      if (error) throw error;

      const permissoesIniciais: {[key: number]: any} = {};
      
      // Inicializar todas as funcionalidades com permissões padrão
      funcionalidades.forEach(func => {
        const permissaoExistente = data?.find(p => p.funcionalidade_id === func.id);
        permissoesIniciais[func.id] = {
          pode_visualizar: permissaoExistente?.pode_visualizar || false,
          pode_criar: permissaoExistente?.pode_criar || false,
          pode_editar: permissaoExistente?.pode_editar || false,
          pode_excluir: permissaoExistente?.pode_excluir || false,
          pode_exportar: permissaoExistente?.pode_exportar || false,
        };
      });

      setPermissoesForm(permissoesIniciais);
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
    }
  }

  function fecharModal() {
    setModalOpen(false);
    setEditando(null);
    setPermissoesForm({});
  }

  // Funções para gerenciar permissões
  const handlePermissaoChange = (funcionalidadeId: number, acao: string, valor: boolean) => {
    setPermissoesForm(prev => ({
      ...prev,
      [funcionalidadeId]: {
        ...prev[funcionalidadeId],
        [acao]: valor
      }
    }));
  };

  const handleSelectAll = (categoria: string, valor: boolean) => {
    const funcionalidadesCategoria = funcionalidades.filter(f => f.categoria === categoria);
    
    setPermissoesForm(prev => {
      const novo = { ...prev };
      funcionalidadesCategoria.forEach(func => {
        if (novo[func.id]) {
          novo[func.id] = {
            ...novo[func.id],
            pode_visualizar: valor,
            pode_criar: valor,
            pode_editar: valor,
            pode_excluir: valor,
            pode_exportar: valor,
          };
        }
      });
      return novo;
    });
  };

  const getIconePermissao = (acao: string) => {
    switch (acao) {
      case 'pode_visualizar': return <VisibilityIcon fontSize="small" />;
      case 'pode_criar': return <AddIcon fontSize="small" />;
      case 'pode_editar': return <EditIcon fontSize="small" />;
      case 'pode_excluir': return <DeleteIcon fontSize="small" />;
      case 'pode_exportar': return <DownloadIcon fontSize="small" />;
      default: return null;
    }
  };

  const getLabelPermissao = (acao: string) => {
    switch (acao) {
      case 'pode_visualizar': return 'Visualizar';
      case 'pode_criar': return 'Criar';
      case 'pode_editar': return 'Editar';
      case 'pode_excluir': return 'Excluir';
      case 'pode_exportar': return 'Exportar';
      default: return acao;
    }
  };

  const agruparPorCategoria = () => {
    const grupos: { [categoria: string]: any[] } = {};
    funcionalidades.forEach(func => {
      if (!grupos[func.categoria]) {
        grupos[func.categoria] = [];
      }
      grupos[func.categoria].push(func);
    });
    return grupos;
  };

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

      let usuarioId: number;

      if (editando) {
        // Atualizar usuário existente
        const { error } = await supabase
          .from('usuarios')
          .update(dadosUsuario)
          .eq('id', editando.id);

        if (error) throw error;
        usuarioId = editando.id;
        setSnackbar({ open: true, message: "Usuário editado com sucesso!", severity: "success" });
      } else {
        // Criar novo usuário
        const { data, error } = await supabase
          .from('usuarios')
          .insert([{ ...dadosUsuario, senha: form.senha }])
          .select('id')
          .single();

        if (error) throw error;
        usuarioId = data.id;
        setSnackbar({ open: true, message: "Usuário cadastrado com sucesso!", severity: "success" });
      }

      // Salvar permissões
      if (usuarioId && Object.keys(permissoesForm).length > 0) {
        const permissoesParaSalvar = Object.entries(permissoesForm).map(([funcionalidadeId, permissoes]) => ({
          usuario_id: usuarioId,
          funcionalidade_id: parseInt(funcionalidadeId),
          ...permissoes,
          updated_at: new Date().toISOString()
        }));

        const { error: permissaoError } = await supabase
          .from('permissoes_usuarios')
          .upsert(permissoesParaSalvar, {
            onConflict: 'usuario_id,funcionalidade_id'
          });

        if (permissaoError) {
          console.error('Erro ao salvar permissões:', permissaoError);
          setSnackbar({ open: true, message: "Usuário salvo, mas erro ao salvar permissões", severity: "warning" });
        }
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
    <Box sx={{ width: '100%', height: '100%', pl: 0, pr: 0 }}>
      <Box sx={{ mb: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} mb={2} gap={2}>
          <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>Gestão de Usuários</Typography>
          <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 3, fontWeight: 600, minWidth: { xs: '100%', sm: 'auto' }, height: { xs: 48, sm: 40 } }} onClick={() => abrirModal()}>
            + Adicionar Usuário
          </Button>
        </Stack>
        <TextField
          label="Buscar usuário"
          variant="outlined"
          size="small"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          sx={{ 
            mb: 3, 
            width: { xs: '100%', sm: 320 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              height: { xs: 48, sm: 40 }
            }
          }}
        />
      </Box>

      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
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
                    <IconButton 
                      color="primary" 
                      onClick={() => abrirModal(usuario)} 
                      disabled={loading} 
                      sx={{ mr: 1 }}
                      title="Editar usuário"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => excluirUsuario(usuario.id)} 
                      disabled={loading}
                      title="Excluir usuário"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {usuariosFiltrados.map((usuario) => (
            <Paper
              key={usuario.id}
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
                    {usuario.nome}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                    {usuario.email}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton 
                    color="primary" 
                    onClick={() => abrirModal(usuario)} 
                    disabled={loading}
                    size="small"
                    sx={{ 
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                      width: 36,
                      height: 36
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    color="error" 
                    onClick={() => excluirUsuario(usuario.id)} 
                    disabled={loading}
                    size="small"
                    sx={{ 
                      bgcolor: 'error.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'error.dark' },
                      width: 36,
                      height: 36
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {/* Informações do Usuário */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 60 }}>
                    Perfil:
                  </Typography>
                  <Chip 
                    label={usuario.cargo} 
                    size="small" 
                    variant="outlined" 
                    color="info"
                    sx={{ fontWeight: 500 }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 60 }}>
                    Status:
                  </Typography>
                  <Chip 
                    label={usuario.ativo ? 'Ativo' : 'Inativo'} 
                    size="small" 
                    color={usuario.ativo ? 'success' : 'warning'} 
                    variant="filled" 
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* Modal de cadastro/edição */}
      <Dialog open={modalOpen} onClose={fecharModal} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 0, bgcolor: 'background.paper', boxShadow: 6 } }}>
        <DialogTitle sx={{ pb: 1, bgcolor: 'background.default', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
          {editando ? "Editar Usuário" : "Novo Usuário"}
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1, md: 4 }, bgcolor: 'background.paper', borderRadius: 4, boxShadow: 0 }}>
          <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, borderRadius: 4, boxShadow: 0, bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Nome */}
              <TextField
                label="Nome Completo"
                name="nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                fullWidth
                required
                variant="filled"
              />
              
              {/* Email */}
              <TextField
                label="E-mail"
                name="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                fullWidth
                required
                variant="filled"
              />
              
              {/* Senha (só para novos usuários) */}
              {!editando && (
                <TextField
                  label="Senha"
                  name="senha"
                  type="password"
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                  fullWidth
                  required
                  variant="filled"
                />
              )}
              
              {/* Cargo */}
              <TextField
                select
                label="Cargo"
                name="cargo"
                value={form.cargo}
                onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                fullWidth
                required
                variant="filled"
              >
                <option value="admin">Administrador</option>
                <option value="usuario">Usuário</option>
                <option value="vendedor">Vendedor</option>
              </TextField>
              
              {/* Status */}
              <TextField
                select
                label="Status"
                name="ativo"
                value={form.ativo ? "true" : "false"}
                onChange={(e) => setForm({ ...form, ativo: e.target.value === "true" })}
                fullWidth
                required
                variant="filled"
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </TextField>
            </Box>

            {/* Seção de Permissões */}
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Permissões de Acesso
            </Typography>
            
            {funcionalidades.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Nenhuma funcionalidade encontrada. Verifique se as funcionalidades foram configuradas no banco de dados.
              </Typography>
            ) : (
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {Object.entries(agruparPorCategoria()).map(([categoria, funcionalidades]) => (
                  <Accordion key={categoria} defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Typography variant="subtitle1" sx={{ flexGrow: 1, textTransform: 'capitalize' }}>
                          {categoria === 'menu' ? 'Menus' : 
                           categoria === 'acao' ? 'Ações' : 
                           categoria === 'relatorio' ? 'Relatórios' : categoria}
                        </Typography>
                        <Chip 
                          label={`${funcionalidades.length} funcionalidades`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAll(categoria, true);
                          }}
                          sx={{ ml: 1 }}
                        >
                          Selecionar Todos
                        </Button>
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAll(categoria, false);
                          }}
                        >
                          Limpar Todos
                        </Button>
                      </Box>
                    </AccordionSummary>
                    
                    <AccordionDetails>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {funcionalidades.map((funcionalidade) => (
                          <Box key={funcionalidade.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                              {funcionalidade.descricao}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {funcionalidade.rota}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                              {['pode_visualizar', 'pode_criar', 'pode_editar', 'pode_excluir', 'pode_exportar'].map((acao) => (
                                <FormControlLabel
                                  key={acao}
                                  control={
                                    <Checkbox
                                      checked={permissoesForm[funcionalidade.id]?.[acao] || false}
                                      onChange={(e) => handlePermissaoChange(funcionalidade.id, acao, e.target.checked)}
                                      size="small"
                                    />
                                  }
                                  label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      {getIconePermissao(acao)}
                                      <Typography variant="body2">
                                        {getLabelPermissao(acao)}
                                      </Typography>
                                    </Box>
                                  }
                                />
                              ))}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}
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