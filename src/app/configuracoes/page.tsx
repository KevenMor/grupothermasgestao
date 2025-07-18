'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { KeyRound } from 'lucide-react';
import { Box, Paper, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';

export default function ConfiguracoesIntegracao() {
  const [chaveApi, setChaveApi] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function fetchConfig() {
      setCarregando(true);
      try {
        const { data, error } = await supabase
          .from('configuracoes_integracao')
          .select('chave_api')
          .eq('nome_sistema', 'asaas')
          .eq('ativo', true)
          .single();
        
        if (error) {
          console.error('Erro ao carregar configuração:', error);
          if (error.code === 'PGRST116') {
            // Configuração não existe ainda, isso é normal
            console.log('Configuração do Asaas não encontrada. Será criada quando salvar.');
          } else {
            setErro('Erro ao carregar configuração: ' + error.message);
          }
        } else if (data) {
          setChaveApi(data.chave_api);
        }
      } catch (err) {
        console.error('Erro inesperado:', err);
        setErro('Erro inesperado ao carregar configuração');
      } finally {
        setCarregando(false);
      }
    }
    fetchConfig();
  }, []);

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    setSucesso(false);
    const { error } = await supabase
      .from('configuracoes_integracao')
      .upsert({ nome_sistema: 'asaas', chave_api: chaveApi, ativo: true }, { onConflict: 'nome_sistema' });
    if (error) {
      setErro('Erro ao salvar: ' + error.message);
    } else {
      setSucesso(true);
    }
    setSalvando(false);
  }

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#f6fafd">
      <Paper elevation={6} sx={{
        p: 5, borderRadius: 4, maxWidth: 500, width: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        boxShadow: '0 8px 32px 0 rgba(31,38,135,0.15)'
      }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <KeyRound size={48} color="#1976d2" />
          <Typography variant="h4" fontWeight={800} color="primary" mt={1} mb={1} textAlign="center">
            Integração Asaas
          </Typography>
        </Box>
        <Typography color="text.secondary" mb={3} textAlign="center">
          Cadastre a chave da API do Asaas para ativar a integração financeira automática do sistema.<br />
          Você pode alterar essa chave a qualquer momento.
        </Typography>
        <form onSubmit={handleSalvar} style={{ width: '100%' }}>
          <TextField
            label="Chave da API do Asaas"
            variant="outlined"
            fullWidth
            value={chaveApi}
            onChange={e => setChaveApi(e.target.value)}
            required
            disabled={carregando || salvando}
            sx={{ mb: 3, fontWeight: 600 }}
            InputProps={{ style: { fontWeight: 600, color: '#222' } }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            sx={{ fontWeight: 700, fontSize: 18, py: 1.5, borderRadius: 2, boxShadow: 2 }}
            disabled={salvando || carregando}
            startIcon={salvando && <CircularProgress size={22} color="inherit" />}
          >
            {salvando ? 'Salvando...' : 'Salvar'}
          </Button>
          {sucesso && <Alert severity="success" sx={{ mt: 3 }}>Configuração salva com sucesso!</Alert>}
          {erro && <Alert severity="error" sx={{ mt: 3 }}>{erro}</Alert>}
        </form>
      </Paper>
    </Box>
  );
} 