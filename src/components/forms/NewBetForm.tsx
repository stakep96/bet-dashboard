import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BetModality, BetTiming, BetResult } from '@/types/bet';

interface NewBetFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const modalities: BetModality[] = ['FUTEBOL', 'MMA', 'BASQUETE', 'TÊNIS', 'ESPORTS', 'OUTRO'];
const timings: BetTiming[] = ['PRÉ', 'LIVE'];
const results: BetResult[] = ['GREEN', 'RED', 'CASHOUT', 'DEVOLVIDA', 'PENDING'];
const bookmakers = ['Bet365', 'Betsson', 'Ultrabet', 'Betano', 'Sportingbet', 'Pinnacle', 'Betfair'];

const markets = [
  'Total escanteios',
  'Resultado final',
  'Ambas marcam',
  'Total gols',
  'Handicap',
  'Vencedor',
  'Over/Under',
  'Outro'
];

export function NewBetForm({ onClose, onSubmit }: NewBetFormProps) {
  const [formData, setFormData] = useState({
    createdAt: new Date().toISOString().split('T')[0],
    eventDate: new Date().toISOString().split('T')[0],
    modality: '' as BetModality,
    match: '',
    market: '',
    entry: '',
    odd: '',
    stake: '',
    result: 'PENDING' as BetResult,
    timing: 'PRÉ' as BetTiming,
    bookmaker: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const odd = parseFloat(formData.odd);
    const stake = parseFloat(formData.stake);
    
    let profitLoss = 0;
    if (formData.result === 'GREEN') {
      profitLoss = stake * (odd - 1);
    } else if (formData.result === 'RED') {
      profitLoss = -stake;
    }

    onSubmit({
      ...formData,
      id: Date.now().toString(),
      createdAt: new Date(formData.createdAt),
      eventDate: new Date(formData.eventDate),
      odd,
      stake,
      profitLoss,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Cadastrar Nova Entrada</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data do Cadastro</Label>
              <Input 
                type="date"
                value={formData.createdAt}
                onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Data do Evento</Label>
              <Input 
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Modalidade e Partida */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Modalidade</Label>
              <Select 
                value={formData.modality} 
                onValueChange={(v) => setFormData({ ...formData, modality: v as BetModality })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {modalities.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Partida / Confronto</Label>
              <Input 
                placeholder="Ex: Flamengo x Palmeiras"
                value={formData.match}
                onChange={(e) => setFormData({ ...formData, match: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Mercado e Entrada */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mercado</Label>
              <Select 
                value={formData.market} 
                onValueChange={(v) => setFormData({ ...formData, market: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {markets.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Entrada (Descrição)</Label>
              <Input 
                placeholder="Ex: Acima de 9.5"
                value={formData.entry}
                onChange={(e) => setFormData({ ...formData, entry: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Odd, Stake e Casa */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Odd</Label>
              <Input 
                type="number"
                step="0.01"
                min="1"
                placeholder="1.85"
                value={formData.odd}
                onChange={(e) => setFormData({ ...formData, odd: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Stake (R$)</Label>
              <Input 
                type="number"
                step="0.01"
                min="0"
                placeholder="100.00"
                value={formData.stake}
                onChange={(e) => setFormData({ ...formData, stake: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Casa de Apostas</Label>
              <Select 
                value={formData.bookmaker} 
                onValueChange={(v) => setFormData({ ...formData, bookmaker: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {bookmakers.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resultado e Timing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Resultado</Label>
              <Select 
                value={formData.result} 
                onValueChange={(v) => setFormData({ ...formData, result: v as BetResult })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="GREEN">Green (Ganho)</SelectItem>
                  <SelectItem value="RED">Red (Perda)</SelectItem>
                  <SelectItem value="CASHOUT">Cashout</SelectItem>
                  <SelectItem value="DEVOLVIDA">Devolvida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>PRÉ / LIVE</Label>
              <Select 
                value={formData.timing} 
                onValueChange={(v) => setFormData({ ...formData, timing: v as BetTiming })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {timings.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
              Cadastrar Entrada
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
