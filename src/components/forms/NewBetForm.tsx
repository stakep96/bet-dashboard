import { useState, useRef, useCallback } from 'react';
import { X, Upload, Image, Loader2, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Combobox } from '@/components/ui/combobox';
import { BetTiming, BetResult } from '@/types/bet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { bookmakers } from '@/data/bookmakers';
import { modalities } from '@/data/modalities';
import { markets } from '@/data/markets';

interface NewBetFormProps {
  onClose: () => void;
  /**
   * Retorne `true` quando a entrada foi salva com sucesso.
   * Se retornar `false`, o modal NÃO fecha.
   */
  onSubmit: (data: any) => boolean | Promise<boolean>;
}

interface BetSelection {
  id: string;
  match: string;
  modality: string;
  market: string;
  entry: string;
  odd: string;
  eventDate: string;
  timing: BetTiming;
}

const timings: BetTiming[] = ['PRÉ', 'LIVE'];
const results: BetResult[] = ['GREEN', 'RED', 'CASHOUT', 'DEVOLVIDA', 'PENDING'];


const createEmptySelection = (): BetSelection => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  match: '',
  modality: '',
  market: '',
  entry: '',
  odd: '',
  eventDate: new Date().toISOString().split('T')[0],
  timing: 'PRÉ',
});

export function NewBetForm({ onClose, onSubmit }: NewBetFormProps) {
  const [betType, setBetType] = useState<'simple' | 'combined'>('simple');
  const [selections, setSelections] = useState<BetSelection[]>([createEmptySelection()]);
  const [expandedSelections, setExpandedSelections] = useState<Set<string>>(new Set([selections[0].id]));
  
  const [generalData, setGeneralData] = useState({
    createdAt: new Date().toISOString().split('T')[0],
    eventDate: new Date().toISOString().split('T')[0],
    stake: '',
    result: 'PENDING' as BetResult,
    bookmaker: '',
    totalOdd: '',
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
        
        // Set bet type based on extraction
        if (extracted.isCombined && extracted.bets?.length > 1) {
          setBetType('combined');
        }
        
        // Set general data
        setGeneralData(prev => ({
          ...prev,
          stake: extracted.stake?.toString() || prev.stake,
          bookmaker: extracted.bookmaker || prev.bookmaker,
          result: extracted.result || prev.result,
          totalOdd: extracted.totalOdd?.toString() || prev.totalOdd,
        }));

        // Set selections from extracted bets
        if (extracted.bets && extracted.bets.length > 0) {
          const newSelections: BetSelection[] = extracted.bets.map((bet: any, index: number) => ({
            id: Date.now().toString() + index,
            match: bet.match || '',
            modality: bet.modality || '',
            market: bet.market || '',
            entry: bet.entry || '',
            odd: bet.odd?.toString() || '',
            eventDate: bet.eventDate || new Date().toISOString().split('T')[0],
            timing: bet.timing || 'PRÉ',
          }));
          setSelections(newSelections);
          setExpandedSelections(new Set(newSelections.map(s => s.id)));
        }
        
        toast.success(`${extracted.bets?.length || 1} aposta(s) extraída(s) com sucesso!`);
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

  const addSelection = () => {
    const newSelection = createEmptySelection();
    setSelections([...selections, newSelection]);
    setExpandedSelections(prev => new Set([...prev, newSelection.id]));
  };

  const removeSelection = (id: string) => {
    if (selections.length > 1) {
      setSelections(selections.filter(s => s.id !== id));
      setExpandedSelections(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const updateSelection = (id: string, field: keyof BetSelection, value: any) => {
    setSelections(selections.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const toggleExpanded = (id: string) => {
    setExpandedSelections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const calculateTotalOdd = () => {
    if (betType === 'simple') return parseFloat(selections[0]?.odd || '0');
    
    const odds = selections.map(s => parseFloat(s.odd || '0')).filter(o => o > 0);
    if (odds.length === 0) return 0;
    return odds.reduce((acc, odd) => acc * odd, 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const stake = parseFloat(generalData.stake);
    const totalOdd = generalData.totalOdd ? parseFloat(generalData.totalOdd) : calculateTotalOdd();

    let profitLoss = 0;
    if (generalData.result === 'GREEN') {
      profitLoss = stake * (totalOdd - 1);
    } else if (generalData.result === 'RED') {
      profitLoss = -stake;
    }

    // For combined bets, merge all selections into a single entry
    if (betType === 'combined' && selections.length > 1) {
      // Combine event names
      const combinedEvent = selections.map(s => s.match).filter(Boolean).join(' | ');
      // Combine markets
      const combinedMarket = selections.map(s => s.market).filter(Boolean).join(' | ');
      // Combine entries (the actual bet description like "GAM Esports (-1.5)")
      const combinedEntry = selections.map(s => s.entry).filter(Boolean).join(' | ');
      // Use first selection's modality or 'OUTRO'
      const modality = selections[0]?.modality || 'OUTRO';

      const ok = await onSubmit({
        id: Date.now().toString(),
        createdAt: new Date(generalData.createdAt),
        eventDate: new Date(generalData.eventDate),
        modality,
        match: combinedEvent,
        market: combinedMarket,
        entry: combinedEntry,
        odd: totalOdd,
        stake,
        result: generalData.result,
        profitLoss,
        timing: selections[0]?.timing || 'PRÉ',
        bookmaker: generalData.bookmaker,
        betType: 'Múltipla',
      });

      if (ok) onClose();
    } else {
      // Simple bet
      const selection = selections[0];
      const odd = parseFloat(selection.odd) || totalOdd;

      const ok = await onSubmit({
        id: Date.now().toString(),
        createdAt: new Date(generalData.createdAt),
        eventDate: new Date(selection.eventDate),
        modality: selection.modality || 'OUTRO',
        match: selection.match,
        market: selection.market,
        entry: selection.entry,
        odd,
        stake,
        result: generalData.result,
        profitLoss,
        timing: selection.timing,
        bookmaker: generalData.bookmaker,
        betType: 'Simples',
      });

      if (ok) onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onPaste={handlePaste}
    >
      <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">Cadastrar Nova Entrada</h2>
            {betType === 'combined' && selections.length > 1 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {selections.length} seleções
              </Badge>
            )}
          </div>
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
                      Suporta apostas simples, múltiplas e Bet Builder
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tipo de Aposta */}
          <div className="space-y-2">
            <Label>Tipo de Aposta</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={betType === 'simple' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => {
                  setBetType('simple');
                  setSelections([selections[0] || createEmptySelection()]);
                }}
              >
                Simples
              </Button>
              <Button
                type="button"
                variant={betType === 'combined' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setBetType('combined')}
              >
                Múltipla / Bet Builder
              </Button>
            </div>
          </div>

          {/* Seleções */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Seleções</Label>
              {betType === 'combined' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSelection}
                  className="gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar
                </Button>
              )}
            </div>

            {selections.map((selection, index) => (
              <div 
                key={selection.id}
                className="border border-border rounded-xl overflow-hidden"
              >
                {/* Selection Header */}
                <div 
                  className={`flex items-center justify-between p-3 bg-muted/30 cursor-pointer ${betType === 'combined' ? 'hover:bg-muted/50' : ''}`}
                  onClick={() => betType === 'combined' && toggleExpanded(selection.id)}
                >
                  <div className="flex items-center gap-2">
                    {betType === 'combined' && (
                      expandedSelections.has(selection.id) ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )
                    )}
                    <span className="text-sm font-medium">
                      {betType === 'combined' ? `Seleção ${index + 1}` : 'Detalhes da Aposta'}
                    </span>
                    {selection.match && !expandedSelections.has(selection.id) && (
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        — {selection.match}
                      </span>
                    )}
                  </div>
                  {betType === 'combined' && selections.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSelection(selection.id);
                      }}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Selection Fields */}
                {(betType === 'simple' || expandedSelections.has(selection.id)) && (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Modalidade</Label>
                        <Combobox
                          options={modalities}
                          value={selection.modality}
                          onValueChange={(v) => updateSelection(selection.id, 'modality', v)}
                          placeholder="Selecione a modalidade"
                          searchPlaceholder="Buscar modalidade..."
                          emptyText="Nenhuma modalidade encontrada."
                          allowCustom={true}
                          customLabel="Adicionar"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Partida / Confronto</Label>
                        <Input 
                          placeholder="Ex: Flamengo x Palmeiras"
                          value={selection.match}
                          onChange={(e) => updateSelection(selection.id, 'match', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Mercado</Label>
                        <Combobox
                          options={markets}
                          value={selection.market}
                          onValueChange={(v) => updateSelection(selection.id, 'market', v)}
                          placeholder="Selecione o mercado"
                          searchPlaceholder="Buscar mercado..."
                          emptyText="Nenhum mercado encontrado."
                          allowCustom={true}
                          customLabel="Adicionar"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Entrada (Descrição)</Label>
                        <Input 
                          placeholder="Ex: Acima de 9.5"
                          value={selection.entry}
                          onChange={(e) => updateSelection(selection.id, 'entry', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className={`grid ${betType === 'combined' ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
                      <div className="space-y-2">
                        <Label>Odd {betType === 'combined' ? '(individual)' : ''}</Label>
                        <Input 
                          type="number"
                          step="0.01"
                          min="1"
                          placeholder="1.85"
                          value={selection.odd}
                          onChange={(e) => updateSelection(selection.id, 'odd', e.target.value)}
                        />
                      </div>
                      {betType === 'combined' && (
                        <div className="space-y-2">
                          <Label>Data do Evento</Label>
                          <Input 
                            type="date"
                            value={selection.eventDate}
                            onChange={(e) => updateSelection(selection.id, 'eventDate', e.target.value)}
                            required
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>PRÉ / LIVE</Label>
                        <Select 
                          value={selection.timing} 
                          onValueChange={(v) => updateSelection(selection.id, 'timing', v as BetTiming)}
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
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Dados Gerais */}
          <div className="space-y-4 pt-2 border-t border-border">
            <Label className="text-base">Dados Gerais do Bilhete</Label>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Data do Cadastro</Label>
                <Input 
                  type="date"
                  value={generalData.createdAt}
                  onChange={(e) => setGeneralData({ ...generalData, createdAt: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Data do Evento</Label>
                <Input 
                  type="date"
                  value={betType === 'simple' ? selections[0]?.eventDate : generalData.eventDate}
                  onChange={(e) => {
                    if (betType === 'simple') {
                      updateSelection(selections[0]?.id, 'eventDate', e.target.value);
                    } else {
                      setGeneralData({ ...generalData, eventDate: e.target.value });
                    }
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Casa de Apostas</Label>
                <Combobox
                  options={bookmakers}
                  value={generalData.bookmaker}
                  onValueChange={(v) => setGeneralData({ ...generalData, bookmaker: v })}
                  placeholder="Selecione o site"
                  searchPlaceholder="Buscar site..."
                  emptyText="Nenhum site encontrado."
                  allowCustom
                  customLabel="Adicionar"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Stake Total (R$)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="100.00"
                  value={generalData.stake}
                  onChange={(e) => setGeneralData({ ...generalData, stake: e.target.value })}
                  required
                />
              </div>
              {betType === 'combined' && (
                <div className="space-y-2">
                  <Label>Odd Total</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder={calculateTotalOdd().toFixed(2)}
                    value={generalData.totalOdd}
                    onChange={(e) => setGeneralData({ ...generalData, totalOdd: e.target.value })}
                  />
                </div>
              )}
              <div className={`space-y-2 ${betType === 'simple' ? 'col-span-2' : ''}`}>
                <Label>Resultado</Label>
                <Select 
                  value={generalData.result} 
                  onValueChange={(v) => setGeneralData({ ...generalData, result: v as BetResult })}
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