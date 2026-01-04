import { Search, Bell, Filter, Plus, Calendar, ChevronDown, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useBanca } from '@/contexts/BancaContext';

interface HeaderProps {
  onNewEntry: () => void;
}

export function Header({ onNewEntry }: HeaderProps) {
  const { bancas, selectedBanca, setSelectedBanca, addBanca } = useBanca();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBancaName, setNewBancaName] = useState('');

  const handleBancaChange = (value: string) => {
    if (value === 'new') {
      setNewBancaName('');
      setIsDialogOpen(true);
    } else {
      const banca = bancas.find(b => b.id === value);
      if (banca) setSelectedBanca(banca);
    }
  };

  const handleCreateBanca = () => {
    if (newBancaName.trim()) {
      addBanca(newBancaName);
      setIsDialogOpen(false);
      setNewBancaName('');
    }
  };

  return (
    <header className="h-[72px] bg-card border-b border-border flex items-center justify-between px-6">
      {/* Welcome + Banca Selector */}
      <div className="flex items-center gap-6">
        {/* Banca Selector */}
        <Select value={selectedBanca?.id || ''} onValueChange={handleBancaChange}>
          <SelectTrigger className="w-[160px] bg-transparent border-border text-foreground">
            <Wallet className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Selecionar banca">
              {selectedBanca?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {bancas.map((banca) => (
              <SelectItem key={banca.id} value={banca.id}>{banca.name}</SelectItem>
            ))}
            <SelectItem value="new" className="text-primary">
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Adicionar banca
              </span>
            </SelectItem>
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

      {/* Modal Nova Banca */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Nova Banca</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="banca-name">Nome da banca</Label>
              <Input
                id="banca-name"
                value={newBancaName}
                onChange={(e) => setNewBancaName(e.target.value)}
                placeholder="Ex: 2025, Futebol, Esports..."
                onKeyDown={(e) => e.key === 'Enter' && handleCreateBanca()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateBanca} disabled={!newBancaName.trim()}>
              Criar Banca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
