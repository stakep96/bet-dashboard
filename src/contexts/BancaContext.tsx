import { createContext, useContext, useState, ReactNode } from 'react';

interface Banca {
  id: string;
  name: string;
  balance: number;
}

interface BancaContextType {
  bancas: Banca[];
  selectedBanca: Banca | null;
  setSelectedBanca: (banca: Banca) => void;
  addBanca: (name: string) => void;
}

const BancaContext = createContext<BancaContextType | undefined>(undefined);

export function BancaProvider({ children }: { children: ReactNode }) {
  const [bancas, setBancas] = useState<Banca[]>([
    { id: '1', name: '2024', balance: 8500 },
    { id: '2', name: '2025', balance: 12350.75 },
    { id: '3', name: 'Futebol', balance: 3200 },
  ]);
  const [selectedBanca, setSelectedBanca] = useState<Banca>(bancas[1]); // 2025 por padrão

  const addBanca = (name: string) => {
    const newBanca: Banca = {
      id: Date.now().toString(),
      name: name.trim(),
      balance: 0,
    };
    setBancas([...bancas, newBanca]);
    setSelectedBanca(newBanca);
  };

  return (
    <BancaContext.Provider value={{ bancas, selectedBanca, setSelectedBanca, addBanca }}>
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
