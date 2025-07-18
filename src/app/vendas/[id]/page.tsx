"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box, Typography, Paper, Divider, CircularProgress, Button, Alert, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip, TextField, MenuItem, FormControl, InputLabel, Select, Card, CardActionArea, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { Download, Eye, Copy, Send, FileText, CreditCard, QrCode, Pencil, Trash2 } from "lucide-react";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { supabase } from "@/lib/supabase";
import { IMaskInput } from 'react-imask';

// Tipos auxiliares
interface Pagamento {
  id: string;
  status: string;
  valor: number;
  vencimento: string;
  link_pagamento: string;
}

interface HistoricoEnvio {
  data: string;
  canal: string;
  mensagem: string;
}

interface CobrancaAsaas {
  id: string;
  externalReference: string | null;
  value: number;
  status: string;
  dueDate: string;
  description: string;
  customer: string;
  billingType: string;
  dateCreated: string;
  paymentDate?: string;
  confirmedDate?: string;
  bankSlipUrl?: string;
  transactionReceiptUrl?: string;
  invoiceUrl?: string;
  customerDetails?: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone: string;
    mobilePhone: string;
    cityName: string;
    state: string;
  };
}

interface VendaDetalhe {
  id: number;
  cliente_nome: string;
  cliente_cpf: string;
  cliente_data_nascimento: string;
  cliente_estado_civil: string;
  cliente_profissao: string;
  cliente_cep: string;
  cliente_endereco: string;
  cliente_bairro: string;
  cliente_cidade: string;
  cliente_estado: string;
  cliente_numero: string;
  cliente_complemento: string;
  cliente_telefone: string;
  cliente_email: string;
  forma_pagamento: string;
  quantidade_parcelas: number;
  valor_total: number;
  data_pagamento: string;
  corretor: string;
  status: string;
  contrato_url?: string;
  assinatura_status?: string;
  autentique_document_id?: string;
  asaas_customer_id?: string;
  pagamentos?: Pagamento[];
  historico_envio?: HistoricoEnvio[];
}

interface Dependente {
  id: number;
  venda_id: number;
  nome: string;
  data_nascimento: string;
  parentesco: string;
  created_at: string;
  updated_at: string;
}

export default function VendaDetalhePage() {
  const params = useParams();
  const id = params?.id as string;
  const [venda, setVenda] = useState<VendaDetalhe | null>(null);
  const [cobrancas, setCobrancas] = useState<CobrancaAsaas[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCobrancas, setLoadingCobrancas] = useState(false);
  const [criandoCliente, setCriandoCliente] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'success' | 'error' | 'info'; texto: string } | null>(null);
  const [modalEditar, setModalEditar] = useState<{ open: boolean, cobranca?: CobrancaAsaas }>({ open: false });
  const [modalExcluir, setModalExcluir] = useState<{ open: boolean, cobranca?: CobrancaAsaas }>({ open: false });
  const [editForm, setEditForm] = useState<{ valor: number; vencimento: string; descricao: string }>({ valor: 0, vencimento: '', descricao: '' });
  const [loadingAcao, setLoadingAcao] = useState(false);
  // Adicionar estado para modal de cadastro
  const [modalCadastroOpen, setModalCadastroOpen] = useState(false);
  // Adicionar estado para o formulário do modal de nova cobrança
  const [novaCobranca, setNovaCobranca] = useState({
    tipo: 'PIX',
    vencimento: '',
    valor: '',
    descricao: '',
    parcelas: '1',
  });
  const [dependentes, setDependentes] = useState<Dependente[]>([]);
  const [dependenteAtual, setDependenteAtual] = useState<{ nome: string; data_nascimento: string; parentesco: string }>({
    nome: '',
    data_nascimento: '',
    parentesco: ''
  });
  const [modalDependenteOpen, setModalDependenteOpen] = useState(false);
  const [editandoDependente, setEditandoDependente] = useState<Dependente | null>(null);

  const parentescos = ["Cônjuge", "Filho(a)", "Pai", "Mãe", "Irmão(a)", "Outro"];

  useEffect(() => {
    async function fetchVenda() {
      setLoading(true);
      const { data, error } = await supabase
        .from("vendas")
        .select("*")
        .eq("id", id)
        .single();
      if (!error) setVenda(data);
      setLoading(false);
    }
    if (id) fetchVenda();
  }, [id]);

  // Função para carregar dependentes
  const fetchDependentes = async () => {
    if (!venda) return;
    try {
      const { data, error } = await supabase
        .from('dependentes')
        .select('*')
        .eq('venda_id', venda.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao carregar dependentes:', error);
      } else {
        setDependentes(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dependentes:', error);
    }
  };

  useEffect(() => {
    async function fetchCobrancas() {
      if (!venda) return;
      setLoadingCobrancas(true);
      try {
        const response = await fetch(`/api/asaas/listar-cobrancas?venda_id=${venda.id}`);
        const result = await response.json();
        if (response.ok) {
          setCobrancas(result.data || []);
        } else {
          console.error('Erro ao carregar cobranças:', result.error);
        }
      } catch (error) {
        console.error('Erro ao carregar cobranças:', error);
      } finally {
        setLoadingCobrancas(false);
      }
    }

    if (venda) {
      fetchCobrancas();
      fetchDependentes();
    }
  }, [venda]);

  if (loading) return <Box p={4} textAlign="center"><CircularProgress /></Box>;
  if (!venda) return <Box p={4}><Typography>Venda não encontrada.</Typography></Box>;

  const criarClienteAsaas = async () => {
    if (!venda) return;
    
    setCriandoCliente(true);
    setMensagem(null);
    
    try {
      const response = await fetch('/api/asaas/criar-cliente', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          venda_id: venda.id,
          cliente: {
            cliente_nome: venda.cliente_nome,
            cliente_cpf: venda.cliente_cpf,
            cliente_email: venda.cliente_email,
            cliente_telefone: venda.cliente_telefone,
            cliente_cep: venda.cliente_cep,
            cliente_endereco: venda.cliente_endereco,
            cliente_numero: venda.cliente_numero,
            cliente_complemento: venda.cliente_complemento,
            cliente_estado: venda.cliente_estado,
            cliente_cidade: venda.cliente_cidade,
          }
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMensagem({ tipo: 'success', texto: `Cliente criado no Asaas com sucesso! ID: ${result.customer_id}` });
        // Atualizar a venda com o novo customer_id
        setVenda(prev => prev ? { ...prev, asaas_customer_id: result.customer_id } : null);
      } else {
        setMensagem({ tipo: 'error', texto: `Erro ao criar cliente: ${result.error}` });
      }
    } catch (error) {
      console.error('Erro ao criar cliente no Asaas:', error);
      setMensagem({ tipo: 'error', texto: 'Erro interno ao criar cliente no Asaas' });
    } finally {
      setCriandoCliente(false);
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

  const getBillingTypeIcon = (billingType: string) => {
    switch (billingType) {
      case 'PIX':
        return <QrCode size={16} />;
      case 'CREDIT_CARD':
        return <CreditCard size={16} />;
      case 'BOLETO':
        return <FileText size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value); // Removido o / 100
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMensagem({ tipo: 'success', texto: `${label} copiado para a área de transferência!` });
    } catch (err) {
      setMensagem({ tipo: 'error', texto: 'Erro ao copiar para a área de transferência' });
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

  // Função para abrir modal de edição
  const abrirModalEditar = (cobranca: CobrancaAsaas) => {
    setEditForm({
      valor: cobranca.value,
      vencimento: cobranca.dueDate.split('T')[0],
      descricao: cobranca.description || ''
    });
    setModalEditar({ open: true, cobranca });
  };

  // Função para abrir modal de exclusão
  const abrirModalExcluir = (cobranca: CobrancaAsaas) => {
    setModalExcluir({ open: true, cobranca });
  };

  // Função para editar cobrança
  const editarCobranca = async () => {
    if (!modalEditar.cobranca) return;
    setLoadingAcao(true);
    try {
      const response = await fetch('/api/asaas/editar-cobranca', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: modalEditar.cobranca.id,
          valor: editForm.valor,
          vencimento: editForm.vencimento,
          descricao: editForm.descricao
        })
      });
      const result = await response.json();
      if (response.ok) {
        setMensagem({ tipo: 'success', texto: 'Cobrança editada com sucesso!' });
        setModalEditar({ open: false });
        // Atualizar lista de cobranças
        if (venda) {
          const response = await fetch(`/api/asaas/listar-cobrancas?venda_id=${venda.id}`);
          const result = await response.json();
          setCobrancas(result.data || []);
        }
      } else {
        setMensagem({ tipo: 'error', texto: result.error || 'Erro ao editar cobrança.' });
      }
    } catch (err) {
      setMensagem({ tipo: 'error', texto: 'Erro ao editar cobrança.' });
    } finally {
      setLoadingAcao(false);
    }
  };

  // Função para excluir cobrança
  const excluirCobranca = async () => {
    if (!modalExcluir.cobranca) return;
    setLoadingAcao(true);
    try {
      const response = await fetch('/api/asaas/excluir-cobranca', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: modalExcluir.cobranca.id })
      });
      const result = await response.json();
      if (response.ok) {
        setMensagem({ tipo: 'success', texto: 'Cobrança excluída com sucesso!' });
        setModalExcluir({ open: false });
        // Atualizar lista de cobranças
        if (venda) {
          const response = await fetch(`/api/asaas/listar-cobrancas?venda_id=${venda.id}`);
          const result = await response.json();
          setCobrancas(result.data || []);
        }
      } else {
        setMensagem({ tipo: 'error', texto: result.error || 'Erro ao excluir cobrança.' });
      }
    } catch (err) {
      setMensagem({ tipo: 'error', texto: 'Erro ao excluir cobrança.' });
    } finally {
      setLoadingAcao(false);
    }
  };

  // Função para formatar valor como moeda brasileira
  function formatarValor(valor: string) {
    const num = valor.replace(/\D/g, "");
    const float = (parseInt(num, 10) / 100).toFixed(2);
    return float.replace('.', ',').replace(/(\d)(?=(\d{3})+,)/g, '$1.')
  }

  // Função para formatar data como dd/mm/aaaa
  function formatarData(data: string) {
    let v = data.replace(/\D/g, '').slice(0,8);
    if (v.length >= 5) return v.replace(/(\d{2})(\d{2})(\d{0,4})/, '$1/$2/$3');
    if (v.length >= 3) return v.replace(/(\d{2})(\d{0,2})/, '$1/$2');
    return v;
  }

  // Função para formatar data de nascimento no padrão DD/MM/AAAA
  function formatarDataNascimento(data: string): string {
    if (!data) return '';
    
    // Se já está no formato DD/MM/AAAA, retorna como está
    if (data.includes('/')) return data;
    
    // Se está no formato ISO (YYYY-MM-DD), converte para DD/MM/AAAA
    if (data.includes('-')) {
      const [ano, mes, dia] = data.split('-');
      return `${dia}/${mes}/${ano}`;
    }
    
    return data;
  }

  // Funções para gerenciar dependentes
  function formatarDataParaISO(data: string) {
    if (!data) return '';
    
    // Se está no formato DD/MM/AAAA, converte para ISO
    if (data.includes('/')) {
      const [dia, mes, ano] = data.split('/');
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
    
    return data;
  }

  function formatarNome(nome: string): string {
    return nome
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  async function salvarDependente() {
    if (!venda || !dependenteAtual.nome || !dependenteAtual.data_nascimento || !dependenteAtual.parentesco) {
      setMensagem({ tipo: 'error', texto: 'Preencha todos os campos do dependente.' });
      return;
    }

    if (dependentes.length >= 5 && !editandoDependente) {
      setMensagem({ tipo: 'error', texto: 'Limite máximo de 5 dependentes atingido.' });
      return;
    }

    setLoadingAcao(true);
    try {
      const dadosDependente = {
        venda_id: venda.id,
        nome: formatarNome(dependenteAtual.nome),
        data_nascimento: formatarDataParaISO(dependenteAtual.data_nascimento),
        parentesco: dependenteAtual.parentesco
      };

      if (editandoDependente) {
        // Editar dependente existente
        const { error } = await supabase
          .from('dependentes')
          .update(dadosDependente)
          .eq('id', editandoDependente.id);

        if (error) {
          setMensagem({ tipo: 'error', texto: `Erro ao editar dependente: ${error.message}` });
          return;
        }
        setMensagem({ tipo: 'success', texto: 'Dependente editado com sucesso!' });
      } else {
        // Adicionar novo dependente
        const { error } = await supabase
          .from('dependentes')
          .insert([dadosDependente]);

        if (error) {
          setMensagem({ tipo: 'error', texto: `Erro ao adicionar dependente: ${error.message}` });
          return;
        }
        setMensagem({ tipo: 'success', texto: 'Dependente adicionado com sucesso!' });
      }

      // Limpar formulário e recarregar dependentes
      setDependenteAtual({ nome: '', data_nascimento: '', parentesco: '' });
      setEditandoDependente(null);
      setModalDependenteOpen(false);
      await fetchDependentes();
    } catch (error) {
      setMensagem({ tipo: 'error', texto: 'Erro ao salvar dependente.' });
    } finally {
      setLoadingAcao(false);
    }
  }

  async function excluirDependente(id: number) {
    if (!confirm('Tem certeza que deseja excluir este dependente?')) return;

    setLoadingAcao(true);
    try {
      const { error } = await supabase
        .from('dependentes')
        .delete()
        .eq('id', id);

      if (error) {
        setMensagem({ tipo: 'error', texto: `Erro ao excluir dependente: ${error.message}` });
        return;
      }

      setMensagem({ tipo: 'success', texto: 'Dependente excluído com sucesso!' });
      await fetchDependentes();
    } catch (error) {
      setMensagem({ tipo: 'error', texto: 'Erro ao excluir dependente.' });
    } finally {
      setLoadingAcao(false);
    }
  }

  function abrirModalDependente(dependente: Dependente | null = null) {
    if (dependente) {
      setEditandoDependente(dependente);
      setDependenteAtual({
        nome: dependente.nome,
        data_nascimento: formatarDataNascimento(dependente.data_nascimento),
        parentesco: dependente.parentesco
      });
    } else {
      setEditandoDependente(null);
      setDependenteAtual({ nome: '', data_nascimento: '', parentesco: '' });
    }
    setModalDependenteOpen(true);
  }

  // Função para cadastrar nova cobrança
  const cadastrarCobranca = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venda) return;
    setLoadingAcao(true);
    setMensagem(null);

    // Validação dos campos obrigatórios
    const valorNumerico = (Number(novaCobranca.valor.replace(/\D/g, '')) / 100).toFixed(2);
    const vencimentoParts = novaCobranca.vencimento.split('/');
    const vencimentoISO = vencimentoParts.length === 3 ? `${vencimentoParts[2]}-${vencimentoParts[1]}-${vencimentoParts[0]}` : '';
    const descricao = novaCobranca.descricao?.trim();
    const parcelas = novaCobranca.tipo === 'CREDIT_CARD' ? Number(novaCobranca.parcelas) : 1;
    if (!valorNumerico || Number(valorNumerico) <= 0) {
      setMensagem({ tipo: 'error', texto: 'Informe um valor válido para a cobrança.' });
      setLoadingAcao(false);
      return;
    }
    if (!vencimentoISO || vencimentoISO.length !== 10) {
      setMensagem({ tipo: 'error', texto: 'Informe uma data de vencimento válida.' });
      setLoadingAcao(false);
      return;
    }
    if (!descricao) {
      setMensagem({ tipo: 'error', texto: 'Informe uma descrição para a cobrança.' });
      setLoadingAcao(false);
      return;
    }
    if (novaCobranca.tipo === 'CREDIT_CARD' && (!parcelas || parcelas < 1 || parcelas > 12)) {
      setMensagem({ tipo: 'error', texto: 'Selecione uma quantidade de parcelas entre 1 e 12.' });
      setLoadingAcao(false);
      return;
    }
    if (!venda.asaas_customer_id) {
      setMensagem({ tipo: 'error', texto: 'Cliente Asaas não encontrado. Crie o cliente antes de cadastrar a cobrança.' });
      setLoadingAcao(false);
      return;
    }

    // Montar body da requisição seguindo o padrão do cadastro de vendas
    const body = {
      venda_id: venda.id,
      cobranca: {
        cliente_nome: venda.cliente_nome,
        cliente_cpf: venda.cliente_cpf,
        cliente_email: venda.cliente_email,
        cliente_telefone: venda.cliente_telefone,
        forma_pagamento: novaCobranca.tipo,
        valor_total: Number(valorNumerico),
        data_pagamento: vencimentoISO,
        quantidade_parcelas: novaCobranca.tipo === 'CREDIT_CARD' ? Number(novaCobranca.parcelas) : 1,
        descricao: descricao
      }
    };
    // Log para depuração
    console.log('Enviando cobrança para o Asaas:', body);

    try {
      const response = await fetch('/api/asaas/criar-cobranca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      let result;
      try {
        result = await response.json();
      } catch (jsonErr) {
        result = { error: 'Erro inesperado ao processar resposta do servidor.' };
      }
      if (response.ok) {
        setMensagem({ tipo: 'success', texto: 'Cobrança criada com sucesso!' });
        setModalCadastroOpen(false);
        setNovaCobranca({ tipo: 'PIX', vencimento: '', valor: '', descricao: '', parcelas: '1' });
        // Atualizar lista de cobranças
        const response = await fetch(`/api/asaas/listar-cobrancas?venda_id=${venda.id}`);
        const result = await response.json();
        setCobrancas(result.data || []);
      } else {
        setMensagem({ tipo: 'error', texto: (result && (result.error || result.message)) ? `${result.error || result.message}` : `Erro ao criar cobrança. Código: ${response.status}` });
        // Logar resposta completa para depuração
        console.error('Erro ao criar cobrança:', result);
      }
    } catch (err) {
      setMensagem({ tipo: 'error', texto: 'Erro ao criar cobrança.' });
    } finally {
      setLoadingAcao(false);
    }
  };

  return (
    <Box sx={{ 
      maxWidth: 1200, 
      mx: "auto", 
      p: { xs: 2, md: 4 },
      pb: { xs: 4, md: 6 }, // Adicionar padding bottom para garantir espaço para scroll
      minHeight: '100vh',
      position: 'relative'
    }}>
      <Typography variant="h4" fontWeight={700} mb={2} color="primary.main" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
        Detalhes do Cliente/Contrato
      </Typography>
      
      <Paper sx={{ p: 3, borderRadius: 4, mb: 4 }}>
        <Typography variant="h6" fontWeight={600} mb={2}>Dados do Cliente</Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
          <Box>
            <Typography><b>Nome:</b> {venda.cliente_nome}</Typography>
            <Typography><b>CPF:</b> {venda.cliente_cpf}</Typography>
            <Typography><b>Data de Nascimento:</b> {formatarDataNascimento(venda.cliente_data_nascimento)}</Typography>
            <Typography><b>Estado Civil:</b> {venda.cliente_estado_civil}</Typography>
            <Typography><b>Profissão:</b> {venda.cliente_profissao}</Typography>
            <Typography><b>Telefone:</b> {venda.cliente_telefone}</Typography>
          </Box>
          <Box>
            <Typography><b>Endereço:</b> {venda.cliente_endereco}, {venda.cliente_numero} {venda.cliente_complemento}</Typography>
            <Typography><b>Bairro:</b> {venda.cliente_bairro}</Typography>
            <Typography><b>Cidade/UF:</b> {venda.cliente_cidade} - {venda.cliente_estado}</Typography>
            <Typography><b>CEP:</b> {venda.cliente_cep}</Typography>
          </Box>
        </Box>
      </Paper>
      
      {/* Seção de Dependentes */}
      <Paper sx={{ p: 3, borderRadius: 4, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>Dependentes ({dependentes.length}/5)</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => abrirModalDependente()}
            disabled={dependentes.length >= 5}
            startIcon={<AddIcon />}
          >
            Adicionar Dependente
          </Button>
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        {dependentes.length > 0 ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(auto-fit, minmax(300px, 1fr))' }, gap: 2 }}>
            {dependentes.map((dependente) => (
              <Paper key={dependente.id} sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight={600} color="primary">
                      {dependente.nome}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <b>Data de Nascimento:</b> {formatarDataNascimento(dependente.data_nascimento)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <b>Parentesco:</b> {dependente.parentesco}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => abrirModalDependente(dependente)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => excluirDependente(dependente.id)}
                      disabled={loadingAcao}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary" variant="body1">
              Nenhum dependente cadastrado.
            </Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
              Adicione dependentes para este cliente.
            </Typography>
          </Box>
        )}
      </Paper>
      
      <Paper sx={{ p: 3, borderRadius: 4, mb: 4 }}>
        <Typography variant="h6" fontWeight={600} mb={2}>Contrato</Typography>
        <Divider sx={{ mb: 2 }} />
        {venda.contrato_url ? (
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button
              href={venda.contrato_url}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              color="primary"
              sx={{ mb: 2 }}
              startIcon={<Download size={18} />}
            >
              Download PDF
            </Button>
          </Box>
        ) : (
          <Typography color="text.secondary">Contrato ainda não gerado.</Typography>
        )}
        <Typography><b>Status da Assinatura:</b> {venda.assinatura_status || "Aguardando"}</Typography>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 4, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>Faturas e Cobranças</Typography>
          <Button variant="contained" color="primary" onClick={() => setModalCadastroOpen(true)}>
            Adicionar Fatura
          </Button>
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        {loadingCobrancas ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : cobrancas.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Descrição</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Valor</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Vencimento</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Forma de Pagamento</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cobrancas.map((cobranca) => (
                  <TableRow key={cobranca.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {cobranca.description}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        ID: {cobranca.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {formatCurrency(cobranca.value)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(cobranca.dueDate)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={cobranca.status === 'PENDING' ? <CircularProgress size={12} /> : undefined}
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
                        <Tooltip title="Editar cobrança">
                          <IconButton size="small" onClick={() => abrirModalEditar(cobranca)}>
                            <Pencil size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir cobrança">
                          <IconButton size="small" color="error" onClick={() => abrirModalExcluir(cobranca)}>
                            <Trash2 size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Copiar ID">
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(cobranca.id, 'ID da cobrança')}
                          >
                            <Copy size={16} />
                          </IconButton>
                        </Tooltip>
                        
                        {cobranca.bankSlipUrl && (
                          <Tooltip title="Visualizar boleto">
                            <IconButton
                              size="small"
                              onClick={() => window.open(cobranca.bankSlipUrl!, '_blank')}
                            >
                              <FileText size={16} />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {cobranca.transactionReceiptUrl && (
                          <Tooltip title="Baixar recibo">
                            <IconButton
                              size="small"
                              onClick={() => downloadFile(cobranca.transactionReceiptUrl!, `recibo-${cobranca.id}.pdf`)}
                            >
                              <Download size={16} />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {cobranca.invoiceUrl && (
                          <Tooltip title="Baixar fatura">
                            <IconButton
                              size="small"
                              onClick={() => downloadFile(cobranca.invoiceUrl!, `fatura-${cobranca.id}.pdf`)}
                            >
                              <Download size={16} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary" variant="body1">
              Nenhuma fatura encontrada para este cliente.
            </Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
              As faturas aparecerão aqui quando forem criadas no sistema de cobranças.
            </Typography>
          </Box>
        )}
      </Paper>
      
      <Paper sx={{ p: 3, borderRadius: 4, mb: 4 }}>
        <Typography variant="h6" fontWeight={600} mb={2}>Integração Asaas</Typography>
        <Divider sx={{ mb: 2 }} />
        
        {mensagem && (
          <Box sx={{ mb: 2 }}>
            <Alert severity={mensagem.tipo} onClose={() => setMensagem(null)}>
              {mensagem.texto}
            </Alert>
          </Box>
        )}

        {venda.asaas_customer_id ? (
          <Box>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>ID do Cliente Asaas:</strong> {venda.asaas_customer_id}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Cliente já foi criado no Asaas e está pronto para receber cobranças.
            </Typography>
          </Box>
        ) : (
          <Box>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Cliente ainda não foi criado no Asaas. Clique no botão abaixo para criar.
            </Typography>
            <Button
              onClick={criarClienteAsaas}
              variant="contained"
              color="primary"
              disabled={criandoCliente}
              startIcon={criandoCliente ? <CircularProgress size={18} /> : null}
            >
              {criandoCliente ? 'Criando Cliente...' : 'Criar Cliente no Asaas'}
            </Button>
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 4 }}>
        <Typography variant="h6" fontWeight={600} mb={2}>Histórico de Envio</Typography>
        <Divider sx={{ mb: 2 }} />
        {venda.historico_envio && venda.historico_envio.length > 0 ? (
          venda.historico_envio.map((h, idx) => (
            <Box key={idx} sx={{ mb: 2 }}>
              <Typography><b>Data:</b> {h.data}</Typography>
              <Typography><b>Canal:</b> {h.canal}</Typography>
              <Typography><b>Mensagem:</b> {h.mensagem}</Typography>
            </Box>
          ))
        ) : (
          <Typography color="text.secondary">Nenhum histórico registrado.</Typography>
        )}
      </Paper>

      {/* Modal de edição de cobrança */}
      {modalEditar.open && (
        <Box position="fixed" top={0} left={0} width="100vw" height="100vh" bgcolor="rgba(0,0,0,0.3)" zIndex={9999} display="flex" alignItems="center" justifyContent="center">
          <Paper sx={{ p: 4, borderRadius: 4, minWidth: 340 }}>
            <Typography variant="h6" mb={2}>Editar Cobrança</Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Descrição"
                value={editForm.descricao}
                onChange={e => setEditForm({ ...editForm, descricao: e.target.value })}
                fullWidth
              />
              <TextField
                label="Valor (R$)"
                type="number"
                value={editForm.valor}
                onChange={e => setEditForm({ ...editForm, valor: Number(e.target.value) })}
                fullWidth
              />
              <TextField
                label="Vencimento"
                type="date"
                value={editForm.vencimento}
                onChange={e => setEditForm({ ...editForm, vencimento: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box display="flex" gap={2} mt={3} justifyContent="flex-end">
              <Button onClick={() => setModalEditar({ open: false })} disabled={loadingAcao}>Cancelar</Button>
              <Button variant="contained" onClick={editarCobranca} disabled={loadingAcao}>{loadingAcao ? 'Salvando...' : 'Salvar'}</Button>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Modal de confirmação de exclusão */}
      {modalExcluir.open && (
        <Box position="fixed" top={0} left={0} width="100vw" height="100vh" bgcolor="rgba(0,0,0,0.3)" zIndex={9999} display="flex" alignItems="center" justifyContent="center">
          <Paper sx={{ p: 4, borderRadius: 4, minWidth: 320 }}>
            <Typography variant="h6" mb={2}>Excluir Cobrança</Typography>
            <Typography mb={3}>Tem certeza que deseja excluir esta cobrança? Esta ação não poderá ser desfeita.</Typography>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button onClick={() => setModalExcluir({ open: false })} disabled={loadingAcao}>Cancelar</Button>
              <Button variant="contained" color="error" onClick={excluirCobranca} disabled={loadingAcao}>{loadingAcao ? 'Excluindo...' : 'Excluir'}</Button>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Modal de cadastro de cobrança */}
      {modalCadastroOpen && (
        <Dialog open={modalCadastroOpen} onClose={() => setModalCadastroOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Nova Cobrança</DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={cadastrarCobranca}>
              {/* Forma de pagamento: cards em vez de select */}
              <Box display="flex" gap={2} mb={2}>
                <Card
                  variant={novaCobranca.tipo === 'PIX' ? 'elevation' : 'outlined'}
                  sx={{ borderColor: novaCobranca.tipo === 'PIX' ? 'primary.main' : 'grey.300', borderWidth: 2, minWidth: 120, boxShadow: novaCobranca.tipo === 'PIX' ? 4 : 0 }}
                >
                  <CardActionArea onClick={() => setNovaCobranca({ ...novaCobranca, tipo: 'PIX' })}>
                    <Box p={2} textAlign="center">
                      <Typography variant="subtitle1" fontWeight={novaCobranca.tipo === 'PIX' ? 700 : 400}>PIX</Typography>
                    </Box>
                  </CardActionArea>
                </Card>
                <Card
                  variant={novaCobranca.tipo === 'CREDIT_CARD' ? 'elevation' : 'outlined'}
                  sx={{ borderColor: novaCobranca.tipo === 'CREDIT_CARD' ? 'primary.main' : 'grey.300', borderWidth: 2, minWidth: 120, boxShadow: novaCobranca.tipo === 'CREDIT_CARD' ? 4 : 0 }}
                >
                  <CardActionArea onClick={() => setNovaCobranca({ ...novaCobranca, tipo: 'CREDIT_CARD' })}>
                    <Box p={2} textAlign="center">
                      <Typography variant="subtitle1" fontWeight={novaCobranca.tipo === 'CREDIT_CARD' ? 700 : 400}>Cartão de Crédito</Typography>
                    </Box>
                  </CardActionArea>
                </Card>
              </Box>
              {novaCobranca.tipo === 'CREDIT_CARD' && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="parcelas-label">Quantidade de Parcelas</InputLabel>
                  <Select
                    labelId="parcelas-label"
                    id="parcelas-select"
                    value={novaCobranca.parcelas}
                    label="Quantidade de Parcelas"
                    onChange={e => setNovaCobranca({ ...novaCobranca, parcelas: e.target.value })}
                    MenuProps={{
                      PaperProps: {
                        sx: { zIndex: 20000 }
                      }
                    }}
                  >
                    {[...Array(12)].map((_, i) => (
                      <MenuItem key={i+1} value={(i+1).toString()}>{i+1}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              <TextField
                label="Vencimento"
                name="vencimento"
                fullWidth
                sx={{ mb: 2 }}
                value={novaCobranca.vencimento}
                onChange={e => setNovaCobranca({ ...novaCobranca, vencimento: formatarData(e.target.value) })}
                placeholder="dd/mm/aaaa"
                inputProps={{ maxLength: 10 }}
              />
              <TextField
                label="Valor"
                name="valor"
                fullWidth
                sx={{ mb: 2 }}
                value={novaCobranca.valor}
                onChange={e => setNovaCobranca({ ...novaCobranca, valor: formatarValor(e.target.value) })}
                placeholder="R$ 0,00"
                inputProps={{ maxLength: 15 }}
              />
              <TextField
                label="Descrição"
                name="descricao"
                fullWidth
                sx={{ mb: 2 }}
                value={novaCobranca.descricao}
                onChange={e => setNovaCobranca({ ...novaCobranca, descricao: e.target.value })}
              />
              <DialogActions>
                <Button onClick={() => setModalCadastroOpen(false)} color="inherit">Cancelar</Button>
                <Button type="submit" variant="contained" color="primary" disabled={loadingAcao}>
                  {loadingAcao ? 'Cadastrando...' : 'Cadastrar'}
                </Button>
              </DialogActions>
            </Box>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de dependente */}
      {modalDependenteOpen && (
        <Dialog open={modalDependenteOpen} onClose={() => setModalDependenteOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editandoDependente ? 'Editar Dependente' : 'Adicionar Dependente'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Nome Completo"
                value={dependenteAtual.nome}
                onChange={(e) => setDependenteAtual({ ...dependenteAtual, nome: formatarNome(e.target.value) })}
                fullWidth
                variant="filled"
              />
              <TextField
                label="Data de Nascimento"
                value={dependenteAtual.data_nascimento}
                onChange={(e) => setDependenteAtual({ ...dependenteAtual, data_nascimento: e.target.value })}
                fullWidth
                variant="filled"
                InputProps={{
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  inputComponent: IMaskInput as any,
                  inputProps: { mask: '00/00/0000' }
                }}
              />
              <TextField
                select
                label="Parentesco"
                value={dependenteAtual.parentesco}
                onChange={(e) => setDependenteAtual({ ...dependenteAtual, parentesco: e.target.value })}
                fullWidth
                variant="filled"
              >
                {parentescos.map((parentesco) => (
                  <MenuItem key={parentesco} value={parentesco}>
                    {parentesco}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <DialogActions>
              <Button onClick={() => setModalDependenteOpen(false)} disabled={loadingAcao}>
                Cancelar
              </Button>
              <Button 
                variant="contained" 
                onClick={salvarDependente} 
                disabled={loadingAcao}
              >
                {loadingAcao ? 'Salvando...' : (editandoDependente ? 'Atualizar' : 'Adicionar')}
              </Button>
            </DialogActions>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
} 