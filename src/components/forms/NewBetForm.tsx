import { useState, useRef, useCallback } from 'react';
import { X, Upload, Image, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BetModality, BetTiming, BetResult } from '@/types/bet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleImageProcess = useCallback(async (base64Image: string) => {
    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-bet-from-image', {
        body: { imageBase64: base64Image }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao processar imagem');
      }

      if (data?.data) {
        const extracted = data.data;
        setFormData(prev => ({
          ...prev,
          match: extracted.match || prev.match,
          modality: extracted.modality || prev.modality,
          market: extracted.market || prev.market,
          entry: extracted.entry || prev.entry,
          odd: extracted.odd?.toString() || prev.odd,
          stake: extracted.stake?.toString() || prev.stake,
          bookmaker: extracted.bookmaker || prev.bookmaker,
          eventDate: extracted.eventDate || prev.eventDate,
          timing: extracted.timing || prev.timing,
          result: extracted.result || prev.result,
        }));
        toast.success('Dados extraídos com sucesso!');
      }
    } catch (error: any) {
      console.error('Error extracting data:', error);
      toast.error(error.message || 'Erro ao extrair dados da imagem');
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImagePreview(base64);
      handleImageProcess(base64);
    };
    reader.readAsDataURL(file);
  }, [handleImageProcess]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          handleFileSelect(file);
          break;
        }
      }
    }
  }, [handleFileSelect]);

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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onPaste={handlePaste}
    >
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
          {/* Upload de Imagem */}
          <div className="space-y-2">
            <Label>Imagem do Bilhete (opcional)</Label>
            <div
              ref={dropZoneRef}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className={`
                relative border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer
                ${isExtracting ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              
              {isExtracting ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Extraindo dados do bilhete...</p>
                </div>
              ) : imagePreview ? (
                <div className="flex gap-4 items-center">
                  <img 
                    src={imagePreview} 
                    alt="Preview do bilhete" 
                    className="w-24 h-24 object-cover rounded-lg border border-border"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Imagem carregada</p>
                    <p className="text-xs text-muted-foreground">Clique ou arraste para substituir</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex gap-2">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <Image className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      Arraste ou cole (Ctrl+V) a imagem do bilhete
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ou clique para selecionar um arquivo
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

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
