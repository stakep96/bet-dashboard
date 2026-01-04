import { useState } from 'react';
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
import { Search, Filter, Download, Plus } from 'lucide-react';
import { NewBetForm } from '@/components/forms/NewBetForm';

const mockEntradas = [
  { id: 1, data: '03/01/2025', evento: 'Real Madrid vs Barcelona', mercado: 'Resultado Final', odd: 1.85, stake: 100, resultado: 'G', lucro: 85 },
  { id: 2, data: '02/01/2025', evento: 'Lakers vs Warriors', mercado: 'Over 220.5', odd: 1.90, stake: 150, resultado: 'G', lucro: 135 },
  { id: 3, data: '02/01/2025', evento: 'Djokovic vs Nadal', mercado: 'Set Handicap', odd: 2.10, stake: 80, resultado: 'P', lucro: -80 },
  { id: 4, data: '01/01/2025', evento: 'Manchester City vs Liverpool', mercado: 'Ambas Marcam', odd: 1.75, stake: 120, resultado: 'G', lucro: 90 },
  { id: 5, data: '01/01/2025', evento: 'Corinthians vs Palmeiras', mercado: 'Under 2.5', odd: 1.95, stake: 100, resultado: 'G', lucro: 95 },
  { id: 6, data: '31/12/2024', evento: 'LOUD vs FURIA', mercado: 'ML LOUD', odd: 1.65, stake: 200, resultado: 'P', lucro: -200 },
  { id: 7, data: '31/12/2024', evento: 'PSG vs Monaco', mercado: 'Handicap -1', odd: 2.20, stake: 75, resultado: 'G', lucro: 90 },
  { id: 8, data: '30/12/2024', evento: 'Bucks vs Celtics', mercado: 'Spread +5.5', odd: 1.88, stake: 100, resultado: 'G', lucro: 88 },
];

const Entradas = () => {
  const [showNewBetForm, setShowNewBetForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntradas = mockEntradas.filter(entrada =>
    entrada.evento.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entrada.mercado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-72">
        <Header onNewEntry={() => setShowNewBetForm(true)} />
        
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Entradas</h1>
              <p className="text-muted-foreground">Histórico completo de todas as suas apostas</p>
            </div>
            <Button onClick={() => setShowNewBetForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Entrada
            </Button>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Mercado</TableHead>
                    <TableHead className="text-center">Odd</TableHead>
                    <TableHead className="text-right">Stake</TableHead>
                    <TableHead className="text-center">Resultado</TableHead>
                    <TableHead className="text-right">Lucro/Perda</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntradas.map((entrada) => (
                    <TableRow key={entrada.id}>
                      <TableCell className="text-muted-foreground">{entrada.data}</TableCell>
                      <TableCell className="font-medium">{entrada.evento}</TableCell>
                      <TableCell>{entrada.mercado}</TableCell>
                      <TableCell className="text-center">{entrada.odd.toFixed(2)}</TableCell>
                      <TableCell className="text-right">R$ {entrada.stake.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={entrada.resultado === 'G' ? 'default' : 'destructive'}
                          className={entrada.resultado === 'G' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : ''}
                        >
                          {entrada.resultado === 'G' ? 'Ganhou' : 'Perdeu'}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${entrada.lucro >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {entrada.lucro >= 0 ? '+' : ''}R$ {entrada.lucro.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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