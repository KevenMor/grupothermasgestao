import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore,
  Security,
  Visibility,
  Add,
  Edit,
  Delete,
  Download,
  Check,
  Close
} from '@mui/icons-material';
import { usePermissions, Funcionalidade } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  cargo: string;
  ativo: boolean;
}

interface PermissoesModalProps {
  open: boolean;
  onClose: () => void;
  usuario: Usuario | null;
}

interface PermissaoForm {
  [funcionalidadeId: number]: {
    pode_visualizar: boolean;
    pode_criar: boolean;
    pode_editar: boolean;
    pode_excluir: boolean;
    pode_exportar: boolean;
  };
}

export default function PermissoesModal({ open, onClose, usuario }: PermissoesModalProps) {
  console.log('PermissoesModal renderizado:', { open, usuario });
  const { funcionalidades, loading, salvarPermissoesUsuario } = usePermissions();
  const [permissoesForm, setPermissoesForm] = useState<PermissaoForm>({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  // Carregar permissões atuais do usuário
  useEffect(() => {
    console.log('useEffect do modal:', { open, usuario });
    if (open && usuario) {
      carregarPermissoesUsuario();
    } else if (open && !usuario) {
      console.error('Modal aberto mas usuário não selecionado');
    } else if (!open) {
      console.log('Modal fechado');
    }
  }, [open, usuario]);

  const carregarPermissoesUsuario = async () => {
    console.log('Carregando permissões para usuário:', usuario);
    if (!usuario) {
      console.error('Usuário não selecionado para carregar permissões');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('permissoes_usuarios')
        .select('*')
        .eq('usuario_id', usuario.id);

      if (error) throw error;

      const permissoesIniciais: PermissaoForm = {};
      
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
    } catch (err) {
      console.error('Erro ao carregar permissões:', err);
      setErro('Erro ao carregar permissões do usuário');
    }
  };

  const handlePermissaoChange = (funcionalidadeId: number, acao: string, valor: boolean) => {
    setPermissoesForm(prev => ({
      ...prev,
      [funcionalidadeId]: {
        ...prev[funcionalidadeId],
        [acao]: valor
      }
    }));
  };

  const handleSalvar = async () => {
    console.log('Tentando salvar permissões para usuário:', usuario);
    if (!usuario) {
      console.error('Usuário não selecionado');
      setErro('Usuário não selecionado');
      return;
    }

    setSalvando(true);
    setErro(null);
    setSucesso(false);

    try {
      const permissoesParaSalvar = Object.entries(permissoesForm).map(([funcionalidadeId, permissoes]) => ({
        usuario_id: usuario.id,
        funcionalidade_id: parseInt(funcionalidadeId),
        ...permissoes,
        updated_at: new Date().toISOString()
      }));

      const sucesso = await salvarPermissoesUsuario(usuario.id, permissoesParaSalvar);
      
      if (sucesso) {
        setSucesso(true);
        setTimeout(() => {
          onClose();
          setSucesso(false);
        }, 2000);
      } else {
        setErro('Erro ao salvar permissões');
      }
    } catch (err) {
      console.error('Erro ao salvar permissões:', err);
      setErro('Erro ao salvar permissões');
    } finally {
      setSalvando(false);
    }
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
      case 'pode_visualizar': return <Visibility fontSize="small" />;
      case 'pode_criar': return <Add fontSize="small" />;
      case 'pode_editar': return <Edit fontSize="small" />;
      case 'pode_excluir': return <Delete fontSize="small" />;
      case 'pode_exportar': return <Download fontSize="small" />;
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
    const grupos: { [categoria: string]: Funcionalidade[] } = {};
    funcionalidades.forEach(func => {
      if (!grupos[func.categoria]) {
        grupos[func.categoria] = [];
      }
      grupos[func.categoria].push(func);
    });
    return grupos;
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth sx={{ zIndex: 9999 }}>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth 
      sx={{ zIndex: 9999 }}
      container={() => document.body}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Security color="primary" />
        <Typography variant="h6">
          Gerenciar Permissões - {usuario?.nome || 'Usuário não selecionado'}
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {erro && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {erro}
          </Alert>
        )}

        {sucesso && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Permissões salvas com sucesso!
          </Alert>
        )}

        {!usuario ? (
          <Alert severity="error">
            Nenhum usuário selecionado.
          </Alert>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configure as permissões de acesso para o usuário {usuario.nome} ({usuario.email})
            </Typography>

            <Box sx={{ maxHeight: 500, overflowY: 'auto' }}>
              {funcionalidades.length === 0 ? (
                <Alert severity="info">
                  Nenhuma funcionalidade encontrada. Verifique se as funcionalidades foram configuradas no banco de dados.
                </Alert>
              ) : (
                Object.entries(agruparPorCategoria()).map(([categoria, funcionalidades]) => (
            <Accordion key={categoria} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Typography variant="h6" sx={{ flexGrow: 1, textTransform: 'capitalize' }}>
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
                      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
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
                                checked={permissoesForm[funcionalidade.id]?.[acao as keyof typeof permissoesForm[number]] || false}
                                onChange={(e) => handlePermissaoChange(funcionalidade.id, acao, e.target.checked)}
                                icon={getIconePermissao(acao)}
                                checkedIcon={<Check />}
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
          ))
          )}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={salvando}>
          Cancelar
        </Button>
        {usuario && (
          <Button
            onClick={handleSalvar}
            variant="contained"
            disabled={salvando}
            startIcon={salvando ? <CircularProgress size={20} /> : <Security />}
          >
            {salvando ? 'Salvando...' : 'Salvar Permissões'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
} 