import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const isoDateFromAny = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const v = String(value).trim();
  if (!v) return null;

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  // DD/MM/YYYY or DD-MM-YYYY
  const m = v.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3]);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2200) {
      const dd = String(day).padStart(2, '0');
      const mm = String(month).padStart(2, '0');
      return `${year}-${mm}-${dd}`;
    }
  }

  // Fallback: parse ISO-ish strings with time
  const d = new Date(v);
  if (!Number.isNaN(d.getTime())) return d.toISOString().split('T')[0];

  return null;
};

const requireISODate = (value: string | null | undefined, label: string): string => {
  const iso = isoDateFromAny(value);
  if (!iso) throw new Error(`${label} inválida: "${value ?? ''}"`);
  return iso;
};

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
  resultado: 'G' | 'P' | 'C' | 'D' | 'GM' | 'PM' | 'Pendente';
  lucro: number;
  timing: string;
  site: string;
  bancaId: string;
  createdAt: string;
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
  addEntradas: (novasEntradas: Omit<Entrada, 'id' | 'bancaId' | 'createdAt'>[]) => Promise<void>;
  updateEntrada: (entrada: Entrada) => Promise<void>;
  deleteEntrada: (id: string) => Promise<void>;
  getEntradasByBanca: () => Entrada[];
  getSelectedBancas: () => Banca[];
  getTotalBalance: () => number;
  getTotalInitialBalance: () => number;
  refreshData: () => Promise<void>;
  onEntradasAdded: (callback: (entradas: Entrada[], bancaName: string) => void) => () => void;
}

const BancaContext = createContext<BancaContextType | undefined>(undefined);

const STORAGE_KEY = 'banca-view-preference';

interface ViewPreference {
  isVisaoGeral: boolean;
  selectedBancaIds: string[];
}

const loadViewPreference = (): ViewPreference | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading view preference:', e);
  }
  return null;
};

const saveViewPreference = (preference: ViewPreference) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
  } catch (e) {
    console.error('Error saving view preference:', e);
  }
};

export function BancaProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [bancas, setBancas] = useState<Banca[]>([]);
  const [selectedBancaIds, setSelectedBancaIds] = useState<string[]>([]);
  const [isVisaoGeral, setIsVisaoGeral] = useState(true);
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialPreferenceApplied, setInitialPreferenceApplied] = useState(false);
  
  // Callback for when entries are added (used by Zapier integration)
  const entradasAddedCallbacks = useRef<Set<(entradas: Entrada[], bancaName: string) => void>>(new Set());

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
    
    // Apply saved preference only on FIRST load
    if (!initialPreferenceApplied && mapped.length > 0) {
      const savedPref = loadViewPreference();
      if (savedPref) {
        // Validate that saved bancas still exist
        const validIds = savedPref.selectedBancaIds.filter(id => 
          mapped.some(b => b.id === id)
        );
        
        if (validIds.length > 0) {
          setIsVisaoGeral(savedPref.isVisaoGeral);
          setSelectedBancaIds(savedPref.isVisaoGeral ? mapped.map(b => b.id) : validIds);
        } else {
          // Fallback to visão geral if no valid bancas
          setIsVisaoGeral(true);
          setSelectedBancaIds(mapped.map(b => b.id));
        }
      } else {
        // Default to visão geral
        setIsVisaoGeral(true);
        setSelectedBancaIds(mapped.map(b => b.id));
      }
      setInitialPreferenceApplied(true);
    }
    // REMOVED: the "else if (isVisaoGeral)" block that was resetting selectedBancaIds
    // This was causing the bug where values changed after fetch
  }, [user, initialPreferenceApplied]);

  const fetchEntradas = useCallback(async () => {
    if (!user) return;

    // Buscar todas as entradas com paginação para superar o limite de 1000
    const PAGE_SIZE = 1000;
    let allData: any[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('entradas')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        console.error('Error fetching entradas:', error);
        return;
      }

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        offset += PAGE_SIZE;
        hasMore = data.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }

    const mapped: Entrada[] = allData.map((e: any) => ({
      id: e.id,
      data: e.date,
      dataEvento: e.event_date || e.date,
      modalidade: e.modality,
      evento: e.event,
      mercado: e.market || '',
      entrada: e.entry || '',
      odd: Number(e.odd) || 0,
      stake: Number(e.stake),
      resultado: e.result as Entrada['resultado'],
      lucro: Number(e.profit),
      timing: e.timing || 'PRÉ',
      site: e.betting_house || '',
      bancaId: e.banca_id,
      createdAt: e.created_at,
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
      setInitialPreferenceApplied(false);
    }
  }, [user, refreshData]);

  // Save preference whenever selection changes (after initial load)
  useEffect(() => {
    if (initialPreferenceApplied && selectedBancaIds.length > 0) {
      saveViewPreference({
        isVisaoGeral,
        selectedBancaIds: isVisaoGeral ? [] : selectedBancaIds, // Only save specific IDs for single selection
      });
    }
  }, [isVisaoGeral, selectedBancaIds, initialPreferenceApplied]);

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

  const addEntradas = async (novasEntradas: Omit<Entrada, 'id' | 'bancaId' | 'createdAt'>[]) => {
    if (!user || selectedBancaIds.length !== 1) {
      toast.error('Selecione apenas uma banca para cadastrar a entrada.');
      return;
    }

    const bancaId = selectedBancaIds[0];

    const toInsert = novasEntradas.map((e) => {
      const dateISO = requireISODate(e.data, 'Data');
      const eventDateISO = isoDateFromAny(e.dataEvento);

      return {
        user_id: user.id,
        banca_id: bancaId,
        date: dateISO,
        event_date: eventDateISO,
        modality: e.modalidade,
        event: e.evento,
        market: e.mercado,
        entry: e.entrada,
        odd: e.odd,
        stake: e.stake,
        result: e.resultado,
        profit: e.lucro,
        betting_house: e.site,
        timing: e.timing,
      };
    });

    const CHUNK_SIZE = 200;
    const insertedRows: any[] = [];

    for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
      const chunk = toInsert.slice(i, i + CHUNK_SIZE);
      const { data, error } = await supabase
        .from('entradas')
        .insert(chunk)
        .select();

      if (error) {
        console.error(error);
        throw error;
      }

      insertedRows.push(...(data || []));
    }

    const mapped: Entrada[] = insertedRows.map((e: any) => ({
      id: e.id,
      data: e.date,
      dataEvento: e.event_date || e.date,
      modalidade: e.modality,
      evento: e.event,
      mercado: e.market || '',
      entrada: e.entry || '',
      odd: Number(e.odd) || 0,
      stake: Number(e.stake),
      resultado: e.result as Entrada['resultado'],
      lucro: Number(e.profit),
      timing: e.timing || 'PRÉ',
      site: e.betting_house || '',
      bancaId: e.banca_id,
      createdAt: e.created_at,
    }));

    setEntradas((prev) => [...mapped, ...prev]);

    // Update banca balance
    const deltaBalance = mapped.reduce((acc, e) => acc + e.lucro, 0);
    if (deltaBalance !== 0) {
      const banca = bancas.find((b) => b.id === bancaId);
      if (banca) {
        await supabase
          .from('bancas')
          .update({ current_balance: banca.balance + deltaBalance })
          .eq('id', bancaId);

        setBancas((prev) =>
          prev.map((b) => (b.id === bancaId ? { ...b, balance: b.balance + deltaBalance } : b))
        );
      }
    }
    
    // Notify listeners (Zapier integration)
    const bancaName = bancas.find(b => b.id === bancaId)?.name || 'Banca';
    entradasAddedCallbacks.current.forEach(callback => {
      callback(mapped, bancaName);
    });
  };

  const updateEntrada = async (entrada: Entrada) => {
    // Get old profit to calculate delta
    const oldEntrada = entradas.find(e => e.id === entrada.id);
    const deltaProfit = entrada.lucro - (oldEntrada?.lucro || 0);

    const { error } = await supabase
      .from('entradas')
      .update({
        date: entrada.data,
        event_date: entrada.dataEvento,
        modality: entrada.modalidade,
        event: entrada.evento,
        market: entrada.mercado,
        entry: entrada.entrada,
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

  const onEntradasAdded = useCallback((callback: (entradas: Entrada[], bancaName: string) => void) => {
    entradasAddedCallbacks.current.add(callback);
    return () => {
      entradasAddedCallbacks.current.delete(callback);
    };
  }, []);

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
      onEntradasAdded,
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
