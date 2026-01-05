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
  selectedBanca: Banca | null;
  setSelectedBanca: (banca: Banca) => void;
  addBanca: (name: string, initialBalance: number) => void;
  editBanca: (id: string, name: string, balance: number, initialBalance: number) => void;
  entradas: Entrada[];
  addEntradas: (novasEntradas: Omit<Entrada, 'id' | 'bancaId'>[]) => void;
  getEntradasByBanca: () => Entrada[];
}

const BancaContext = createContext<BancaContextType | undefined>(undefined);

export function BancaProvider({ children }: { children: ReactNode }) {
  const [bancas, setBancas] = useState<Banca[]>([
    { id: '1', name: '2024', balance: 8500, initialBalance: 5000 },
    { id: '2', name: '2025', balance: 12350.75, initialBalance: 10000 },
    { id: '3', name: 'Futebol', balance: 3200, initialBalance: 2000 },
  ]);
  const [selectedBanca, setSelectedBanca] = useState<Banca>(bancas[1]);
  const [entradas, setEntradas] = useState<Entrada[]>([]);

  const addBanca = (name: string, initialBalance: number) => {
    const newBanca: Banca = {
      id: Date.now().toString(),
      name: name.trim(),
      balance: initialBalance,
      initialBalance: initialBalance,
    };
    setBancas([...bancas, newBanca]);
    setSelectedBanca(newBanca);
  };

  const editBanca = (id: string, name: string, balance: number, initialBalance: number) => {
    setBancas(prev => prev.map(b => 
      b.id === id ? { ...b, name: name.trim(), balance, initialBalance } : b
    ));
    if (selectedBanca?.id === id) {
      setSelectedBanca({ ...selectedBanca, name: name.trim(), balance, initialBalance });
    }
  };
  const addEntradas = (novasEntradas: Omit<Entrada, 'id' | 'bancaId'>[]) => {
    if (!selectedBanca) return;

    const entradasComId: Entrada[] = novasEntradas.map((entrada, index) => ({
      ...entrada,
      id: `${Date.now()}-${index}`,
      bancaId: selectedBanca.id,
    }));

    const deltaBalance = entradasComId.reduce((acc, e) => acc + (e.lucro || 0), 0);

    setEntradas(prev => [...prev, ...entradasComId]);

    // Atualiza o saldo atual da banca com base no lucro/prejuízo das novas entradas
    if (deltaBalance !== 0) {
      setBancas(prev =>
        prev.map(b => (b.id === selectedBanca.id ? { ...b, balance: b.balance + deltaBalance } : b))
      );
      setSelectedBanca(prev => ({ ...prev, balance: prev.balance + deltaBalance }));
    }
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
