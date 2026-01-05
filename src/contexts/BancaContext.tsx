import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface Banca {
  id: string;
  name: string;
  balance: number;
  initialBalance: number;
}

export interface Entrada {
  id: string;
  data: string;
  dataEvento: string;
  modalidade: string;
  evento: string;
  mercado: string;
  entrada: string;
  odd: number;
  stake: number;
  resultado: 'G' | 'P' | 'C' | 'D' | 'Pendente';
  lucro: number;
  timing: string;
  site: string;
  bancaId: string;
}

interface BancaContextType {
  bancas: Banca[];
  selectedBancaIds: string[];
  isVisaoGeral: boolean;
  loading: boolean;
  setSelectedBancaIds: (ids: string[]) => void;
  toggleBancaSelection: (id: string) => void;
  selectSingleBanca: (id: string) => void;
  enterVisaoGeral: () => void;
  addBanca: (name: string, initialBalance: number) => Promise<void>;
  editBanca: (id: string, name: string, balance: number, initialBalance: number) => Promise<void>;
  deleteBanca: (id: string) => Promise<void>;
  entradas: Entrada[];
  addEntradas: (novasEntradas: Omit<Entrada, 'id' | 'bancaId'>[]) => Promise<void>;
  updateEntrada: (entrada: Entrada) => Promise<void>;
  deleteEntrada: (id: string) => Promise<void>;
  getEntradasByBanca: () => Entrada[];
  getSelectedBancas: () => Banca[];
  getTotalBalance: () => number;
  getTotalInitialBalance: () => number;
  refreshData: () => Promise<void>;
}

const BancaContext = createContext<BancaContextType | undefined>(undefined);

export function BancaProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [bancas, setBancas] = useState<Banca[]>([]);
  const [selectedBancaIds, setSelectedBancaIds] = useState<string[]>([]);
  const [isVisaoGeral, setIsVisaoGeral] = useState(true);
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBancas = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('bancas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bancas:', error);
      return;
    }

    const mapped: Banca[] = (data || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      balance: Number(b.current_balance),
      initialBalance: Number(b.initial_balance),
    }));

    setBancas(mapped);
    
    // Se está em visão geral, seleciona todas
    if (isVisaoGeral) {
      setSelectedBancaIds(mapped.map(b => b.id));
    }
  }, [user, isVisaoGeral]);

  const fetchEntradas = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('entradas')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching entradas:', error);
      return;
    }

    const mapped: Entrada[] = (data || []).map((e: any) => ({
      id: e.id,
      data: e.date,
      dataEvento: e.date,
      modalidade: e.modality,
      evento: e.event,
      mercado: e.market || '',
      entrada: e.market || '',
      odd: Number(e.odd) || 0,
      stake: Number(e.stake),
      resultado: e.result as Entrada['resultado'],
      lucro: Number(e.profit),
      timing: e.timing || 'PRÉ',
      site: e.betting_house || '',
      bancaId: e.banca_id,
    }));

    setEntradas(mapped);
  }, [user]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchBancas(), fetchEntradas()]);
    setLoading(false);
  }, [fetchBancas, fetchEntradas]);

  useEffect(() => {
    if (user) {
      refreshData();
    } else {
      setBancas([]);
      setEntradas([]);
      setSelectedBancaIds([]);
      setLoading(false);
    }
  }, [user, refreshData]);

  const enterVisaoGeral = () => {
    setIsVisaoGeral(true);
    setSelectedBancaIds(bancas.map(b => b.id));
  };

  const selectSingleBanca = (id: string) => {
    setIsVisaoGeral(false);
    setSelectedBancaIds([id]);
  };

  const toggleBancaSelection = (id: string) => {
    if (!isVisaoGeral) {
      setIsVisaoGeral(true);
      setSelectedBancaIds(bancas.map(b => b.id));
    }
    
    setSelectedBancaIds(prev => {
      if (prev.includes(id)) {
        const newIds = prev.filter(i => i !== id);
        return newIds.length === 0 ? [id] : newIds;
      }
      return [...prev, id];
    });
  };

  const addBanca = async (name: string, initialBalance: number) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('bancas')
      .insert({
        user_id: user.id,
        name: name.trim(),
        initial_balance: initialBalance,
        current_balance: initialBalance,
      })
      .select()
      .single();

    if (error) {
      toast.error('Erro ao criar banca.');
      console.error(error);
      return;
    }

    const newBanca: Banca = {
      id: data.id,
      name: data.name,
      balance: Number(data.current_balance),
      initialBalance: Number(data.initial_balance),
    };

    setBancas(prev => [newBanca, ...prev]);
    setIsVisaoGeral(false);
    setSelectedBancaIds([newBanca.id]);
    toast.success('Banca criada com sucesso!');
  };

  const editBanca = async (id: string, name: string, balance: number, initialBalance: number) => {
    const { error } = await supabase
      .from('bancas')
      .update({
        name: name.trim(),
        current_balance: balance,
        initial_balance: initialBalance,
      })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao editar banca.');
      console.error(error);
      return;
    }

    setBancas(prev => prev.map(b =>
      b.id === id ? { ...b, name: name.trim(), balance, initialBalance } : b
    ));
  };

  const deleteBanca = async (id: string) => {
    const { error } = await supabase
      .from('bancas')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir banca.');
      console.error(error);
      return;
    }

    setBancas(prev => prev.filter(b => b.id !== id));
    setEntradas(prev => prev.filter(e => e.bancaId !== id));
    
    if (selectedBancaIds.includes(id)) {
      const remaining = selectedBancaIds.filter(i => i !== id);
      if (remaining.length === 0) {
        enterVisaoGeral();
      } else {
        setSelectedBancaIds(remaining);
      }
    }
    
    toast.success('Banca excluída com sucesso!');
  };

  const addEntradas = async (novasEntradas: Omit<Entrada, 'id' | 'bancaId'>[]) => {
    if (!user || selectedBancaIds.length !== 1) return;
    const bancaId = selectedBancaIds[0];

    const toInsert = novasEntradas.map(e => ({
      user_id: user.id,
      banca_id: bancaId,
      date: e.data,
      modality: e.modalidade,
      event: e.evento,
      market: e.mercado,
      odd: e.odd,
      stake: e.stake,
      result: e.resultado,
      profit: e.lucro,
      betting_house: e.site,
      timing: e.timing,
    }));

    const { data, error } = await supabase
      .from('entradas')
      .insert(toInsert)
      .select();

    if (error) {
      toast.error('Erro ao salvar entradas.');
      console.error(error);
      return;
    }

    const mapped: Entrada[] = (data || []).map((e: any) => ({
      id: e.id,
      data: e.date,
      dataEvento: e.date,
      modalidade: e.modality,
      evento: e.event,
      mercado: e.market || '',
      entrada: e.market || '',
      odd: Number(e.odd) || 0,
      stake: Number(e.stake),
      resultado: e.result as Entrada['resultado'],
      lucro: Number(e.profit),
      timing: e.timing || 'PRÉ',
      site: e.betting_house || '',
      bancaId: e.banca_id,
    }));

    setEntradas(prev => [...mapped, ...prev]);

    // Update banca balance
    const deltaBalance = mapped.reduce((acc, e) => acc + e.lucro, 0);
    if (deltaBalance !== 0) {
      const banca = bancas.find(b => b.id === bancaId);
      if (banca) {
        await supabase
          .from('bancas')
          .update({ current_balance: banca.balance + deltaBalance })
          .eq('id', bancaId);

        setBancas(prev =>
          prev.map(b => (b.id === bancaId ? { ...b, balance: b.balance + deltaBalance } : b))
        );
      }
    }
  };

  const updateEntrada = async (entrada: Entrada) => {
    // Get old profit to calculate delta
    const oldEntrada = entradas.find(e => e.id === entrada.id);
    const deltaProfit = entrada.lucro - (oldEntrada?.lucro || 0);

    const { error } = await supabase
      .from('entradas')
      .update({
        date: entrada.data,
        modality: entrada.modalidade,
        event: entrada.evento,
        market: entrada.mercado,
        odd: entrada.odd,
        stake: entrada.stake,
        result: entrada.resultado,
        profit: entrada.lucro,
        betting_house: entrada.site,
        timing: entrada.timing,
      })
      .eq('id', entrada.id);

    if (error) {
      throw error;
    }

    setEntradas(prev => prev.map(e => (e.id === entrada.id ? entrada : e)));

    // Update banca balance
    if (deltaProfit !== 0) {
      const banca = bancas.find(b => b.id === entrada.bancaId);
      if (banca) {
        await supabase
          .from('bancas')
          .update({ current_balance: banca.balance + deltaProfit })
          .eq('id', entrada.bancaId);

        setBancas(prev =>
          prev.map(b => (b.id === entrada.bancaId ? { ...b, balance: b.balance + deltaProfit } : b))
        );
      }
    }
  };

  const deleteEntrada = async (id: string) => {
    const entrada = entradas.find(e => e.id === id);
    if (!entrada) return;

    const { error } = await supabase
      .from('entradas')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    setEntradas(prev => prev.filter(e => e.id !== id));

    // Update banca balance
    const banca = bancas.find(b => b.id === entrada.bancaId);
    if (banca) {
      await supabase
        .from('bancas')
        .update({ current_balance: banca.balance - entrada.lucro })
        .eq('id', entrada.bancaId);

      setBancas(prev =>
        prev.map(b => (b.id === entrada.bancaId ? { ...b, balance: b.balance - entrada.lucro } : b))
      );
    }
  };

  const getEntradasByBanca = (): Entrada[] => {
    if (selectedBancaIds.length === 0) return [];
    return entradas.filter(e => selectedBancaIds.includes(e.bancaId));
  };

  const getSelectedBancas = (): Banca[] => {
    return bancas.filter(b => selectedBancaIds.includes(b.id));
  };

  const getTotalBalance = (): number => {
    return getSelectedBancas().reduce((acc, b) => acc + b.balance, 0);
  };

  const getTotalInitialBalance = (): number => {
    return getSelectedBancas().reduce((acc, b) => acc + b.initialBalance, 0);
  };

  return (
    <BancaContext.Provider value={{
      bancas,
      selectedBancaIds,
      isVisaoGeral,
      loading,
      setSelectedBancaIds,
      toggleBancaSelection,
      selectSingleBanca,
      enterVisaoGeral,
      addBanca,
      editBanca,
      deleteBanca,
      entradas,
      addEntradas,
      updateEntrada,
      deleteEntrada,
      getEntradasByBanca,
      getSelectedBancas,
      getTotalBalance,
      getTotalInitialBalance,
      refreshData,
    }}>
      {children}
    </BancaContext.Provider>
  );
}

export function useBanca() {
  const context = useContext(BancaContext);
  if (context === undefined) {
    throw new Error('useBanca must be used within a BancaProvider');
  }
  return context;
}
