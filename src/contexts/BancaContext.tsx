import { createContext, useContext, useState, ReactNode } from 'react';

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
  selectedBancaIds: string[]; // IDs das bancas selecionadas (pode ser múltiplas)
  isVisaoGeral: boolean; // Se está na Visão Geral
  setSelectedBancaIds: (ids: string[]) => void;
  toggleBancaSelection: (id: string) => void;
  selectSingleBanca: (id: string) => void;
  enterVisaoGeral: () => void;
  addBanca: (name: string, initialBalance: number) => void;
  editBanca: (id: string, name: string, balance: number, initialBalance: number) => void;
  entradas: Entrada[];
  addEntradas: (novasEntradas: Omit<Entrada, 'id' | 'bancaId'>[]) => void;
  getEntradasByBanca: () => Entrada[];
  getSelectedBancas: () => Banca[];
  getTotalBalance: () => number;
  getTotalInitialBalance: () => number;
}

const BancaContext = createContext<BancaContextType | undefined>(undefined);

export function BancaProvider({ children }: { children: ReactNode }) {
  const [bancas, setBancas] = useState<Banca[]>([]);
  const [selectedBancaIds, setSelectedBancaIds] = useState<string[]>([]); // Visão Geral = todas selecionadas
  const [isVisaoGeral, setIsVisaoGeral] = useState(true); // Padrão é Visão Geral
  const [entradas, setEntradas] = useState<Entrada[]>([]);

  const enterVisaoGeral = () => {
    setIsVisaoGeral(true);
    setSelectedBancaIds(bancas.map(b => b.id)); // Seleciona todas
  };

  const selectSingleBanca = (id: string) => {
    setIsVisaoGeral(false);
    setSelectedBancaIds([id]);
  };

  const toggleBancaSelection = (id: string) => {
    if (!isVisaoGeral) {
      // Se não está na visão geral, entra nela primeiro
      setIsVisaoGeral(true);
      setSelectedBancaIds(bancas.map(b => b.id));
    }
    
    setSelectedBancaIds(prev => {
      if (prev.includes(id)) {
        const newIds = prev.filter(i => i !== id);
        return newIds.length === 0 ? [id] : newIds; // Não permite deselecionar todas
      }
      return [...prev, id];
    });
  };

  const addBanca = (name: string, initialBalance: number) => {
    const newBanca: Banca = {
      id: Date.now().toString(),
      name: name.trim(),
      balance: initialBalance,
      initialBalance: initialBalance,
    };
    setBancas(prev => [...prev, newBanca]);
    // Ao criar nova banca, seleciona apenas ela
    setIsVisaoGeral(false);
    setSelectedBancaIds([newBanca.id]);
  };

  const editBanca = (id: string, name: string, balance: number, initialBalance: number) => {
    setBancas(prev => prev.map(b => 
      b.id === id ? { ...b, name: name.trim(), balance, initialBalance } : b
    ));
  };

  const addEntradas = (novasEntradas: Omit<Entrada, 'id' | 'bancaId'>[]) => {
    // Só adiciona se tiver uma única banca selecionada
    if (selectedBancaIds.length !== 1) return;
    const bancaId = selectedBancaIds[0];

    const entradasComId: Entrada[] = novasEntradas.map((entrada, index) => ({
      ...entrada,
      id: `${Date.now()}-${index}`,
      bancaId: bancaId,
    }));

    const deltaBalance = entradasComId.reduce((acc, e) => acc + (e.lucro || 0), 0);

    setEntradas(prev => [...prev, ...entradasComId]);

    // Atualiza o saldo atual da banca com base no lucro/prejuízo das novas entradas
    if (deltaBalance !== 0) {
      setBancas(prev =>
        prev.map(b => (b.id === bancaId ? { ...b, balance: b.balance + deltaBalance } : b))
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
      setSelectedBancaIds, 
      toggleBancaSelection,
      selectSingleBanca,
      enterVisaoGeral,
      addBanca,
      editBanca,
      entradas,
      addEntradas,
      getEntradasByBanca,
      getSelectedBancas,
      getTotalBalance,
      getTotalInitialBalance,
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
