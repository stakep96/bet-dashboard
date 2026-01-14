import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Search, Download, Plus, Upload, Pencil, Trash2, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { NewBetForm } from '@/components/forms/NewBetForm';
import { EditEntradaModal } from '@/components/forms/EditEntradaModal';
import { EntradasFilter, FilterState } from '@/components/filters/EntradasFilter';
import { useBanca, Entrada } from '@/contexts/BancaContext';
import { useExportCSV } from '@/hooks/useExportCSV';
import { startOfMonth, endOfMonth } from 'date-fns';

// Custom hook to persist modal state across tab switches
function useModalState<T>(initialValue: T): [T, (value: T | ((prev: T) => T)) => void, React.MutableRefObject<T>] {
  const [state, setState] = useState<T>(initialValue);
  const stateRef = useRef<T>(initialValue);
  
  const setStateStable = useCallback((value: T | ((prev: T) => T)) => {
    if (typeof value === 'function') {
      setState(prev => {
        const newValue = (value as (prev: T) => T)(prev);
        stateRef.current = newValue;
        return newValue;
      });
    } else {
      stateRef.current = value;
      setState(value);
    }
  }, []);
  
  return [state, setStateStable, stateRef];
}

const parseCSV = (content: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
      currentRow.push(currentField.trim());
      if (currentRow.some(field => field !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
      if (char === '\r') i++;
    } else if (char !== '\r') {
      currentField += char;
    }
  }
  
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(field => field !== '')) {
      rows.push(currentRow);
    }
  }
  
  return rows;
};

const parseMoneyValue = (value: string): number => {
  if (!value) return 0;
  const cleaned = value.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim();
  return parseFloat(cleaned) || 0;
};

const parseOdd = (value: string): number => {
  if (!value) return 0;
  return parseFloat(value.replace(',', '.').trim()) || 0;
};

const mapResultado = (value: string): 'G' | 'P' | 'C' | 'D' | 'GM' | 'PM' | 'Pendente' => {
  const upper = value?.toUpperCase().trim();
  if (!upper || upper === '') return 'Pendente';
  if (upper === 'G' || upper === 'GREEN' || upper === 'GANHA' || upper === 'GANHOU') return 'G';
  if (upper === 'P' || upper === 'RED' || upper === 'PERDIDA' || upper === 'PERDEU') return 'P';
  if (upper === 'GM' || upper === 'GREEN_HALF' || upper === 'GANHOU METADE') return 'GM';
  if (upper === 'PM' || upper === 'RED_HALF' || upper === 'PERDEU METADE') return 'PM';
  if (upper === 'C' || upper === 'CASHOUT' || upper === 'CASH') return 'C';
  if (upper === 'D' || upper === 'DEVOLVIDA' || upper === 'DEV') return 'D';
  return 'Pendente';
};

const Entradas = () => {
  // Use stable modal state that persists across re-renders triggered by visibility changes
  const [showNewBetForm, setShowNewBetForm, showNewBetFormRef] = useModalState(false);
  const [editingEntrada, setEditingEntrada, editingEntradaRef] = useModalState<Entrada | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: undefined,
    dateTo: undefined,
    resultado: '',
    modalidade: '',
    mercado: '',
    sites: [], // Empty array means all sites selected
    sortBy: 'data',
    sortOrder: 'desc',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Prevent visibility change from resetting modal state
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Restore modal state from refs when tab becomes visible
        if (showNewBetFormRef.current && !showNewBetForm) {
          setShowNewBetForm(true);
        }
        if (editingEntradaRef.current && !editingEntrada) {
          setEditingEntrada(editingEntradaRef.current);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [showNewBetForm, editingEntrada, setShowNewBetForm, setEditingEntrada, showNewBetFormRef, editingEntradaRef]);
  const { 
    getEntradasByBanca, 
    addEntradas, 
    updateEntrada, 
    deleteEntrada,
    selectedBancaIds, 
    bancas, 
    isVisaoGeral,
    loading 
  } = useBanca();
  const { exportToCSV } = useExportCSV();
  
  const entradasDaBanca = getEntradasByBanca();

  // Selection handlers
  const handleToggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedIds(new Set(filteredEntradas.map(e => e.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // Get available months for the filter
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    entradasDaBanca.forEach(e => {
      const date = new Date(e.dataEvento || e.data);
      if (!isNaN(date.getTime())) {
        months.add(`${date.getFullYear()}-${date.getMonth()}`);
      }
    });
    return Array.from(months).map(key => {
      const [year, month] = key.split('-').map(Number);
      return new Date(year, month, 1);
    }).sort((a, b) => b.getTime() - a.getTime());
  }, [entradasDaBanca]);

  // Filter entries by selected month (month only, ignoring year)
  const entradasFiltradasPorMes = useMemo(() => {
    if (selectedMonth === null) {
      return entradasDaBanca;
    }
    const selectedMonthIndex = selectedMonth.getMonth();
    return entradasDaBanca.filter(e => {
      const date = new Date(e.dataEvento || e.data);
      return date.getMonth() === selectedMonthIndex;
    });
  }, [entradasDaBanca, selectedMonth]);

  // Get unique values for filters
  const modalidades = useMemo(() => [...new Set(entradasFiltradasPorMes.map(e => e.modalidade).filter(Boolean))], [entradasFiltradasPorMes]);
  const mercados = useMemo(() => [...new Set(entradasFiltradasPorMes.map(e => e.mercado).filter(Boolean))], [entradasFiltradasPorMes]);
  const sites = useMemo(() => [...new Set(entradasFiltradasPorMes.map(e => e.site).filter(Boolean))], [entradasFiltradasPorMes]);

  // Apply filters and sorting
  const filteredEntradas = useMemo(() => {
    let result = entradasFiltradasPorMes.filter(entrada =>
      entrada.evento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entrada.mercado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entrada.modalidade.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply filters
    if (filters.dateFrom) {
      result = result.filter(e => new Date(e.data) >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      result = result.filter(e => new Date(e.data) <= filters.dateTo!);
    }
    if (filters.resultado) {
      result = result.filter(e => e.resultado === filters.resultado);
    }
    if (filters.modalidade) {
      result = result.filter(e => e.modalidade === filters.modalidade);
    }
    if (filters.mercado) {
      result = result.filter(e => e.mercado === filters.mercado);
    }
    // Apply sites filter (multi-select)
    if (filters.sites.length > 0) {
      result = result.filter(e => filters.sites.includes(e.site));
    }

    // Helper to get the last date from a potentially multi-date string (for multiple bets)
    const getLastEventDate = (dateStr: string | undefined, fallback: string): Date => {
      if (!dateStr) return new Date(fallback + 'T00:00:00');
      // For multiple bets, dates are separated by '|', use the last one for sorting
      const dates = dateStr.split('|');
      const lastDate = dates[dates.length - 1].trim();
      return new Date(lastDate + 'T00:00:00');
    };

    // Apply sorting: Pending entries always on top, then sort by event date, then by created_at
    result.sort((a, b) => {
      // Pending entries first
      const aIsPending = a.resultado === 'Pendente';
      const bIsPending = b.resultado === 'Pendente';
      
      if (aIsPending && !bIsPending) return -1;
      if (!aIsPending && bIsPending) return 1;
      
      // Then apply the selected sort
      let comparison = 0;
      switch (filters.sortBy) {
        case 'data':
          // Sort by event date (using last date for multiple bets)
          const aEventDate = getLastEventDate(a.dataEvento, a.data);
          const bEventDate = getLastEventDate(b.dataEvento, b.data);
          comparison = aEventDate.getTime() - bEventDate.getTime();
          break;
        case 'lucro':
          comparison = a.lucro - b.lucro;
          break;
        case 'stake':
          comparison = a.stake - b.stake;
          break;
        case 'odd':
          comparison = a.odd - b.odd;
          break;
      }
      
      // If primary sort is equal, sort by created_at (newest first for desc, oldest first for asc)
      if (comparison === 0) {
        const aCreated = new Date(a.data + 'T00:00:00').getTime();
        const bCreated = new Date(b.data + 'T00:00:00').getTime();
        const createdComparison = bCreated - aCreated; // Newest first by default
        return filters.sortOrder === 'asc' ? -createdComparison : createdComparison;
      }
      
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [entradasFiltradasPorMes, searchTerm, filters]);

  // Calculate selected stats
  const selectedStats = useMemo(() => {
    const selectedEntradas = filteredEntradas.filter(e => selectedIds.has(e.id));
    return {
      count: selectedEntradas.length,
      totalStake: selectedEntradas.reduce((sum, e) => sum + e.stake, 0),
      totalProfit: selectedEntradas.reduce((sum, e) => sum + e.lucro, 0),
    };
  }, [filteredEntradas, selectedIds]);

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Por favor, selecione um arquivo CSV válido.');
      return;
    }

    if (selectedBancaIds.length !== 1) {
      toast.error('Selecione apenas uma banca antes de importar.');
      return;
    }

    const selectedBanca = bancas.find(b => b.id === selectedBancaIds[0]);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const rows = parseCSV(content);
      
      if (rows.length <= 1) {
        toast.error('O arquivo CSV está vazio ou contém apenas cabeçalho.');
        return;
      }

      const novasEntradas: Omit<Entrada, 'id' | 'bancaId'>[] = [];
      const linhasIgnoradas: { linha: number; motivo: string }[] = [];
      
      // Helper para validar data
      const isValidDate = (value: string): boolean => {
        if (!value || value.trim() === '') return false;
        const v = value.trim();
        // YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return true;
        // DD/MM/YYYY or DD-MM-YYYY
        if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}$/.test(v)) return true;
        // Try parsing as date
        const d = new Date(v);
        return !isNaN(d.getTime());
      };
      
      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i];
        const linhaCSV = i + 1; // linha no arquivo (considerando header)
        
        // Verificar se tem colunas suficientes
        if (cols.length < 10) {
          linhasIgnoradas.push({ linha: linhaCSV, motivo: `Apenas ${cols.length} colunas (mínimo 10)` });
          continue;
        }
        
        const cleanField = (field: string) => field?.replace(/\s*\n\s*/g, ' ').trim() || '';
        const dataRegistro = cleanField(cols[0]);
        
        // Verificar se a data de registro é válida
        if (!isValidDate(dataRegistro)) {
          linhasIgnoradas.push({ linha: linhaCSV, motivo: `Data inválida: "${dataRegistro}"` });
          continue;
        }
        
        novasEntradas.push({
          data: dataRegistro,
          modalidade: cleanField(cols[1]),
          dataEvento: cleanField(cols[2]),
          evento: cleanField(cols[3]),
          mercado: cleanField(cols[4]),
          entrada: cleanField(cols[5]),
          odd: parseOdd(cols[6]),
          stake: parseMoneyValue(cols[7]),
          resultado: mapResultado(cols[8]),
          lucro: parseMoneyValue(cols[9]),
          timing: cleanField(cols[10]) || 'PRÉ',
          site: cleanField(cols[11]),
        });
      }

      // Log detalhado das linhas ignoradas
      if (linhasIgnoradas.length > 0) {
        console.warn(`Importação CSV: ${linhasIgnoradas.length} linhas ignoradas:`);
        linhasIgnoradas.slice(0, 20).forEach(({ linha, motivo }) => {
          console.warn(`  Linha ${linha}: ${motivo}`);
        });
        if (linhasIgnoradas.length > 20) {
          console.warn(`  ... e mais ${linhasIgnoradas.length - 20} linhas`);
        }
      }

      if (novasEntradas.length === 0) {
        const motivos = [...new Set(linhasIgnoradas.map(l => l.motivo))].slice(0, 3).join('; ');
        toast.error(`Nenhuma entrada válida encontrada. Problemas: ${motivos}`);
        return;
      }

      try {
        await addEntradas(novasEntradas);
        if (linhasIgnoradas.length > 0) {
          toast.warning(`${novasEntradas.length} entradas importadas, ${linhasIgnoradas.length} linhas ignoradas (veja console para detalhes).`);
        } else {
          toast.success(`${novasEntradas.length} entradas importadas para a banca "${selectedBanca?.name}"!`);
        }
      } catch (err: any) {
        toast.error(err?.message || 'Erro ao importar entradas. Verifique o formato das datas (use YYYY-MM-DD ou DD/MM/YYYY).');
      }
    };
    reader.onerror = () => {
      toast.error('Erro ao ler o arquivo CSV.');
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = () => {
    const selectedBanca = bancas.find(b => b.id === selectedBancaIds[0]);
    const result = exportToCSV(filteredEntradas, {
      bancaName: isVisaoGeral ? 'visao_geral' : selectedBanca?.name,
    });
    
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const getResultadoLabel = (resultado: string) => {
    switch (resultado) {
      case 'G': return 'Ganha';
      case 'P': return 'Perdida';
      case 'GM': return 'Ganhou ½';
      case 'PM': return 'Perdeu ½';
      case 'C': return 'Cashout';
      case 'D': return 'Devolvida';
      case 'Pendente': return 'Pendente';
      default: return 'Pendente';
    }
  };

  const getResultadoVariant = (resultado: string) => {
    switch (resultado) {
      case 'G': return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'P': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      case 'GM': return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'PM': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      case 'C': return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      case 'D': return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
      case 'Pendente': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      default: return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-72">
        <Header onNewEntry={() => setShowNewBetForm(true)} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} availableMonths={availableMonths} />
        
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Entradas</h1>
              <p className="text-muted-foreground">
                {isVisaoGeral ? 'Visão Geral - Todas as bancas' : `Banca "${bancas.find(b => b.id === selectedBancaIds[0])?.name || ''}"`} ({filteredEntradas.length} entradas)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
              />
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()} 
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Importar CSV
              </Button>
              <Button onClick={() => setShowNewBetForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Entrada
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Todas as Entradas</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar entrada..." 
                      className="pl-9 w-[250px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <EntradasFilter
                    filters={filters}
                    onFiltersChange={setFilters}
                    modalidades={modalidades}
                    mercados={mercados}
                    sites={sites}
                  />
                  <Button variant="outline" size="icon" onClick={handleExport}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredEntradas.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhuma entrada encontrada.</p>
                  <p className="text-sm mt-1">Importe um CSV ou adicione entradas manualmente.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead className="w-10">
                        <Checkbox 
                          checked={selectedIds.size === filteredEntradas.length && filteredEntradas.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="text-xs">Data</TableHead>
                      <TableHead className="text-xs">Data Evento</TableHead>
                      <TableHead className="text-xs">Modalidade</TableHead>
                      <TableHead className="text-xs">Evento</TableHead>
                      <TableHead className="text-xs">Mercado</TableHead>
                      <TableHead className="text-xs">Entrada</TableHead>
                      <TableHead className="text-xs text-center">Odd</TableHead>
                      <TableHead className="text-xs text-right">Stake</TableHead>
                      <TableHead className="text-xs text-center">Resultado</TableHead>
                      <TableHead className="text-xs text-right">Lucro/Perda</TableHead>
                      <TableHead className="text-xs">Site</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntradas.map((entrada) => {
                      const eventos = entrada.evento.split('|').map(e => e.trim()).filter(Boolean);
                      const mercados = entrada.mercado.split('|').map(m => m.trim()).filter(Boolean);
                      const entradas = (entrada.entrada || '').split('|').map(e => e.trim()).filter(Boolean);
                      
                      // Get the latest event date for combined bets
                      const getLatestEventDate = (dateString: string | undefined) => {
                        if (!dateString) return '-';
                        const dates = dateString.split('|').map(d => d.trim()).filter(Boolean);
                        if (dates.length === 0) return '-';
                        if (dates.length === 1) return dates[0];
                        // Sort dates and return the latest one
                        const sortedDates = dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
                        return sortedDates[0];
                      };
                      
                      return (
                        <TableRow key={entrada.id} className={`text-xs ${selectedIds.has(entrada.id) ? 'bg-primary/15' : ''}`}>
                          <TableCell className="py-2">
                            <Checkbox 
                              checked={selectedIds.has(entrada.id)}
                              onCheckedChange={() => handleToggleSelection(entrada.id)}
                            />
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs py-2">{entrada.data}</TableCell>
                          <TableCell className="text-muted-foreground text-xs py-2">{getLatestEventDate(entrada.dataEvento)}</TableCell>
                          <TableCell className="py-2">
                            <Badge variant="outline" className="text-xs">{entrada.modalidade}</Badge>
                          </TableCell>
                          <TableCell className="font-medium max-w-[200px] py-2">
                            <div className="flex flex-col gap-0.5">
                              {eventos.map((ev, idx) => (
                                <span key={idx} className="text-xs">{ev}</span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[150px] py-2">
                            <div className="flex flex-col gap-0.5">
                              {mercados.length > 0 ? mercados.map((m, idx) => (
                                <span key={idx} className="text-xs">{m}</span>
                              )) : <span className="text-xs">-</span>}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[120px] py-2">
                            <div className="flex flex-col gap-0.5">
                              {entradas.length > 0 ? entradas.map((e, idx) => (
                                <span key={idx} className="text-xs">{e}</span>
                              )) : <span className="text-xs">-</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-xs py-2">{entrada.odd.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-xs py-2">R$ {entrada.stake.toFixed(2)}</TableCell>
                          <TableCell className="text-center py-2">
                            <Badge className={`text-xs ${getResultadoVariant(entrada.resultado)}`}>
                              {getResultadoLabel(entrada.resultado)}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-medium text-xs py-2 ${entrada.lucro >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {entrada.lucro >= 0 ? '+' : ''}R$ {entrada.lucro.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs py-2">{entrada.site}</TableCell>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => setEditingEntrada(entrada)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  if (confirm('Tem certeza que deseja excluir esta entrada?')) {
                                    deleteEntrada(entrada.id);
                                    toast.success('Entrada excluída com sucesso!');
                                  }
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>

        {/* Selection footer bar */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-0 left-72 right-0 bg-card border-t border-border px-6 py-3 flex items-center justify-end gap-6 shadow-lg z-50">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Selecionados:</span>
              <Badge variant="secondary" className="font-semibold">{selectedStats.count}</Badge>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Stake:</span>
              <span className="font-medium text-sm">R$ {selectedStats.totalStake.toFixed(2)}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Lucro/Perda:</span>
              <span className={`font-medium text-sm ${selectedStats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {selectedStats.totalProfit >= 0 ? '+' : ''}R$ {selectedStats.totalProfit.toFixed(2)}
              </span>
            </div>
            <div className="h-4 w-px bg-border" />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedIds(new Set())}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Limpar seleção
            </Button>
          </div>
        )}
      </div>

      {showNewBetForm && (
        <NewBetForm 
          onClose={() => setShowNewBetForm(false)}
          onSubmit={async (data) => {
            if (selectedBancaIds.length !== 1) {
              toast.error('Selecione apenas uma banca para cadastrar a entrada.');
              return false;
            }

            const toISODate = (value: any) => {
              if (!value) return new Date().toISOString().split('T')[0];
              const d = value instanceof Date ? value : new Date(value);
              if (Number.isNaN(d.getTime())) return String(value);
              return d.toISOString().split('T')[0];
            };

            const mapRes = (value: any): Entrada['resultado'] => {
              const v = String(value || '').toUpperCase().trim();
              if (v === 'GREEN' || v === 'G') return 'G';
              if (v === 'RED' || v === 'P') return 'P';
              if (v === 'CASHOUT' || v === 'CASH' || v === 'C') return 'C';
              if (v === 'DEVOLVIDA' || v === 'DEV' || v === 'D') return 'D';
              return 'Pendente';
            };

            try {
              await addEntradas([
                {
                  data: toISODate(data?.createdAt),
                  dataEvento: toISODate(data?.eventDate),
                  modalidade: (data?.modality || 'OUTRO') as string,
                  evento: String(data?.match || ''),
                  mercado: String(data?.market || ''),
                  entrada: String(data?.entry || ''),
                  odd: Number(data?.odd || 0),
                  stake: Number(data?.stake || 0),
                  resultado: mapRes(data?.result),
                  lucro: Number(data?.profitLoss || 0),
                  timing: String(data?.timing || 'PRÉ'),
                  site: String(data?.bookmaker || ''),
                },
              ]);

              return true;
            } catch {
              toast.error('Erro ao salvar entrada.');
              return false;
            }
          }}
        />
      )}

      {editingEntrada && (
        <EditEntradaModal
          entrada={editingEntrada}
          onClose={() => setEditingEntrada(null)}
          onSave={updateEntrada}
          onDelete={deleteEntrada}
        />
      )}
    </div>
  );
};

export default Entradas;
