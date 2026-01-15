import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Filter, X, CalendarIcon, ArrowUpDown, Search } from 'lucide-react';

export interface FilterState {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  resultado: string;
  modalidade: string;
  mercado: string;
  sites: string[]; // Changed from single site to array of selected sites
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
  const [siteSearch, setSiteSearch] = useState('');
  const [isSiteFilterOpen, setIsSiteFilterOpen] = useState(false);

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
      sites: [], // Empty means all selected
      sortBy: 'data',
      sortOrder: 'desc',
    });
  };

  // Filtered sites based on search
  const filteredSites = useMemo(() => {
    if (!siteSearch.trim()) return sites;
    return sites.filter(s => s.toLowerCase().includes(siteSearch.toLowerCase()));
  }, [sites, siteSearch]);

  // Check if all sites are selected (empty array means all selected)
  const allSitesSelected = filters.sites.length === 0;
  
  // Check if no sites are selected (all sites in array means none should show)
  const noSitesSelected = filters.sites.length === sites.length && sites.every(s => filters.sites.includes(s));
  
  // Get the actual selected sites for display
  const selectedSitesCount = noSitesSelected ? 0 : (filters.sites.length === 0 ? sites.length : filters.sites.length);

  const handleSelectAllSites = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Select all = set to empty array (which means all selected)
    updateFilter('sites', []);
  };

  const handleClearAllSites = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Clear = deselect all sites (set all sites in array to indicate none selected)
    updateFilter('sites', [...sites]);
  };

  const handleToggleSite = (site: string) => {
    let newSites: string[];
    
    // Empty array = all selected
    if (filters.sites.length === 0) {
      // All are selected, toggling one means deselecting it (add to exclusion list)
      newSites = [site];
    } else {
      // Check if all sites are currently excluded (none selected)
      const allExcluded = filters.sites.length === sites.length && 
        sites.every(s => filters.sites.includes(s));
      
      if (allExcluded) {
        // None are selected, toggling one means selecting only it
        // Remove from exclusion list = select it (show all except the excluded ones)
        newSites = sites.filter(s => s !== site);
      } else if (filters.sites.includes(site)) {
        // Site is in exclusion list (deselected), remove from exclusion (select it)
        newSites = filters.sites.filter(s => s !== site);
        // If exclusion list is now empty, all are selected
        if (newSites.length === 0) {
          newSites = [];
        }
      } else {
        // Site is not in exclusion list (selected), add to exclusion (deselect it)
        newSites = [...filters.sites, site];
      }
    }
    
    updateFilter('sites', newSites);
  };

  const isSiteSelected = (site: string) => {
    // Empty array = all selected
    if (filters.sites.length === 0) return true;
    // All sites in array = none selected (inverted logic for "Limpar")
    if (filters.sites.length === sites.length && sites.every(s => filters.sites.includes(s))) return false;
    // Otherwise, check if site is NOT in the exclusion list
    return !filters.sites.includes(site);
  };

  const hasActiveFilters = 
    filters.dateFrom || 
    filters.dateTo || 
    filters.resultado || 
    filters.modalidade || 
    filters.mercado || 
    (filters.sites.length > 0 && filters.sites.length < sites.length);

  const getSiteFilterLabel = () => {
    if (filters.sites.length === 0 || filters.sites.length === sites.length) {
      return `Todos (${sites.length})`;
    }
    if (filters.sites.length === 1) {
      return filters.sites[0];
    }
    return `${filters.sites.length} selecionados`;
  };

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
                      className="pointer-events-auto"
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
                      className="pointer-events-auto"
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
                  <SelectItem value="G">Ganha</SelectItem>
                  <SelectItem value="P">Perdida</SelectItem>
                  <SelectItem value="GM">Ganhou Metade</SelectItem>
                  <SelectItem value="PM">Perdeu Metade</SelectItem>
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

            {/* Site - Multi-select with checkboxes */}
            <div className="space-y-2">
              <Label>Site</Label>
              <Popover open={isSiteFilterOpen} onOpenChange={setIsSiteFilterOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between font-normal"
                    role="combobox"
                  >
                    <span className="truncate">{getSiteFilterLabel()}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      Mostrando {selectedSitesCount}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="start">
                  <div className="p-3 border-b">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-primary hover:no-underline"
                        onClick={handleSelectAllSites}
                      >
                        Selecionar tudo: {sites.length}
                      </Button>
                      <span className="text-muted-foreground">-</span>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-primary hover:no-underline"
                        onClick={handleClearAllSites}
                      >
                        Limpar
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Mostrando {selectedSitesCount}
                    </div>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar site..."
                        value={siteSearch}
                        onChange={(e) => setSiteSearch(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <ScrollArea className="h-[200px]">
                    <div className="p-2 space-y-1">
                      {filteredSites.map((site) => (
                        <label
                          key={site}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer"
                        >
                          <Checkbox
                            checked={isSiteSelected(site)}
                            onCheckedChange={() => handleToggleSite(site)}
                          />
                          <span className="text-sm truncate">{site}</span>
                        </label>
                      ))}
                      {filteredSites.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum site encontrado
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                  <div className="p-2 border-t flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsSiteFilterOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => setIsSiteFilterOpen(false)}
                    >
                      OK
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
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
