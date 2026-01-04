import { useState, useRef } from 'react';
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
import { Search, Filter, Download, Plus, Upload, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { NewBetForm } from '@/components/forms/NewBetForm';
import { useBanca, Entrada } from '@/contexts/BancaContext';

// Parser CSV que respeita campos com aspas e quebras de linha internas
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
        // Aspas escapadas
        currentField += '"';
        i++;
      } else {
        // Toggle estado de aspas
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
      if (char === '\r') i++; // Pular \n após \r
    } else if (char !== '\r') {
      currentField += char;
    }
  }
  
  // Última linha
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
  const cleaned = value
    .replace(/R\$\s*/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();
  return parseFloat(cleaned) || 0;
};

const parseOdd = (value: string): number => {
  if (!value) return 0;
  const cleaned = value.replace(',', '.').trim();
  return parseFloat(cleaned) || 0;
};

const mapResultado = (value: string): 'G' | 'P' | 'C' | 'D' => {
  const upper = value?.toUpperCase().trim();
  if (upper === 'G' || upper === 'GREEN' || upper === 'GANHOU') return 'G';
  if (upper === 'P' || upper === 'RED' || upper === 'PERDEU') return 'P';
  if (upper === 'C' || upper === 'CASHOUT' || upper === 'CASH') return 'C';
  if (upper === 'D' || upper === 'DEVOLVIDA' || upper === 'DEV') return 'D';
  return 'P';
};

const Entradas = () => {
  const [showNewBetForm, setShowNewBetForm] = useState(false);
  const [editingEntrada, setEditingEntrada] = useState<Entrada | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getEntradasByBanca, addEntradas, selectedBanca } = useBanca();
  
  const entradasDaBanca = getEntradasByBanca();

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Por favor, selecione um arquivo CSV válido.');
      return;
    }

    if (!selectedBanca) {
      toast.error('Selecione uma banca antes de importar.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const rows = parseCSV(content);
      
      if (rows.length <= 1) {
        toast.error('O arquivo CSV está vazio ou contém apenas cabeçalho.');
        return;
      }

      // Pular cabeçalho (primeira linha) e processar restante
      const novasEntradas: Omit<Entrada, 'id' | 'bancaId'>[] = [];
      
      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i];
        
        // Formato: Data, Modalidade, Data do evento, Partida/Confronto, Mercado, Entrada, Odd, Stake, Resultado, G/P, PRÉ/LIVE, Site
        if (cols.length >= 10) {
          // Limpar quebras de linha internas dos campos
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

      addEntradas(novasEntradas);
      toast.success(`${novasEntradas.length} entradas importadas para a banca "${selectedBanca.name}"!`);
    };
    reader.onerror = () => {
      toast.error('Erro ao ler o arquivo CSV.');
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEditEntrada = (entrada: Entrada) => {
    setEditingEntrada(entrada);
    // TODO: Abrir modal de edição
    toast.info(`Editar entrada: ${entrada.evento}`);
  };

  const filteredEntradas = entradasDaBanca.filter(entrada =>
    entrada.evento.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entrada.mercado.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entrada.modalidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getResultadoLabel = (resultado: string) => {
    switch (resultado) {
      case 'G': return 'Ganhou';
      case 'P': return 'Perdeu';
      case 'C': return 'Cashout';
      case 'D': return 'Devolvida';
      default: return resultado;
    }
  };

  const getResultadoVariant = (resultado: string) => {
    switch (resultado) {
      case 'G': return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'P': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      case 'C': return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      case 'D': return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
      default: return '';
    }
  };

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
                Histórico de apostas da banca "{selectedBanca?.name}" ({entradasDaBanca.length} entradas)
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
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
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
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Modalidade</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Mercado</TableHead>
                      <TableHead className="text-center">Odd</TableHead>
                      <TableHead className="text-right">Stake</TableHead>
                      <TableHead className="text-center">Resultado</TableHead>
                      <TableHead className="text-right">Lucro/Perda</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntradas.map((entrada) => (
                      <TableRow key={entrada.id}>
                        <TableCell className="text-muted-foreground">{entrada.data}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{entrada.modalidade}</Badge>
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate" title={entrada.evento}>
                          {entrada.evento}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate" title={entrada.mercado}>
                          {entrada.mercado}
                        </TableCell>
                        <TableCell className="text-center">{entrada.odd.toFixed(2)}</TableCell>
                        <TableCell className="text-right">R$ {entrada.stake.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={getResultadoVariant(entrada.resultado)}>
                            {getResultadoLabel(entrada.resultado)}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${entrada.lucro >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {entrada.lucro >= 0 ? '+' : ''}R$ {entrada.lucro.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{entrada.site}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleEditEntrada(entrada)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
          onSubmit={(data) => {
            console.log('Nova entrada:', data);
            setShowNewBetForm(false);
          }}
        />
      )}
    </div>
  );
};

export default Entradas;
