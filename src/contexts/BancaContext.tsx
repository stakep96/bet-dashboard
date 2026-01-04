import { createContext, useContext, useState, ReactNode } from 'react';

interface Banca {
  id: string;
  name: string;
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
    { id: '1', name: '2024' },
    { id: '2', name: '2025' },
    { id: '3', name: 'Futebol' },
  ]);
  const [selectedBanca, setSelectedBanca] = useState<Banca>(bancas[1]); // 2025 por padrão

  const addBanca = (name: string) => {
    const newBanca: Banca = {
      id: Date.now().toString(),
      name: name.trim(),
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
