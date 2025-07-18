"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Paper,
  Divider,
  Alert
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { supabase } from "@/lib/supabase";

type FuncaoSistema = {
  id: number;
  codigo: string;
  nome: string;
  descricao: string;
  categoria: string;
  ativo: boolean;
};

type FuncoesSelectorProps = {
  selectedFuncoes: string[];
  onFuncoesChange: (funcoes: string[]) => void;
  disabled?: boolean;
};

export default function FuncoesSelector({ selectedFuncoes, onFuncoesChange, disabled = false }: FuncoesSelectorProps) {
  const [funcoes, setFuncoes] = useState<FuncaoSistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar funções do sistema
  useEffect(() => {
    async function carregarFuncoes() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('funcoes_sistema')
          .select('*')
          .eq('ativo', true)
          .order('categoria')
          .order('nome');

        if (error) throw error;
        setFuncoes(data || []);
      } catch (error) {
        console.error('Erro ao carregar funções:', error);
        setError('Erro ao carregar funções do sistema');
      } finally {
        setLoading(false);
      }
    }

    carregarFuncoes();
  }, []);

  // Agrupar funções por categoria
  const funcoesPorCategoria = funcoes.reduce((acc, funcao) => {
    if (!acc[funcao.categoria]) {
      acc[funcao.categoria] = [];
    }
    acc[funcao.categoria].push(funcao);
    return acc;
  }, {} as Record<string, FuncaoSistema[]>);

  // Verificar se uma função está selecionada
  const isFuncaoSelected = (codigo: string) => selectedFuncoes.includes(codigo);

  // Alternar seleção de uma função
  const toggleFuncao = (codigo: string) => {
    if (disabled) return;

    const newSelected = isFuncaoSelected(codigo)
      ? selectedFuncoes.filter(f => f !== codigo)
      : [...selectedFuncoes, codigo];
    
    onFuncoesChange(newSelected);
  };

  // Selecionar todas as funções de uma categoria
  const selectAllCategoria = (categoria: string) => {
    if (disabled) return;

    const funcoesCategoria = funcoesPorCategoria[categoria].map(f => f.codigo);
    const todasSelecionadas = funcoesCategoria.every(f => isFuncaoSelected(f));
    
    if (todasSelecionadas) {
      // Desmarcar todas
      const newSelected = selectedFuncoes.filter(f => !funcoesCategoria.includes(f));
      onFuncoesChange(newSelected);
    } else {
      // Marcar todas
      const newSelected = [...new Set([...selectedFuncoes, ...funcoesCategoria])];
      onFuncoesChange(newSelected);
    }
  };

  // Verificar se todas as funções de uma categoria estão selecionadas
  const isAllSelected = (categoria: string) => {
    const funcoesCategoria = funcoesPorCategoria[categoria].map(f => f.codigo);
    return funcoesCategoria.every(f => isFuncaoSelected(f));
  };

  // Verificar se algumas funções de uma categoria estão selecionadas
  const isSomeSelected = (categoria: string) => {
    const funcoesCategoria = funcoesPorCategoria[categoria].map(f => f.codigo);
    return funcoesCategoria.some(f => isFuncaoSelected(f)) && !isAllSelected(categoria);
  };

  if (loading) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>Carregando funções...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Funções e Permissões
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Selecione as funções que este usuário terá acesso no sistema
      </Typography>

      {Object.entries(funcoesPorCategoria).map(([categoria, funcoesCategoria]) => (
        <Accordion key={categoria} defaultExpanded sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isAllSelected(categoria)}
                    indeterminate={isSomeSelected(categoria)}
                    onChange={() => selectAllCategoria(categoria)}
                    disabled={disabled}
                    onClick={(e) => e.stopPropagation()}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {categoria}
                    </Typography>
                    <Chip 
                      label={`${funcoesCategoria.filter(f => isFuncaoSelected(f.codigo)).length}/${funcoesCategoria.length}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                }
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <FormControl component="fieldset" fullWidth>
              <FormGroup>
                {funcoesCategoria.map((funcao) => (
                  <FormControlLabel
                    key={funcao.id}
                    control={
                      <Checkbox
                        checked={isFuncaoSelected(funcao.codigo)}
                        onChange={() => toggleFuncao(funcao.codigo)}
                        disabled={disabled}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {funcao.nome}
                        </Typography>
                        {funcao.descricao && (
                          <Typography variant="caption" color="text.secondary">
                            {funcao.descricao}
                          </Typography>
                        )}
                      </Box>
                    }
                    sx={{ 
                      mb: 1,
                      '& .MuiFormControlLabel-label': { width: '100%' }
                    }}
                  />
                ))}
              </FormGroup>
            </FormControl>
          </AccordionDetails>
        </Accordion>
      ))}

      {selectedFuncoes.length > 0 && (
        <Paper sx={{ p: 2, mt: 2, bgcolor: 'primary.50' }}>
          <Typography variant="subtitle2" gutterBottom>
            Funções Selecionadas ({selectedFuncoes.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selectedFuncoes.map((codigo) => {
              const funcao = funcoes.find(f => f.codigo === codigo);
              return (
                <Chip
                  key={codigo}
                  label={funcao?.nome || codigo}
                  size="small"
                  color="primary"
                  variant="filled"
                />
              );
            })}
          </Box>
        </Paper>
      )}
    </Box>
  );
} 