import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Filter, X, CalendarIcon, ArrowUpDown } from 'lucide-react';

export interface FilterState {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  resultado: string;
  modalidade: string;
  mercado: string;
  site: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface EntradasFilterProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  modalidades: string[];
  mercados: string[];
  sites: string[];
}

export function EntradasFilter({ filters, onFiltersChange, modalidades, mercados, sites }: EntradasFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      dateFrom: undefined,
      dateTo: undefined,
      resultado: '',
      modalidade: '',
      mercado: '',
      site: '',
      sortBy: 'data',
      sortOrder: 'desc',
    });
  };

  const hasActiveFilters = 
    filters.dateFrom || 
    filters.dateTo || 
    filters.resultado || 
    filters.modalidade || 
    filters.mercado || 
    filters.site;

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <Filter className="h-4 w-4" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filtros</h4>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              )}
            </div>

            {/* Período */}
            <div className="space-y-2">
              <Label>Período</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateFrom ? format(filters.dateFrom, 'dd/MM/yy', { locale: ptBR }) : 'De'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom}
                      onSelect={(date) => updateFilter('dateFrom', date)}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateTo ? format(filters.dateTo, 'dd/MM/yy', { locale: ptBR }) : 'Até'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo}
                      onSelect={(date) => updateFilter('dateTo', date)}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Resultado */}
            <div className="space-y-2">
              <Label>Resultado</Label>
              <Select value={filters.resultado || "_all"} onValueChange={(v) => updateFilter('resultado', v === "_all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todos</SelectItem>
                  <SelectItem value="G">Ganhou</SelectItem>
                  <SelectItem value="P">Perdeu</SelectItem>
                  <SelectItem value="C">Cashout</SelectItem>
                  <SelectItem value="D">Devolvida</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Modalidade */}
            <div className="space-y-2">
              <Label>Modalidade</Label>
              <Select value={filters.modalidade || "_all"} onValueChange={(v) => updateFilter('modalidade', v === "_all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todas</SelectItem>
                  {modalidades.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mercado */}
            <div className="space-y-2">
              <Label>Mercado</Label>
              <Select value={filters.mercado || "_all"} onValueChange={(v) => updateFilter('mercado', v === "_all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todos</SelectItem>
                  {mercados.slice(0, 20).map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Site */}
            <div className="space-y-2">
              <Label>Site</Label>
              <Select value={filters.site || "_all"} onValueChange={(v) => updateFilter('site', v === "_all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todos</SelectItem>
                  {sites.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Ordenação */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon">
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56" align="end">
          <div className="space-y-4">
            <h4 className="font-medium">Ordenar por</h4>
            <Select value={filters.sortBy} onValueChange={(v) => updateFilter('sortBy', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="data">Data</SelectItem>
                <SelectItem value="lucro">Lucro/Prejuízo</SelectItem>
                <SelectItem value="stake">Stake</SelectItem>
                <SelectItem value="odd">Odd</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.sortOrder} onValueChange={(v) => updateFilter('sortOrder', v as 'asc' | 'desc')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Decrescente</SelectItem>
                <SelectItem value="asc">Crescente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
