"use client";
import { useState, useEffect } from "react";
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, MenuItem, IconButton, Chip, Card, CardContent, InputAdornment
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import QrCodeIcon from "@mui/icons-material/QrCode";
import EmailIcon from "@mui/icons-material/Email";
import { supabase } from "@/lib/supabase";
import { IMaskInput } from 'react-imask';
import PeopleIcon from "@mui/icons-material/People";
import HomeIcon from "@mui/icons-material/Home";

import { useRouter } from "next/navigation";
import { NumericFormat } from 'react-number-format';
import ClearIcon from "@mui/icons-material/Clear";
import { usePermissions } from '@/hooks/usePermissions';
import PermissionGuard from '@/components/PermissionGuard';

type Venda = {
  id: number;
  cliente_nome: string;
  cliente_cpf: string;
  cliente_email: string;
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
  forma_pagamento: string;
  quantidade_parcelas: number;
  valor_total: number;
  data_pagamento: string;
  corretor: string;
  status: string;
  tipo_contrato: string;
  asaas_customer_id?: string;
  asaas_payment_id?: string;
  created_at?: string;
};

type Dependente = {
  id?: number;
  nome: string;
  data_nascimento: string;
  parentesco: string;
};

const estadosCivis = ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União Estável"];
const formasPagamento = ["PIX", "Cartão de Crédito"];
const parcelas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const parentescos = ["Cônjuge", "Filho(a)", "Pai", "Mãe", "Irmão(a)", "Outro"];
const tiposContrato = ["Lote Vitalício Therra"];

export default function VendasPage() {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [usuarioLogado, setUsuarioLogado] = useState<{ id: number; nome: string; email: string } | null>(null);
  const { temPermissao } = usePermissions(usuarioLogado?.id);
  const [form, setForm] = useState<Omit<Venda, "id" | "created_at">>({
    cliente_nome: "",
    cliente_cpf: "",
    cliente_email: "",
    cliente_data_nascimento: "",
    cliente_estado_civil: "",
    cliente_profissao: "",
    cliente_cep: "",
    cliente_endereco: "",
    cliente_bairro: "",
    cliente_cidade: "",
    cliente_estado: "",
    cliente_numero: "",
    cliente_complemento: "",
    cliente_telefone: "",
    forma_pagamento: "",
    quantidade_parcelas: 1,
    valor_total: 0,
    data_pagamento: new Date().toISOString().split('T')[0],
    corretor: "",
    status: "pendente",
    tipo_contrato: "Lote Vitalício Therra"
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "info" | "warning" | "error" }>({ open: false, message: "", severity: "success" });
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState<Venda | null>(null);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [dependentes, setDependentes] = useState<Dependente[]>([]);
  const [dependenteAtual, setDependenteAtual] = useState<Dependente>({
    nome: '',
    data_nascimento: '',
    parentesco: ''
  });

  // Carregar vendas do Supabase
  async function carregarVendas() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vendas')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setVendas(data || []);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      setSnackbar({ open: true, message: "Erro ao carregar vendas", severity: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarVendas();
    
    // Carregar dados do usuário logado
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUsuarioLogado(user);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    
    // Tratar valores numéricos
    if (name === 'valor_total') {
      const numValue = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      setForm({ ...form, [name]: numValue });
    } else if (name === 'quantidade_parcelas') {
      const numValue = parseInt(value) || 1;
      setForm({ ...form, [name]: numValue });
    } else {
      // No handleChange do campo nome, sempre formate a primeira letra de cada palavra:
      if (name === 'cliente_nome') {
        setForm({ ...form, [name]: formatarNome(value) });
        return;
      }
      setForm({ ...form, [name]: value });
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
    
    // Tratar formato específico do Supabase: "16T17:33:02.986669+00:00/07/2025"
    if (data.includes('T') && data.includes('+') && data.includes('/')) {
      const partes = data.split('/');
      if (partes.length >= 2) {
        const dia = partes[0].split('T')[0];
        const mes = partes[1];
        const ano = partes[2];
        if (dia && mes && ano) {
          return `${dia}/${mes}/${ano}`;
        }
      }
    }
    
    // Se está no formato ISO (YYYY-MM-DD), converte para DD/MM/AAAA
    if (data.includes('-') && !data.includes('T')) {
      const [ano, mes, dia] = data.split('-');
      if (ano && mes && dia) {
        return `${dia}/${mes}/${ano}`;
      }
    }
    
    // Se é uma data em formato de timestamp ou outro formato
    try {
      const dataObj = new Date(data);
      if (!isNaN(dataObj.getTime())) {
        const dia = String(dataObj.getDate()).padStart(2, '0');
        const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
        const ano = dataObj.getFullYear();
        return `${dia}/${mes}/${ano}`;
      }
    } catch (error) {
      console.error('Erro ao formatar data:', error);
    }
    
    // Se não conseguir formatar, retorna a data original
    return data;
  }

  // Funções para gerenciar dependentes
  function adicionarDependente() {
    if (!dependenteAtual.nome || !dependenteAtual.data_nascimento || !dependenteAtual.parentesco) {
      setSnackbar({ open: true, message: "Preencha todos os campos do dependente.", severity: "warning" });
      return;
    }

    if (dependentes.length >= 5) {
      setSnackbar({ open: true, message: "Limite máximo de 5 dependentes atingido.", severity: "warning" });
      return;
    }

    setDependentes([...dependentes, { ...dependenteAtual }]);
    setDependenteAtual({ nome: '', data_nascimento: '', parentesco: '' });
    setSnackbar({ open: true, message: "Dependente adicionado com sucesso!", severity: "success" });
  }

  function removerDependente(index: number) {
    const novosDependentes = dependentes.filter((_, i) => i !== index);
    setDependentes(novosDependentes);
    setSnackbar({ open: true, message: "Dependente removido com sucesso!", severity: "success" });
  }

  function limparDependentes() {
    setDependentes([]);
    setDependenteAtual({ nome: '', data_nascimento: '', parentesco: '' });
  }

  async function salvarVenda() {
    if (!form.cliente_nome || !form.cliente_cpf || !form.cliente_telefone || !form.cliente_email || !form.corretor || !form.forma_pagamento || !form.valor_total) {
      setSnackbar({ open: true, message: "Preencha todos os campos obrigatórios.", severity: "warning" });
      return;
    }

    try {
      setLoading(true);
      
      // Tratar valores numéricos e campos vazios
      const dadosVenda = {
        cliente_nome: formatarNome(form.cliente_nome),
        cliente_cpf: form.cliente_cpf.trim(),
        cliente_email: form.cliente_email.trim(),
        cliente_data_nascimento: formatarDataParaISO(form.cliente_data_nascimento),
        cliente_estado_civil: form.cliente_estado_civil || null,
        cliente_profissao: form.cliente_profissao || null,
        cliente_cep: form.cliente_cep || null,
        cliente_endereco: form.cliente_endereco || null,
        cliente_bairro: form.cliente_bairro || null,
        cliente_cidade: form.cliente_cidade || null,
        cliente_estado: form.cliente_estado || null,
        cliente_numero: form.cliente_numero || null,
        cliente_complemento: form.cliente_complemento || null,
        cliente_telefone: form.cliente_telefone.trim(),
        forma_pagamento: form.forma_pagamento,
        quantidade_parcelas: parseInt(form.quantidade_parcelas.toString()) || 1,
        valor_total: parseFloat(form.valor_total.toString()) || 0,
        data_pagamento: formatarDataParaISO(form.data_pagamento),
        corretor: form.corretor.trim(),
        status: form.status || 'pendente',
        tipo_contrato: form.tipo_contrato || 'Lote Vitalício Therra'
      };

      if (!editando) {
        const { data, error } = await supabase
          .from('vendas')
          .insert([dadosVenda])
          .select();

        if (error) {
          console.error('Erro Supabase:', error);
          setSnackbar({ open: true, message: `Erro ao cadastrar venda: ${error.message || error.details || 'Erro desconhecido'}`, severity: "error" });
          return;
        }

        if (data && data[0]) {
          const vendaId = data[0].id;
          
          // Criar cliente no Asaas automaticamente
          try {
            const response = await fetch('/api/asaas/criar-cliente', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                venda_id: vendaId,
                cliente: {
                  cliente_nome: dadosVenda.cliente_nome,
                  cliente_cpf: dadosVenda.cliente_cpf,
                  cliente_email: dadosVenda.cliente_email,
                  cliente_telefone: dadosVenda.cliente_telefone,
                  cliente_cep: dadosVenda.cliente_cep,
                  cliente_endereco: dadosVenda.cliente_endereco,
                  cliente_numero: dadosVenda.cliente_numero,
                  cliente_complemento: dadosVenda.cliente_complemento,
                  cliente_estado: dadosVenda.cliente_estado,
                  cliente_cidade: dadosVenda.cliente_cidade,
                }
              }),
            });

            const result = await response.json();
            if (response.ok) {
              console.log('Cliente criado no Asaas com sucesso:', result.customer_id);
              
              // Criar cobrança no Asaas automaticamente
              try {
                const cobrancaResponse = await fetch('/api/asaas/criar-cobranca', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    venda_id: vendaId,
                    cobranca: {
                      cliente_nome: dadosVenda.cliente_nome,
                      forma_pagamento: dadosVenda.forma_pagamento,
                      valor_total: dadosVenda.valor_total,
                      data_pagamento: dadosVenda.data_pagamento,
                      quantidade_parcelas: dadosVenda.quantidade_parcelas,
                    }
                  }),
                });

                const cobrancaResult = await cobrancaResponse.json();
                if (cobrancaResponse.ok) {
                  console.log('Cobrança criada no Asaas com sucesso:', cobrancaResult.payment_id);
                } else {
                  console.error('Erro ao criar cobrança no Asaas:', cobrancaResult.error);
                }
              } catch (cobrancaError) {
                console.error('Erro ao criar cobrança no Asaas:', cobrancaError);
              }
            } else {
              console.error('Erro ao criar cliente no Asaas:', result.error);
            }
          } catch (asaasError) {
            console.error('Erro ao criar cliente no Asaas:', asaasError);
          }

          // Enviar webhook para Make (mantém o fluxo existente)
          const payloadWebhook = {
            ...dadosVenda,
            id: vendaId,
            cliente_nome: formatarNome(form.cliente_nome), // Nome formatado
            cliente_data_nascimento: formatarDataParaBR(form.cliente_data_nascimento), // Data no formato DD/MM/AAAA
          };
          await fetch('https://hook.us2.make.com/vbkyv4fdmodakql1ofqe7fg4scrpdmnk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadWebhook)
          });

          // Salvar dependentes se houver
          if (dependentes.length > 0) {
            try {
              const dependentesParaSalvar = dependentes.map(dependente => ({
                venda_id: vendaId,
                nome: formatarNome(dependente.nome),
                data_nascimento: formatarDataParaISO(dependente.data_nascimento),
                parentesco: dependente.parentesco
              }));

              const { error: errorDependentes } = await supabase
                .from('dependentes')
                .insert(dependentesParaSalvar);

              if (errorDependentes) {
                console.error('Erro ao salvar dependentes:', errorDependentes);
                setSnackbar({ open: true, message: "Venda salva, mas erro ao salvar dependentes", severity: "warning" });
              } else {
                console.log('Dependentes salvos com sucesso');
              }
            } catch (error) {
              console.error('Erro ao salvar dependentes:', error);
              setSnackbar({ open: true, message: "Venda salva, mas erro ao salvar dependentes", severity: "warning" });
            }
          }
        }
        setSnackbar({ open: true, message: "Venda cadastrada com sucesso!", severity: "success" });
        await carregarVendas();
        fecharModal();
        return;
      }

      if (editando) {
        const { error } = await supabase
          .from('vendas')
          .update(dadosVenda)
          .eq('id', editando.id);

        if (error) {
          console.error('Erro Supabase:', error);
          setSnackbar({ open: true, message: `Erro ao editar venda: ${error.message || error.details || 'Erro desconhecido'}`, severity: "error" });
          return;
        }

        // Atualizar cliente no Asaas se existir customer_id
        if (editando.asaas_customer_id) {
          try {
            const response = await fetch('/api/asaas/editar-cliente', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                venda_id: editando.id,
                cliente: {
                  cliente_nome: dadosVenda.cliente_nome,
                  cliente_cpf: dadosVenda.cliente_cpf,
                  cliente_email: dadosVenda.cliente_email,
                  cliente_telefone: dadosVenda.cliente_telefone,
                  cliente_cep: dadosVenda.cliente_cep,
                  cliente_endereco: dadosVenda.cliente_endereco,
                  cliente_numero: dadosVenda.cliente_numero,
                  cliente_complemento: dadosVenda.cliente_complemento,
                  cliente_estado: dadosVenda.cliente_estado,
                  cliente_cidade: dadosVenda.cliente_cidade,
                }
              }),
            });

            const result = await response.json();
            if (response.ok) {
              console.log('Cliente atualizado no Asaas com sucesso');
            } else {
              console.error('Erro ao atualizar cliente no Asaas:', result.error);
              setSnackbar({ open: true, message: `Venda editada, mas erro ao atualizar no Asaas: ${result.error}`, severity: "warning" });
              await carregarVendas();
              fecharModal();
              return;
            }
          } catch (asaasError) {
            console.error('Erro ao atualizar cliente no Asaas:', asaasError);
            setSnackbar({ open: true, message: "Venda editada, mas erro ao atualizar no Asaas", severity: "warning" });
            await carregarVendas();
            fecharModal();
            return;
          }
        }

        setSnackbar({ open: true, message: "Venda editada com sucesso!", severity: "success" });
      } else {
        const { error } = await supabase
          .from('vendas')
          .insert([dadosVenda]);

        if (error) {
          console.error('Erro Supabase:', error);
          setSnackbar({ open: true, message: `Erro ao cadastrar venda: ${error.message || error.details || 'Erro desconhecido'}`, severity: "error" });
          return;
        }
        setSnackbar({ open: true, message: "Venda cadastrada com sucesso!", severity: "success" });
      }

      await carregarVendas();
      fecharModal();
    } catch (error: unknown) {
      let errorMsg = '';
      if (error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
        errorMsg = (error as { message: string }).message;
      } else {
        errorMsg = String(error);
      }
      console.error('Erro ao salvar venda:', errorMsg);
      setSnackbar({ open: true, message: `Erro ao salvar venda: ${errorMsg}`, severity: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function excluirVenda(id: number) {
    try {
      setLoading(true);
      
      // Primeiro, buscar a venda para verificar se tem customer_id
      const { data: vendaData, error: vendaError } = await supabase
        .from('vendas')
        .select('asaas_customer_id')
        .eq('id', id)
        .single();

      if (vendaError) {
        console.error('Erro ao buscar venda:', vendaError);
      }

      // Excluir cliente do Asaas se existir customer_id
      if (vendaData?.asaas_customer_id) {
        try {
          const response = await fetch('/api/asaas/excluir-cliente', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ venda_id: id }),
          });

          const result = await response.json();
          if (response.ok) {
            console.log('Cliente excluído do Asaas com sucesso');
          } else {
            console.error('Erro ao excluir cliente do Asaas:', result.error);
            // Continua com a exclusão mesmo se falhar no Asaas
          }
        } catch (asaasError) {
          console.error('Erro ao excluir cliente do Asaas:', asaasError);
          // Continua com a exclusão mesmo se falhar no Asaas
        }
      }

      // Excluir venda do Supabase
      const { error } = await supabase
        .from('vendas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSnackbar({ open: true, message: "Venda excluída!", severity: "info" });
      await carregarVendas();
    } catch (error) {
      console.error('Erro ao excluir venda:', error);
      setSnackbar({ open: true, message: "Erro ao excluir venda", severity: "error" });
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string): "success" | "warning" | "error" | "info" | "default" {
    switch (status) {
      case 'ativo': return 'success';
      case 'aprovada': return 'success';
      case 'pendente': return 'warning';
      case 'cancelada': return 'error';
      case 'concluida': return 'info';
      default: return 'default';
    }
  }

  function formatarValor(valor: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  function fecharModal() {
    setModalOpen(false);
    setEditando(null);
    setForm({
      cliente_nome: "",
      cliente_cpf: "",
      cliente_email: "",
      cliente_data_nascimento: "",
      cliente_estado_civil: "",
      cliente_profissao: "",
      cliente_cep: "",
      cliente_endereco: "",
      cliente_bairro: "",
      cliente_cidade: "",
      cliente_estado: "",
      cliente_numero: "",
      cliente_complemento: "",
      cliente_telefone: "",
      forma_pagamento: "",
      quantidade_parcelas: 1,
      valor_total: 0,
      data_pagamento: "",
      corretor: "",
      status: "pendente",
      tipo_contrato: "Lote Vitalício Therra"
    });
    limparDependentes();
  }

  function abrirModal(venda: Venda | null = null) {
    setEditando(venda);
    if (venda) {
      setForm({
        cliente_nome: venda.cliente_nome,
        cliente_cpf: venda.cliente_cpf,
        cliente_email: venda.cliente_email,
        cliente_data_nascimento: venda.cliente_data_nascimento,
        cliente_estado_civil: venda.cliente_estado_civil,
        cliente_profissao: venda.cliente_profissao,
        cliente_cep: venda.cliente_cep,
        cliente_endereco: venda.cliente_endereco,
        cliente_bairro: venda.cliente_bairro,
        cliente_cidade: venda.cliente_cidade,
        cliente_estado: venda.cliente_estado,
        cliente_numero: venda.cliente_numero,
        cliente_complemento: venda.cliente_complemento,
        cliente_telefone: venda.cliente_telefone,
        forma_pagamento: venda.forma_pagamento,
        quantidade_parcelas: venda.quantidade_parcelas,
        valor_total: venda.valor_total,
        data_pagamento: venda.data_pagamento,
        corretor: venda.corretor,
        status: venda.status,
        tipo_contrato: venda.tipo_contrato || "Lote Vitalício Therra"
      });
    } else {
      setForm({
        cliente_nome: "",
        cliente_cpf: "",
        cliente_email: "",
        cliente_data_nascimento: "",
        cliente_estado_civil: "",
        cliente_profissao: "",
        cliente_cep: "",
        cliente_endereco: "",
        cliente_bairro: "",
        cliente_cidade: "",
        cliente_estado: "",
        cliente_numero: "",
        cliente_complemento: "",
        cliente_telefone: "",
        forma_pagamento: "",
        quantidade_parcelas: 1,
        valor_total: 0,
        data_pagamento: new Date().toISOString().split('T')[0],
        corretor: usuarioLogado?.nome || "",
        status: "pendente",
        tipo_contrato: "Lote Vitalício Therra"
      });
    }
    setModalOpen(true);
  }

  async function buscarCep(cep: string) {
    if (cep.length === 9) {
      try {
        const cepLimpo = cep.replace(/\D/g, '');
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setForm(prev => ({
            ...prev,
            cliente_endereco: data.logradouro,
            cliente_bairro: data.bairro,
            cliente_cidade: data.localidade,
            cliente_estado: data.uf
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  }

  const vendasFiltradas = vendas.filter(v =>
    v.cliente_nome.toLowerCase().includes(busca.toLowerCase()) ||
    v.cliente_cpf.includes(busca) ||
    v.corretor.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <PermissionGuard funcionalidade="vendas" acao="visualizar" usuarioId={usuarioLogado?.id}>
      <Box sx={{ width: '100%', height: '100%', pl: 0, pr: 0 }}>
        {/* Header Mobile Otimizado */}
        <Box sx={{ mb: { xs: 2, md: 3 }, px: { xs: 2, md: 0 } }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} mb={2} gap={2}>
            <Typography variant="h4" fontWeight={700} sx={{ 
              fontSize: { xs: '1.75rem', md: '2.125rem' },
              textAlign: { xs: 'center', sm: 'left' },
              mb: { xs: 1, sm: 0 }
            }}>
              Gestão de Vendas/Sócios
            </Typography>
            <PermissionGuard funcionalidade="vendas" acao="criar" usuarioId={usuarioLogado?.id} fallback={null}>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                sx={{ 
                  borderRadius: { xs: 4, md: 3 }, 
                  fontWeight: 600, 
                  minWidth: { xs: '100%', sm: 'auto' },
                  height: { xs: 48, md: 40 },
                  fontSize: { xs: '1rem', md: '0.875rem' },
                  boxShadow: { xs: '0 4px 12px rgba(0,0,0,0.15)', md: 'none' }
                }} 
                onClick={() => abrirModal()}
              >
                Nova Venda
              </Button>
            </PermissionGuard>
          </Stack>
          
          {/* Campo de busca mobile otimizado */}
          <TextField
            label="Buscar vendas"
            variant="outlined"
            size="small"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            sx={{ 
              mb: 2, 
              width: { xs: '100%', sm: 320 },
              '& .MuiOutlinedInput-root': {
                borderRadius: { xs: 3, md: 2 },
                height: { xs: 48, md: 40 },
                fontSize: { xs: '1rem', md: '0.875rem' }
              }
            }}
          />
        </Box>

        {/* Desktop: Tabela tradicional */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <TableContainer component={Paper} sx={{ 
            borderRadius: 12, 
            boxShadow: '0 4px 20px 0 rgba(0,0,0,0.08)', 
            overflowX: 'auto', 
            width: '100%',
            border: '1px solid rgba(0,0,0,0.04)'
          }}>
            <Table sx={{ minWidth: 'auto', width: '100%' }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.default' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem', pl: 3, pr: 1 }}>Cliente</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem', px: 1 }}>CPF</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem', px: 1 }}>Contato</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem', display: { xs: 'none', lg: 'table-cell' }, px: 1 }}>Data de Venda</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem', px: 1 }}>Valor</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem', display: { xs: 'none', lg: 'table-cell' }, px: 1 }}>Pagamento</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem', px: 1 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem', display: { xs: 'none', lg: 'table-cell' }, px: 1 }}>Corretor</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1rem', pr: 3, pl: 1 }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vendasFiltradas.map((venda) => (
                  <TableRow key={venda.id} hover sx={{ transition: 'background 0.2s', '&:hover': { bgcolor: 'grey.50' } }}>
                    <TableCell sx={{ fontSize: '1rem', pl: 3, pr: 1 }}>
                      <Button variant="text" color="primary" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '1rem' }} onClick={() => router.push(`/vendas/${venda.id}`)}>
                        {venda.cliente_nome}
                      </Button>
                    </TableCell>
                    <TableCell sx={{ fontSize: '1rem', px: 1 }}>{venda.cliente_cpf}</TableCell>
                    <TableCell sx={{ fontSize: '1rem', px: 1 }}>{venda.cliente_telefone}</TableCell>
                    <TableCell sx={{ fontSize: '1rem', display: { xs: 'none', lg: 'table-cell' }, px: 1 }}>
                      {venda.created_at ? formatarDataParaBR(venda.created_at) : '-'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '1rem', px: 1 }}>
                      <Typography variant="body2" fontWeight={600} color="primary" sx={{ fontSize: '1rem' }}>
                        {formatarValor(venda.valor_total)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: '1rem', display: { xs: 'none', lg: 'table-cell' }, px: 1 }}>
                      <Chip label={venda.forma_pagamento} size="small" variant="outlined" color="info" />
                    </TableCell>
                    <TableCell sx={{ fontSize: '1rem', px: 1 }}>
                      <Chip 
                        label={venda.status} 
                        size="small" 
                        color={getStatusColor(venda.status)}
                        variant="filled"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '1rem', display: { xs: 'none', lg: 'table-cell' }, px: 1 }}>{venda.corretor}</TableCell>
                    <TableCell align="right" sx={{ fontSize: '1rem', pr: 3, pl: 1 }}>
                      <PermissionGuard funcionalidade="vendas" acao="editar" usuarioId={usuarioLogado?.id} fallback={null}>
                        <IconButton color="primary" onClick={() => abrirModal(venda)} disabled={loading} sx={{ mr: 1 }}>
                          <EditIcon />
                        </IconButton>
                      </PermissionGuard>
                      <PermissionGuard funcionalidade="vendas" acao="excluir" usuarioId={usuarioLogado?.id} fallback={null}>
                        <IconButton color="error" onClick={() => excluirVenda(venda.id)} disabled={loading}>
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
            {vendasFiltradas.map((venda) => (
              <Card 
                key={venda.id} 
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
                      <Button 
                        variant="text" 
                        color="primary" 
                        sx={{ 
                          textTransform: 'none', 
                          fontWeight: 700, 
                          fontSize: '1.1rem',
                          p: 0,
                          textAlign: 'left',
                          justifyContent: 'flex-start',
                          minHeight: 'auto',
                          lineHeight: 1.2
                        }} 
                        onClick={() => router.push(`/vendas/${venda.id}`)}
                      >
                        {venda.cliente_nome}
                      </Button>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.9rem' }}>
                        {venda.cliente_telefone}
                      </Typography>
                    </Box>
                    <Chip 
                      label={venda.status} 
                      size="small" 
                      color={getStatusColor(venda.status)}
                      variant="filled"
                      sx={{ 
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: 24
                      }}
                    />
                  </Box>

                  {/* Informações principais */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                        Valor:
                      </Typography>
                      <Typography variant="body1" fontWeight={700} color="primary" sx={{ fontSize: '1.1rem' }}>
                        {formatarValor(venda.valor_total)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                        Pagamento:
                      </Typography>
                      <Chip 
                        label={venda.forma_pagamento} 
                        size="small" 
                        variant="outlined" 
                        color="info"
                        sx={{ fontSize: '0.75rem', height: 20 }}
                      />
                    </Box>

                    {venda.created_at && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                          Data:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                          {formatarDataParaBR(venda.created_at)}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Ações */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 1, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                    <PermissionGuard funcionalidade="vendas" acao="editar" usuarioId={usuarioLogado?.id} fallback={null}>
                      <IconButton 
                        color="primary" 
                        onClick={() => abrirModal(venda)} 
                        disabled={loading}
                        sx={{ 
                          bgcolor: 'primary.50',
                          '&:hover': { bgcolor: 'primary.100' }
                        }}
                      >
                        <EditIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    </PermissionGuard>
                    <PermissionGuard funcionalidade="vendas" acao="excluir" usuarioId={usuarioLogado?.id} fallback={null}>
                      <IconButton 
                        color="error" 
                        onClick={() => excluirVenda(venda.id)} 
                        disabled={loading}
                        sx={{ 
                          bgcolor: 'error.50',
                          '&:hover': { bgcolor: 'error.100' }
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    </PermissionGuard>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>

      {/* Modal de cadastro/edição */}
      <Dialog open={modalOpen} onClose={fecharModal} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 0, bgcolor: 'background.paper', boxShadow: 6 } }}>
        <DialogTitle sx={{ pb: 1, bgcolor: 'background.default', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
          {editando ? "Editar Venda" : "Nova Venda - Contrato"}
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1, md: 4 }, bgcolor: 'background.paper', borderRadius: 4, boxShadow: 0 }}>
          <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, borderRadius: 4, boxShadow: 0, bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Dados Pessoais */}
              <Typography variant="h6" fontWeight={700} mb={2} color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleIcon sx={{ fontSize: 28 }} /> Dados Pessoais
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gap: 2 }}>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 6' } }}>
                  <TextField
                    label={<><b>*</b> Nome Completo</>}
                    name="cliente_nome"
                    value={form.cliente_nome ?? ""}
                    onChange={handleChange}
                    fullWidth
                    required
                    variant="filled"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PeopleIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}>
                  <TextField
                    label={<><b>*</b> CPF</>}
                    name="cliente_cpf"
                    value={form.cliente_cpf ?? ""}
                    onChange={handleChange}
                    fullWidth
                    required
                    variant="filled"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CreditCardIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                        </InputAdornment>
                      ),
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      inputComponent: IMaskInput as any,
                      inputProps: { mask: '000.000.000-00' }
                    }}
                  />
                </Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}>
                  <TextField
                    label={<><b>*</b> Email</>}
                    name="cliente_email"
                    value={form.cliente_email ?? ""}
                    onChange={handleChange}
                    fullWidth
                    required
                    variant="filled"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}>
                  <TextField
                    label={<><b>*</b> Telefone WhatsApp</>}
                    name="cliente_telefone"
                    value={form.cliente_telefone ?? ""}
                    onChange={handleChange}
                    fullWidth
                    required
                    variant="filled"
                    InputProps={{
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      inputComponent: IMaskInput as any,
                      inputProps: { mask: '(00) 00000-0000' }
                    }}
                  />
                </Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}>
                  <TextField
                    label="Data de Nascimento"
                    name="cliente_data_nascimento"
                    value={form.cliente_data_nascimento ?? ""}
                    onChange={handleChange}
                    fullWidth
                    variant="filled"
                    InputProps={{
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      inputComponent: IMaskInput as any,
                      inputProps: { mask: '00/00/0000' }
                    }}
                  />
                </Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 6' } }}>
                  <TextField
                    select
                    label="Estado Civil"
                    name="cliente_estado_civil"
                    value={form.cliente_estado_civil ?? ""}
                    onChange={handleChange}
                    fullWidth
                    variant="filled"
                  >
                    {estadosCivis.map((estado) => (
                      <MenuItem key={estado} value={estado}>
                        {estado}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 6' } }}>
                  <TextField
                    label="Profissão"
                    name="cliente_profissao"
                    value={form.cliente_profissao ?? ""}
                    onChange={handleChange}
                    fullWidth
                    variant="filled"
                  />
                </Box>
              </Box>
              {/* Endereço */}
              <Typography variant="h6" fontWeight={700} mb={2} color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HomeIcon sx={{ fontSize: 28 }} /> Endereço
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gap: 2 }}>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}>
                  <TextField
                    label={<><b>*</b> CEP</>}
                    name="cliente_cep"
                    value={form.cliente_cep ?? ""}
                    onChange={e => {
                      handleChange(e);
                      buscarCep(e.target.value);
                    }}
                    fullWidth
                    required
                    variant="filled"
                    InputProps={{
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      inputComponent: IMaskInput as any,
                      inputProps: { mask: '00000-000' }
                    }}
                  />
                </Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 9' } }}>
                  <TextField
                    label="Endereço"
                    name="cliente_endereco"
                    value={form.cliente_endereco ?? ""}
                    onChange={handleChange}
                    fullWidth
                    required
                    variant="filled"
                  />
                </Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' } }}>
                  <TextField
                    label="Bairro"
                    name="cliente_bairro"
                    value={form.cliente_bairro ?? ""}
                    onChange={handleChange}
                    fullWidth
                    required
                    variant="filled"
                  />
                </Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' } }}>
                  <TextField
                    label="Cidade"
                    name="cliente_cidade"
                    value={form.cliente_cidade ?? ""}
                    onChange={handleChange}
                    fullWidth
                    required
                    variant="filled"
                  />
                </Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' } }}>
                  <TextField
                    label="Estado"
                    name="cliente_estado"
                    value={form.cliente_estado ?? ""}
                    onChange={handleChange}
                    fullWidth
                    required
                    variant="filled"
                  />
                </Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}>
                  <TextField
                    label="Número"
                    name="cliente_numero"
                    value={form.cliente_numero ?? ""}
                    onChange={handleChange}
                    fullWidth
                    required
                    variant="filled"
                  />
                </Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 9' } }}>
                  <TextField
                    label="Complemento"
                    name="cliente_complemento"
                    value={form.cliente_complemento ?? ""}
                    onChange={handleChange}
                    fullWidth
                    variant="filled"
                  />
                </Box>
              </Box>
              {/* Dependentes */}
              <Typography variant="h6" fontWeight={700} mb={2} color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleIcon sx={{ fontSize: 28 }} /> Dependentes ({dependentes.length}/5)
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Adicione até 5 dependentes (opcional):
                </Typography>
                
                {/* Formulário para adicionar dependente */}
                <Paper sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: 'grey.50' }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gap: 2, mb: 2 }}>
                    <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 6' } }}>
                      <TextField
                        label="Nome Completo"
                        value={dependenteAtual.nome}
                        onChange={(e) => setDependenteAtual({ ...dependenteAtual, nome: formatarNome(e.target.value) })}
                        fullWidth
                        variant="filled"
                        size="small"
                      />
                    </Box>
                    <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}>
                      <TextField
                        label="Data de Nascimento"
                        value={dependenteAtual.data_nascimento}
                        onChange={(e) => setDependenteAtual({ ...dependenteAtual, data_nascimento: e.target.value })}
                        fullWidth
                        variant="filled"
                        size="small"
                        InputProps={{
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          inputComponent: IMaskInput as any,
                          inputProps: { mask: '00/00/0000' }
                        }}
                      />
                    </Box>
                    <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}>
                      <TextField
                        select
                        label="Parentesco"
                        value={dependenteAtual.parentesco}
                        onChange={(e) => setDependenteAtual({ ...dependenteAtual, parentesco: e.target.value })}
                        fullWidth
                        variant="filled"
                        size="small"
                      >
                        {parentescos.map((parentesco) => (
                          <MenuItem key={parentesco} value={parentesco}>
                            {parentesco}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={adicionarDependente}
                    disabled={dependentes.length >= 5}
                    startIcon={<AddIcon />}
                    sx={{ mr: 1 }}
                  >
                    Adicionar Dependente
                  </Button>
                  {dependentes.length > 0 && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={limparDependentes}
                      startIcon={<ClearIcon />}
                    >
                      Limpar Todos
                    </Button>
                  )}
                </Paper>

                {/* Lista de dependentes */}
                {dependentes.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600} mb={2}>
                      Dependentes Adicionados:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {dependentes.map((dependente, index) => (
                        <Paper key={index} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight={600}>
                                {dependente.nome}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {dependente.data_nascimento} • {dependente.parentesco}
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removerDependente(index)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
              {/* Pagamento */}
              <Typography variant="h6" fontWeight={700} mb={2} color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CreditCardIcon sx={{ fontSize: 28 }} /> Forma de Pagamento
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gap: 2 }}>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 12' } }}>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Selecione a forma de pagamento:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    {formasPagamento.map((forma) => (
                      <Card
                        key={forma}
                        sx={{
                          cursor: 'pointer',
                          border: form.forma_pagamento === forma ? 2 : 1,
                          borderColor: form.forma_pagamento === forma ? 'primary.main' : 'divider',
                          bgcolor: form.forma_pagamento === forma ? 'primary.50' : 'background.paper',
                          '&:hover': { borderColor: 'primary.main' },
                          boxShadow: form.forma_pagamento === forma ? 4 : 1,
                          transition: 'all 0.2s',
                          flex: 1,
                          minWidth: 0,
                        }}
                        onClick={() => {
                          const novaForma = forma;
                          let novoValor = 0;
                          
                          if (novaForma === 'PIX') {
                            novoValor = 3990.00;
                          } else if (novaForma === 'Cartão de Crédito') {
                            // Manter a quantidade de parcelas atual ou usar 1 como padrão
                            const parcelasAtual = form.quantidade_parcelas || 1;
                            
                            if (parcelasAtual === 1) {
                              novoValor = 3990.00;
                            } else if (parcelasAtual >= 2 && parcelasAtual <= 4) {
                              novoValor = 4150.00;
                            } else if (parcelasAtual >= 5 && parcelasAtual <= 7) {
                              novoValor = 4290.00;
                            } else if (parcelasAtual >= 8 && parcelasAtual <= 10) {
                              novoValor = 4450.00;
                            } else if (parcelasAtual >= 11 && parcelasAtual <= 12) {
                              novoValor = 4590.00;
                            }
                          }
                          
                          setForm({ 
                            ...form, 
                            forma_pagamento: novaForma,
                            valor_total: novoValor
                          });
                        }}
                      >
                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                          {forma === 'PIX' ? (
                            <QrCodeIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                          ) : (
                            <CreditCardIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                          )}
                          <Typography variant="body2" fontWeight={600}>
                            {forma}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </Box>
                {form.forma_pagamento === "Cartão de Crédito" && (
                  <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 6' } }}>
                    <TextField
                      select
                      label="Quantidade de Parcelas"
                      name="quantidade_parcelas"
                      value={form.quantidade_parcelas ?? 1}
                      onChange={(e) => {
                        const novasParcelas = Number(e.target.value);
                        let novoValor = form.valor_total;
                        
                        // Só atualizar o valor se a forma de pagamento for Cartão de Crédito
                        if (form.forma_pagamento === 'Cartão de Crédito') {
                          if (novasParcelas === 1) {
                            novoValor = 3990.00;
                          } else if (novasParcelas >= 2 && novasParcelas <= 4) {
                            novoValor = 4150.00;
                          } else if (novasParcelas >= 5 && novasParcelas <= 7) {
                            novoValor = 4290.00;
                          } else if (novasParcelas >= 8 && novasParcelas <= 10) {
                            novoValor = 4450.00;
                          } else if (novasParcelas >= 11 && novasParcelas <= 12) {
                            novoValor = 4590.00;
                          }
                        }
                        
                        setForm({ 
                          ...form, 
                          quantidade_parcelas: novasParcelas,
                          valor_total: novoValor
                        });
                      }}
                      fullWidth
                      variant="filled"
                    >
                      {parcelas.map((parcela) => (
                        <MenuItem key={parcela} value={parcela}>
                          {parcela}x
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>
                )}
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 6' } }}>
                  <NumericFormat
                    customInput={TextField}
                    label="Valor Total do Contrato*"
                    name="valor_total"
                    value={form.valor_total}
                    onValueChange={({ floatValue }) => setForm({ ...form, valor_total: floatValue || 0 })}
                    thousandSeparator="."
                    decimalSeparator="," 
                    decimalScale={2}
                    fixedDecimalScale
                    allowNegative={false}
                    prefix="R$ "
                    fullWidth
                    required
                    variant="filled"
                    InputProps={{
                      readOnly: form.forma_pagamento !== '',
                      sx: {
                        bgcolor: form.forma_pagamento !== '' ? 'grey.50' : 'background.paper',
                        '& .MuiInputBase-input': {
                          cursor: form.forma_pagamento !== '' ? 'default' : 'text'
                        }
                      }
                    }}
                    helperText={form.forma_pagamento !== '' ? 'Valor definido automaticamente pela forma de pagamento' : ''}
                  />
                </Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 6' } }}>
                  <TextField
                    label="Data de Pagamento"
                    name="data_pagamento"
                    type="date"
                    value={form.data_pagamento ?? new Date().toISOString().split('T')[0]}
                    onChange={handleChange}
                    fullWidth
                    required
                    variant="filled"
                  />
                </Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 6' } }}>
                  <TextField
                    label="Corretor"
                    name="corretor"
                    value={form.corretor ?? ""}
                    onChange={handleChange}
                    fullWidth
                    required
                    variant="filled"
                    placeholder="Nome do corretor"
                    InputProps={{
                      readOnly: !editando,
                      sx: {
                        bgcolor: !editando ? 'grey.50' : 'background.paper',
                        '& .MuiInputBase-input': {
                          cursor: !editando ? 'default' : 'text'
                        }
                      }
                    }}
                    helperText={!editando ? 'Preenchido automaticamente com o usuário logado' : ''}
                  />
                </Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 6' } }}>
                  <TextField
                    select
                    label="Tipo de Contrato"
                    name="tipo_contrato"
                    value={form.tipo_contrato ?? "Lote Vitalício Therra"}
                    onChange={handleChange}
                    fullWidth
                    required
                    variant="filled"
                    InputProps={{
                      readOnly: true,
                      sx: {
                        bgcolor: 'grey.50',
                        '& .MuiInputBase-input': {
                          cursor: 'default'
                        }
                      }
                    }}
                    helperText="Tipo de contrato fixo"
                  >
                    {tiposContrato.map((tipo) => (
                      <MenuItem key={tipo} value={tipo}>
                        {tipo}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              </Box>
            </Box>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.default', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, p: 3 }}>
          <Button onClick={fecharModal} variant="outlined" color="secondary" sx={{ borderRadius: 3, fontWeight: 600, minWidth: 120 }}>Cancelar</Button>
          <Button onClick={salvarVenda} variant="contained" color="primary" sx={{ borderRadius: 3, fontWeight: 700, minWidth: 180 }} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Contrato'}
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
    </PermissionGuard>
  );
} 