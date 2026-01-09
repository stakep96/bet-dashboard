import { useState, useEffect } from 'react';
import { X, Loader2, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Entrada } from '@/contexts/BancaContext';
import { bookmakers } from '@/data/bookmakers';
import { modalities } from '@/data/modalities';
import { markets } from '@/data/markets';
import { BetTiming, BetResult } from '@/types/bet';

interface EditEntradaModalProps {
  entrada: Entrada;
  onClose: () => void;
  onSave: (entrada: Entrada) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
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

export function EditEntradaModal({ entrada, onClose, onSave, onDelete }: EditEntradaModalProps) {
  const [betType, setBetType] = useState<'simple' | 'combined'>('simple');
  const [selections, setSelections] = useState<BetSelection[]>([createEmptySelection()]);
  const [expandedSelections, setExpandedSelections] = useState<Set<string>>(new Set());
  
  const [generalData, setGeneralData] = useState({
    createdAt: entrada.data,
    eventDate: entrada.dataEvento || entrada.data,
    stake: entrada.stake.toString(),
    result: 'Pendente' as 'G' | 'P' | 'C' | 'D' | 'GM' | 'PM' | 'Pendente',
    bookmaker: entrada.site || '',
    totalOdd: entrada.odd.toString(),
    cashoutValue: '',
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Parse entrada data on mount
  useEffect(() => {
    const isCombined = entrada.evento?.includes('|');
    
    if (isCombined) {
      setBetType('combined');
      
      // Parse selections from concatenated fields
      const events = entrada.evento?.split('|').map(s => s.trim()) || [];
      const parsedMarkets = entrada.mercado?.split('|').map(s => s.trim()) || [];
      const entries = entrada.entrada?.split('|').map(s => s.trim()) || [];
      const eventDates = entrada.dataEvento?.split('|').map(s => s.trim()) || [];
      const timings = entrada.timing?.split('|').map(s => s.trim()) || [];
      
      const parsedSelections: BetSelection[] = events.map((event, index) => ({
        id: Date.now().toString() + index,
        match: event,
        modality: entrada.modalidade || '',
        market: parsedMarkets[index] || '',
        entry: entries[index] || '',
        odd: '',
        eventDate: eventDates[index] || entrada.dataEvento || entrada.data,
        timing: (timings[index] as BetTiming) || 'PRÉ'
      }));
      
      setSelections(parsedSelections.length > 0 ? parsedSelections : [createEmptySelection()]);
      if (parsedSelections.length > 0) {
        setExpandedSelections(new Set([parsedSelections[0].id]));
      }
    } else {
      setBetType('simple');
      const sel: BetSelection = {
        id: Date.now().toString(),
        match: entrada.evento || '',
        modality: entrada.modalidade || '',
        market: entrada.mercado || '',
        entry: entrada.entrada || '',
        odd: entrada.odd?.toString() || '',
        eventDate: entrada.dataEvento || entrada.data,
        timing: (entrada.timing as BetTiming) || 'PRÉ'
      };
      setSelections([sel]);
      setExpandedSelections(new Set([sel.id]));
    }
    
    // Calculate cashout value if result is C (cashout value = stake + profit)
    const cashoutVal = entrada.resultado === 'C' ? (entrada.stake + entrada.lucro).toString() : '';
    
    setGeneralData({
      createdAt: entrada.data,
      eventDate: entrada.dataEvento || entrada.data,
      stake: entrada.stake.toString(),
      result: entrada.resultado,
      bookmaker: entrada.site || '',
      totalOdd: entrada.odd.toString(),
      cashoutValue: cashoutVal,
    });
  }, [entrada]);

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

  const calculateProfit = (resultado: string, stake: number, odd: number, cashoutValue?: number): number => {
    switch (resultado) {
      case 'G': return stake * (odd - 1);
      case 'P': return -stake;
      case 'GM': return (stake * (odd - 1)) / 2; // Ganhou Metade
      case 'PM': return -stake / 2; // Perdeu Metade
      case 'C': return (cashoutValue || 0) - stake; // Cashout: valor recebido - stake
      case 'D': return 0;
      default: return 0;
    }
  };

  const handleResultadoChange = (value: 'G' | 'P' | 'C' | 'D' | 'GM' | 'PM' | 'Pendente') => {
    setGeneralData(prev => ({ ...prev, result: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const stake = parseFloat(generalData.stake) || 0;
      const totalOdd = generalData.totalOdd ? parseFloat(generalData.totalOdd) : calculateTotalOdd();
      const cashoutVal = parseFloat(generalData.cashoutValue) || 0;
      const profit = calculateProfit(generalData.result, stake, totalOdd, cashoutVal);

      let updatedEntrada: Entrada;

      if (betType === 'combined' && selections.length > 1) {
        // Combined bet - merge all selections
        const combinedEvent = selections.map(s => s.match).filter(Boolean).join(' | ');
        const combinedMarket = selections.map(s => s.market).filter(Boolean).join(' | ');
        const combinedEntry = selections.map(s => s.entry).filter(Boolean).join(' | ');
        const combinedEventDates = selections.map(s => s.eventDate).filter(Boolean).join(' | ');
        const combinedTimings = selections.map(s => s.timing).filter(Boolean).join(' | ');
        const modality = selections[0]?.modality || 'OUTRO';

        updatedEntrada = {
          ...entrada,
          data: generalData.createdAt,
          dataEvento: combinedEventDates,
          modalidade: modality,
          evento: combinedEvent,
          mercado: combinedMarket,
          entrada: combinedEntry,
          odd: totalOdd,
          stake,
          resultado: generalData.result,
          lucro: profit,
          timing: combinedTimings,
          site: generalData.bookmaker,
        };
      } else {
        // Simple bet
        const selection = selections[0];
        const odd = parseFloat(selection.odd) || parseFloat(generalData.totalOdd) || 0;

        updatedEntrada = {
          ...entrada,
          data: generalData.createdAt,
          dataEvento: selection.eventDate,
          modalidade: selection.modality || 'OUTRO',
          evento: selection.match,
          mercado: selection.market,
          entrada: selection.entry,
          odd,
          stake,
          resultado: generalData.result,
          lucro: calculateProfit(generalData.result, stake, odd, cashoutVal),
          timing: selection.timing,
          site: generalData.bookmaker,
        };
      }

      await onSave(updatedEntrada);
      toast.success('Entrada atualizada com sucesso!');
      onClose();
    } catch (error) {
      toast.error('Erro ao atualizar entrada.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta entrada?')) return;
    
    setDeleting(true);
    try {
      await onDelete(entrada.id);
      toast.success('Entrada excluída com sucesso!');
      onClose();
    } catch (error) {
      toast.error('Erro ao excluir entrada.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">Editar Entrada</h2>
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

        <div className="p-6 space-y-6">
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
                          value={selection.modality}
                          onValueChange={(v) => updateSelection(selection.id, 'modality', v)}
                          options={modalities}
                          searchPlaceholder="Buscar modalidade..."
                          emptyText="Nenhuma modalidade encontrada."
                          allowCustom={true}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Partida / Confronto</Label>
                        <Input 
                          placeholder="Ex: Flamengo x Palmeiras"
                          value={selection.match}
                          onChange={(e) => updateSelection(selection.id, 'match', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Mercado</Label>
                        <Combobox
                          value={selection.market}
                          onValueChange={(v) => updateSelection(selection.id, 'market', v)}
                          options={markets}
                          searchPlaceholder="Buscar mercado..."
                          emptyText="Nenhum mercado encontrado."
                          allowCustom={true}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Entrada (Descrição)</Label>
                        <Input 
                          placeholder="Ex: Acima de 9.5"
                          value={selection.entry}
                          onChange={(e) => updateSelection(selection.id, 'entry', e.target.value)}
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
              <div className="space-y-2">
                <Label>Resultado</Label>
                <Select 
                  value={generalData.result} 
                  onValueChange={(v) => handleResultadoChange(v as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="G">Ganha</SelectItem>
                    <SelectItem value="P">Perdida</SelectItem>
                    <SelectItem value="GM">Ganhou Metade</SelectItem>
                    <SelectItem value="PM">Perdeu Metade</SelectItem>
                    <SelectItem value="C">Cashout</SelectItem>
                    <SelectItem value="D">Devolvida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {generalData.result === 'C' && (
                <div className="space-y-2">
                  <Label>Valor Recebido</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={generalData.cashoutValue}
                      onChange={(e) => setGeneralData({ ...generalData, cashoutValue: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleting || saving}
              className="gap-2"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
            <div className="flex-1" />
            <Button type="button" variant="outline" onClick={onClose} disabled={saving || deleting}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || deleting} className="bg-primary hover:bg-primary/90">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
