import { useState } from 'react';
import { X, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { toast } from 'sonner';
import { Entrada } from '@/contexts/BancaContext';
import { bookmakers } from '@/data/bookmakers';

interface EditEntradaModalProps {
  entrada: Entrada;
  onClose: () => void;
  onSave: (entrada: Entrada) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const modalities = ['FUTEBOL', 'MMA', 'BASQUETE', 'TÊNIS', 'ESPORTS', 'OUTRO'];
const timings = ['PRÉ', 'LIVE'];
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

export function EditEntradaModal({ entrada, onClose, onSave, onDelete }: EditEntradaModalProps) {
  const [formData, setFormData] = useState<Entrada>(entrada);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
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

  const calculateProfit = (resultado: string, stake: number, odd: number): number => {
    switch (resultado) {
      case 'G': return stake * (odd - 1);
      case 'P': return -stake;
      case 'C': return 0;
      case 'D': return 0;
      default: return 0;
    }
  };

  const handleResultadoChange = (value: 'G' | 'P' | 'C' | 'D' | 'Pendente') => {
    const profit = calculateProfit(value, formData.stake, formData.odd);
    setFormData({ ...formData, resultado: value, lucro: profit });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Editar Entrada</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Detalhes da Aposta */}
          <div className="space-y-3">
            <Label className="text-base">Detalhes da Aposta</Label>
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="p-3 bg-muted/30">
                <span className="text-sm font-medium">Detalhes da Aposta</span>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Modalidade</Label>
                    <Select 
                      value={formData.modalidade} 
                      onValueChange={(v) => setFormData({ ...formData, modalidade: v })}
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
                      value={formData.evento}
                      onChange={(e) => setFormData({ ...formData, evento: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mercado</Label>
                    <Select 
                      value={formData.mercado || ''} 
                      onValueChange={(v) => setFormData({ ...formData, mercado: v })}
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
                      value={formData.entrada || ''}
                      onChange={(e) => setFormData({ ...formData, entrada: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Odd</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      min="1"
                      placeholder="1.85"
                      value={formData.odd}
                      onChange={(e) => setFormData({ ...formData, odd: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>PRÉ / LIVE</Label>
                    <Select 
                      value={formData.timing || 'PRÉ'} 
                      onValueChange={(v) => setFormData({ ...formData, timing: v })}
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
            </div>
          </div>

          {/* Dados Gerais */}
          <div className="space-y-4 pt-2 border-t border-border">
            <Label className="text-base">Dados Gerais do Bilhete</Label>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Data do Cadastro</Label>
                <Input 
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data do Evento</Label>
                <Input 
                  type="date"
                  value={formData.dataEvento || formData.data}
                  onChange={(e) => setFormData({ ...formData, dataEvento: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Casa de Apostas</Label>
                <Combobox
                  options={bookmakers}
                  value={formData.site || ''}
                  onValueChange={(v) => setFormData({ ...formData, site: v })}
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
                  value={formData.stake}
                  onChange={(e) => setFormData({ ...formData, stake: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Lucro/Prejuízo (R$)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={formData.lucro}
                  onChange={(e) => setFormData({ ...formData, lucro: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Resultado</Label>
                <Select 
                  value={formData.resultado} 
                  onValueChange={(v) => handleResultadoChange(v as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="G">Green (Ganho)</SelectItem>
                    <SelectItem value="P">Red (Perda)</SelectItem>
                    <SelectItem value="C">Cashout</SelectItem>
                    <SelectItem value="D">Devolvida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
