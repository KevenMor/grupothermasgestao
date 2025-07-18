import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Funcionalidade {
  id: number;
  nome: string;
  descricao: string;
  categoria: 'menu' | 'acao' | 'relatorio';
  rota: string;
  icone: string;
  ordem: number;
  ativo: boolean;
}

export interface Permissao {
  id: number;
  usuario_id: number;
  funcionalidade_id: number;
  pode_visualizar: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
  pode_exportar: boolean;
  funcionalidade?: Funcionalidade;
}

export interface PermissoesUsuario {
  [funcionalidade: string]: {
    pode_visualizar: boolean;
    pode_criar: boolean;
    pode_editar: boolean;
    pode_excluir: boolean;
    pode_exportar: boolean;
  };
}

export function usePermissions(usuarioId?: number) {
  const [permissoes, setPermissoes] = useState<PermissoesUsuario>({});
  const [funcionalidades, setFuncionalidades] = useState<Funcionalidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar permissões do usuário
  const carregarPermissoes = async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: permissaoError } = await supabase
        .from('permissoes_usuarios')
        .select(`
          *,
          funcionalidade:funcionalidades(*)
        `)
        .eq('usuario_id', id);

      if (permissaoError) throw permissaoError;

      // Organizar permissões por nome da funcionalidade
      const permissoesOrganizadas: PermissoesUsuario = {};
      data?.forEach((permissao: any) => {
        if (permissao.funcionalidade) {
          permissoesOrganizadas[permissao.funcionalidade.nome] = {
            pode_visualizar: permissao.pode_visualizar,
            pode_criar: permissao.pode_criar,
            pode_editar: permissao.pode_editar,
            pode_excluir: permissao.pode_excluir,
            pode_exportar: permissao.pode_exportar,
          };
        }
      });

      setPermissoes(permissoesOrganizadas);
    } catch (err) {
      console.error('Erro ao carregar permissões:', err);
      setError('Erro ao carregar permissões');
    } finally {
      setLoading(false);
    }
  };

  // Carregar todas as funcionalidades
  const carregarFuncionalidades = async () => {
    try {
      console.log('Carregando funcionalidades...');
      const { data, error } = await supabase
        .from('funcionalidades')
        .select('*')
        .eq('ativo', true)
        .order('ordem');

      if (error) throw error;
      console.log('Funcionalidades carregadas:', data);
      setFuncionalidades(data || []);
    } catch (err) {
      console.error('Erro ao carregar funcionalidades:', err);
      setError('Erro ao carregar funcionalidades');
    }
  };

  // Verificar se usuário tem permissão específica
  const temPermissao = (funcionalidade: string, acao: 'visualizar' | 'criar' | 'editar' | 'excluir' | 'exportar'): boolean => {
    const permissao = permissoes[funcionalidade];
    if (!permissao) return false;

    switch (acao) {
      case 'visualizar':
        return permissao.pode_visualizar;
      case 'criar':
        return permissao.pode_criar;
      case 'editar':
        return permissao.pode_editar;
      case 'excluir':
        return permissao.pode_excluir;
      case 'exportar':
        return permissao.pode_exportar;
      default:
        return false;
    }
  };

  // Verificar se usuário pode acessar menu
  const podeAcessarMenu = (menu: string): boolean => {
    return temPermissao(menu, 'visualizar');
  };

  // Atualizar permissão
  const atualizarPermissao = async (
    usuarioId: number,
    funcionalidadeId: number,
    acao: 'pode_visualizar' | 'pode_criar' | 'pode_editar' | 'pode_excluir' | 'pode_exportar',
    valor: boolean
  ) => {
    try {
      const { error } = await supabase
        .from('permissoes_usuarios')
        .upsert({
          usuario_id: usuarioId,
          funcionalidade_id: funcionalidadeId,
          [acao]: valor,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'usuario_id,funcionalidade_id'
        });

      if (error) throw error;

      // Recarregar permissões
      await carregarPermissoes(usuarioId);
      return true;
    } catch (err) {
      console.error('Erro ao atualizar permissão:', err);
      return false;
    }
  };

  // Salvar todas as permissões de um usuário
  const salvarPermissoesUsuario = async (usuarioId: number, novasPermissoes: any[]) => {
    try {
      const { error } = await supabase
        .from('permissoes_usuarios')
        .upsert(novasPermissoes, {
          onConflict: 'usuario_id,funcionalidade_id'
        });

      if (error) throw error;

      // Recarregar permissões
      await carregarPermissoes(usuarioId);
      return true;
    } catch (err) {
      console.error('Erro ao salvar permissões:', err);
      return false;
    }
  };

  useEffect(() => {
    carregarFuncionalidades();
  }, []);

  useEffect(() => {
    if (usuarioId) {
      carregarPermissoes(usuarioId);
    }
  }, [usuarioId]);

  return {
    permissoes,
    funcionalidades,
    loading,
    error,
    temPermissao,
    podeAcessarMenu,
    atualizarPermissao,
    salvarPermissoesUsuario,
    carregarPermissoes,
    carregarFuncionalidades
  };
} 