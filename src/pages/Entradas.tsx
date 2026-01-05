import { useState, useRef, useMemo } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Search, Download, Plus, Upload, Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { NewBetForm } from '@/components/forms/NewBetForm';
import { EditEntradaModal } from '@/components/forms/EditEntradaModal';
import { EntradasFilter, FilterState } from '@/components/filters/EntradasFilter';
import { useBanca, Entrada } from '@/contexts/BancaContext';
import { useExportCSV } from '@/hooks/useExportCSV';

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

const mapResultado = (value: string): 'G' | 'P' | 'C' | 'D' | 'Pendente' => {
  const upper = value?.toUpperCase().trim();
  if (!upper || upper === '') return 'Pendente';
  if (upper === 'G' || upper === 'GREEN' || upper === 'GANHOU') return 'G';
  if (upper === 'P' || upper === 'RED' || upper === 'PERDEU') return 'P';
  if (upper === 'C' || upper === 'CASHOUT' || upper === 'CASH') return 'C';
  if (upper === 'D' || upper === 'DEVOLVIDA' || upper === 'DEV') return 'D';
  return 'Pendente';
};

const Entradas = () => {
  const [showNewBetForm, setShowNewBetForm] = useState(false);
  const [editingEntrada, setEditingEntrada] = useState<Entrada | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: undefined,
    dateTo: undefined,
    resultado: '',
    modalidade: '',
    mercado: '',
    site: '',
    sortBy: 'data',
    sortOrder: 'desc',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Get unique values for filters
  const modalidades = useMemo(() => [...new Set(entradasDaBanca.map(e => e.modalidade).filter(Boolean))], [entradasDaBanca]);
  const mercados = useMemo(() => [...new Set(entradasDaBanca.map(e => e.mercado).filter(Boolean))], [entradasDaBanca]);
  const sites = useMemo(() => [...new Set(entradasDaBanca.map(e => e.site).filter(Boolean))], [entradasDaBanca]);

  // Apply filters and sorting
  const filteredEntradas = useMemo(() => {
    let result = entradasDaBanca.filter(entrada =>
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
    if (filters.site) {
      result = result.filter(e => e.site === filters.site);
    }

    // Apply sorting: Pending entries always on top, then sort by event date
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
          // Sort by event date instead of registration date
          const aEventDate = a.dataEvento || a.data;
          const bEventDate = b.dataEvento || b.data;
          comparison = new Date(aEventDate).getTime() - new Date(bEventDate).getTime();
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
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [entradasDaBanca, searchTerm, filters]);

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
      
      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i];
        
        if (cols.length >= 10) {
          const cleanField = (field: string) => field?.replace(/\s*\n\s*/g, ' ').trim() || '';
          
          novasEntradas.push({
            data: cleanField(cols[0]),
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
      }

      if (novasEntradas.length === 0) {
        toast.error('Nenhuma entrada válida encontrada no CSV.');
        return;
      }

      await addEntradas(novasEntradas);
      toast.success(`${novasEntradas.length} entradas importadas para a banca "${selectedBanca?.name}"!`);
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
      case 'G': return 'Ganhou';
      case 'P': return 'Perdeu';
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
        <Header onNewEntry={() => setShowNewBetForm(true)} />
        
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
                      <TableHead className="text-xs">Data</TableHead>
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
                      
                      return (
                        <TableRow key={entrada.id} className="text-xs">
                          <TableCell className="text-muted-foreground text-xs py-2">{entrada.data}</TableCell>
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
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={() => setEditingEntrada(entrada)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
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
