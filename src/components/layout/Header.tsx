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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useMemo } from 'react';
import { useBanca } from '@/contexts/BancaContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HeaderProps {
  onNewEntry: () => void;
  selectedMonth?: Date | null;
  onMonthChange?: (month: Date | null) => void;
  availableMonths?: Date[];
}

export function Header({ onNewEntry, selectedMonth, onMonthChange, availableMonths }: HeaderProps) {
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
  const [monthFilterOpen, setMonthFilterOpen] = useState(false);
  const [monthSearch, setMonthSearch] = useState('');

  // Generate month options - all 12 months based on the year of available data
  const monthOptions = useMemo(() => {
    if (!availableMonths || availableMonths.length === 0) {
      // No data - return empty
      return [];
    }
    
    // Get the year from the earliest entry
    const years = availableMonths.map(d => d.getFullYear());
    const baseYear = Math.min(...years);
    
    // Generate all 12 months for that year
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date(baseYear, i, 1);
      return {
        value: date,
        label: format(date, "MMMM", { locale: ptBR }),
      };
    });
  }, [availableMonths]);

  const filteredMonths = useMemo(() => {
    if (!monthSearch) return monthOptions;
    return monthOptions.filter(m => 
      m.label.toLowerCase().includes(monthSearch.toLowerCase())
    );
  }, [monthOptions, monthSearch]);

  const isAnual = selectedMonth === null;
  const selectedLabel = isAnual ? 'Anual' : format(selectedMonth || new Date(), "MMMM", { locale: ptBR });

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
    <header className="h-[72px] bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Welcome + Banca Selector */}
      <div className="flex items-center gap-6">
        {/* Banca Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[180px] justify-between bg-transparent border-border text-foreground hover:bg-transparent">
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
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-transparent">
          <Search className="w-5 h-5" />
        </Button>

        <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-transparent relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
        </Button>

        <Popover open={monthFilterOpen} onOpenChange={setMonthFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[180px] justify-between gap-2 text-foreground border-border bg-transparent hover:bg-transparent hover:text-foreground capitalize">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{selectedLabel}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[220px] p-0 bg-popover border border-border shadow-lg z-50" 
            align="end"
          >
            <div className="p-2 border-b border-border">
              <Input
                placeholder="Buscar mês..."
                value={monthSearch}
                onChange={(e) => setMonthSearch(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="max-h-[320px] overflow-y-auto p-1">
              {/* Opção Anual destacada */}
              <button
                onClick={() => {
                  onMonthChange?.(null);
                  setMonthFilterOpen(false);
                  setMonthSearch('');
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors font-medium",
                  "hover:bg-primary hover:text-primary-foreground",
                  isAnual ? "bg-primary text-primary-foreground" : "text-primary"
                )}
              >
                {isAnual && <Check className="h-4 w-4" />}
                <span className={cn(!isAnual && "ml-6")}>Anual</span>
              </button>
              
              <div className="my-1 border-t border-border" />
              
              {/* Meses de Janeiro a Dezembro */}
              {filteredMonths.map((month) => {
                const isSelected = !isAnual && selectedMonth && month.value.getMonth() === selectedMonth.getMonth();
                return (
                  <button
                    key={month.label}
                    onClick={() => {
                      onMonthChange?.(month.value);
                      setMonthFilterOpen(false);
                      setMonthSearch('');
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md capitalize transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-accent text-accent-foreground font-medium"
                    )}
                  >
                    {isSelected && <Check className="h-4 w-4" />}
                    <span className={cn(!isSelected && "ml-6")}>{month.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="p-2 border-t border-border flex justify-end">
              <Button 
                size="sm" 
                onClick={() => {
                  setMonthFilterOpen(false);
                  setMonthSearch('');
                }}
              >
                OK
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="outline" className="gap-2 text-foreground border-border bg-transparent hover:bg-transparent hover:text-foreground">
          <Filter className="w-4 h-4" />
          Filtrar
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
