import { Search, Bell, Filter, Plus, Calendar, ChevronDown, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

interface HeaderProps {
  onNewEntry: () => void;
}

export function Header({ onNewEntry }: HeaderProps) {
  const [selectedBanca, setSelectedBanca] = useState('2025');

  return (
    <header className="h-[72px] bg-card border-b border-border flex items-center justify-between px-6">
      {/* Welcome + Banca Selector */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
            <span className="text-sm font-semibold text-white">JB</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">João Bets</h2>
            <p className="text-sm text-muted-foreground">Bem-vindo de volta! 🎯</p>
          </div>
        </div>

        {/* Banca Selector */}
        <Select value={selectedBanca} onValueChange={setSelectedBanca}>
          <SelectTrigger className="w-[140px] bg-transparent border-border text-foreground">
            <Wallet className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Selecionar banca" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="2024">Banca 2024</SelectItem>
            <SelectItem value="2025">Banca 2025</SelectItem>
            <SelectItem value="2026">Banca 2026</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Search className="w-5 h-5" />
        </Button>

        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
        </Button>

        <Button variant="outline" className="gap-2 text-foreground border-border bg-transparent hover:bg-muted">
          <Calendar className="w-4 h-4" />
          Último mês
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>

        <Button variant="outline" className="gap-2 text-foreground border-border bg-transparent hover:bg-muted">
          <Filter className="w-4 h-4" />
          Filtrar
        </Button>

        <Button onClick={onNewEntry} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-4 h-4" />
          Cadastrar Entrada
        </Button>
      </div>
    </header>
  );
}
