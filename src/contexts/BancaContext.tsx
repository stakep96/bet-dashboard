import { createContext, useContext, useState, ReactNode } from 'react';

interface Banca {
  id: string;
  name: string;
  balance: number;
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
  selectedBanca: Banca | null;
  setSelectedBanca: (banca: Banca) => void;
  addBanca: (name: string, initialBalance?: number) => void;
  editBanca: (id: string, name: string, balance: number) => void;
  entradas: Entrada[];
  addEntradas: (novasEntradas: Omit<Entrada, 'id' | 'bancaId'>[]) => void;
  getEntradasByBanca: () => Entrada[];
}

const BancaContext = createContext<BancaContextType | undefined>(undefined);

export function BancaProvider({ children }: { children: ReactNode }) {
  const [bancas, setBancas] = useState<Banca[]>([
    { id: '1', name: '2024', balance: 8500 },
    { id: '2', name: '2025', balance: 12350.75 },
    { id: '3', name: 'Futebol', balance: 3200 },
  ]);
  const [selectedBanca, setSelectedBanca] = useState<Banca>(bancas[1]);
  const [entradas, setEntradas] = useState<Entrada[]>([]);

  const addBanca = (name: string, initialBalance: number = 0) => {
    const newBanca: Banca = {
      id: Date.now().toString(),
      name: name.trim(),
      balance: initialBalance,
    };
    setBancas([...bancas, newBanca]);
    setSelectedBanca(newBanca);
  };

  const editBanca = (id: string, name: string, balance: number) => {
    setBancas(prev => prev.map(b => 
      b.id === id ? { ...b, name: name.trim(), balance } : b
    ));
    if (selectedBanca?.id === id) {
      setSelectedBanca({ ...selectedBanca, name: name.trim(), balance });
    }
  };
  const addEntradas = (novasEntradas: Omit<Entrada, 'id' | 'bancaId'>[]) => {
    if (!selectedBanca) return;
    
    const entradasComId: Entrada[] = novasEntradas.map((entrada, index) => ({
      ...entrada,
      id: `${Date.now()}-${index}`,
      bancaId: selectedBanca.id,
    }));
    
    setEntradas(prev => [...prev, ...entradasComId]);
  };

  const getEntradasByBanca = (): Entrada[] => {
    if (!selectedBanca) return [];
    return entradas.filter(e => e.bancaId === selectedBanca.id);
  };

  return (
    <BancaContext.Provider value={{ 
      bancas, 
      selectedBanca, 
      setSelectedBanca, 
      addBanca,
      editBanca,
      entradas,
      addEntradas,
      getEntradasByBanca,
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
