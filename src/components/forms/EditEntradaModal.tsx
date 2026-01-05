import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';
import { Entrada } from '@/contexts/BancaContext';

interface EditEntradaModalProps {
  entrada: Entrada;
  onClose: () => void;
  onSave: (entrada: Entrada) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

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
      case 'C': return 0; // Cashout would need specific value
      case 'D': return 0;
      default: return 0;
    }
  };

  const handleResultadoChange = (value: 'G' | 'P' | 'C' | 'D' | 'Pendente') => {
    const profit = calculateProfit(value, formData.stake, formData.odd);
    setFormData({ ...formData, resultado: value, lucro: profit });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Entrada</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Modalidade</Label>
              <Input
                value={formData.modalidade}
                onChange={(e) => setFormData({ ...formData, modalidade: e.target.value })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Evento</Label>
            <Input
              value={formData.evento}
              onChange={(e) => setFormData({ ...formData, evento: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mercado</Label>
              <Input
                value={formData.mercado}
                onChange={(e) => setFormData({ ...formData, mercado: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Entrada</Label>
              <Input
                value={formData.entrada}
                onChange={(e) => setFormData({ ...formData, entrada: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Odd</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.odd}
                onChange={(e) => setFormData({ ...formData, odd: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Stake (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.stake}
                onChange={(e) => setFormData({ ...formData, stake: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Resultado</Label>
              <Select
                value={formData.resultado}
                onValueChange={(v) => handleResultadoChange(v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="G">Ganhou</SelectItem>
                  <SelectItem value="P">Perdeu</SelectItem>
                  <SelectItem value="C">Cashout</SelectItem>
                  <SelectItem value="D">Devolvida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
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
              <Label>Timing</Label>
              <Select
                value={formData.timing}
                onValueChange={(v) => setFormData({ ...formData, timing: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRÉ">Pré-live</SelectItem>
                  <SelectItem value="LIVE">Live</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Site</Label>
              <Input
                value={formData.site}
                onChange={(e) => setFormData({ ...formData, site: e.target.value })}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting || saving}
          >
            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving || deleting}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || deleting}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
