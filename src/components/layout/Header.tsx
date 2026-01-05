import { Search, Bell, Filter, Plus, Calendar, ChevronDown, Wallet, Eye, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { useBanca } from '@/contexts/BancaContext';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onNewEntry: () => void;
}

export function Header({ onNewEntry }: HeaderProps) {
  const { 
    bancas, 
    selectedBancaIds,
    isVisaoGeral,
    addBanca,
    enterVisaoGeral,
    selectSingleBanca,
    toggleBancaSelection,
  } = useBanca();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBancaName, setNewBancaName] = useState('');
  const [newBancaBalance, setNewBancaBalance] = useState('');

  const handleCreateBanca = () => {
    if (newBancaName.trim() && newBancaBalance) {
      addBanca(newBancaName, parseFloat(newBancaBalance) || 0);
      setIsDialogOpen(false);
      setNewBancaName('');
      setNewBancaBalance('');
    }
  };

  const getDisplayName = () => {
    if (isVisaoGeral) {
      return 'Visão Geral';
    }
    if (selectedBancaIds.length === 1) {
      const banca = bancas.find(b => b.id === selectedBancaIds[0]);
      return banca?.name || 'Selecionar';
    }
    return `${selectedBancaIds.length} bancas`;
  };

  return (
    <header className="h-[72px] bg-card border-b border-border flex items-center justify-between px-6">
      {/* Welcome + Banca Selector */}
      <div className="flex items-center gap-6">
        {/* Banca Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[180px] justify-between bg-transparent border-border text-foreground">
              <div className="flex items-center gap-2">
                {isVisaoGeral ? (
                  <Eye className="w-4 h-4 text-primary" />
                ) : (
                  <Wallet className="w-4 h-4 text-muted-foreground" />
                )}
                <span className={cn(isVisaoGeral && "text-primary font-medium")}>
                  {getDisplayName()}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[220px] bg-card border-border" align="start">
            {/* Visão Geral */}
            <DropdownMenuItem 
              onClick={enterVisaoGeral}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                isVisaoGeral && "bg-primary/10 text-primary"
              )}
            >
              <Eye className="w-4 h-4" />
              <span className="font-medium">Visão Geral</span>
              {isVisaoGeral && <Check className="w-4 h-4 ml-auto" />}
            </DropdownMenuItem>

            {bancas.length > 0 && (
              <>
                <DropdownMenuSeparator />

                {/* Lista de Bancas */}
                {bancas.map((banca) => {
                  const isSelected = selectedBancaIds.includes(banca.id);
                  const isSingleSelected = !isVisaoGeral && selectedBancaIds.length === 1 && isSelected;

                  return (
                    <DropdownMenuItem 
                      key={banca.id}
                      className={cn(
                        "flex items-center gap-2 cursor-pointer",
                        isSingleSelected && "bg-primary/10 text-primary"
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        selectSingleBanca(banca.id);
                      }}
                    >
                      {isVisaoGeral && (
                        <Checkbox 
                          checked={isSelected}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBancaSelection(banca.id);
                          }}
                          className="mr-1"
                        />
                      )}
                      <span>{banca.name}</span>
                      {isSingleSelected && <Check className="w-4 h-4 ml-auto" />}
                    </DropdownMenuItem>
                  );
                })}
              </>
            )}

            <DropdownMenuSeparator />

            {/* Adicionar Banca */}
            <DropdownMenuItem 
              onClick={() => {
                setNewBancaName('');
                setNewBancaBalance('');
                setIsDialogOpen(true);
              }}
              className="text-primary cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar banca
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="banca-balance">Valor inicial (R$)</Label>
              <Input
                id="banca-balance"
                type="number"
                value={newBancaBalance}
                onChange={(e) => setNewBancaBalance(e.target.value)}
                placeholder="Ex: 1000"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateBanca()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateBanca} disabled={!newBancaName.trim() || !newBancaBalance}>
              Criar Banca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
