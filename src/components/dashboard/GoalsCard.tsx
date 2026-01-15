import { useState, useEffect, useMemo } from 'react';
import { Pencil, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBanca } from '@/contexts/BancaContext';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Meta {
  id: string;
  tipo: 'mensal' | 'anual';
  mes: number | null;
  ano: number;
  valor_meta: number;
  banca_id: string | null;
}

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

export function GoalsCard() {
  const { user } = useAuth();
  const { selectedBancaIds, isVisaoGeral } = useBanca();
  const { metrics, monthlyStats } = useDashboardMetrics();
  
  const [metas, setMetas] = useState<Meta[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'anual' | number>('anual');
  const [periodOpen, setPeriodOpen] = useState(false);
  
  // Form states - now derived from which period's edit button was clicked
  const [editingPeriod, setEditingPeriod] = useState<'anual' | number | null>(null);
  const [formValor, setFormValor] = useState('');
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();

  // Fetch metas
  useEffect(() => {
    if (!user) return;
    
    const fetchMetas = async () => {
      const bancaId = selectedBancaIds.length === 1 ? selectedBancaIds[0] : null;
      
      let query = supabase
        .from('metas')
        .select('*')
        .eq('user_id', user.id)
        .eq('ano', currentYear);
      
      if (bancaId) {
        query = query.eq('banca_id', bancaId);
      } else if (isVisaoGeral) {
        query = query.is('banca_id', null);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching metas:', error);
        return;
      }
      
      setMetas((data || []) as Meta[]);
    };
    
    fetchMetas();
  }, [user, selectedBancaIds, isVisaoGeral, currentYear]);

  // Calculate current progress based on selected period
  const progressData = useMemo(() => {
    let currentValue = 0;
    let targetMeta: Meta | undefined;
    
    if (selectedPeriod === 'anual') {
      // Annual: sum all profits for the year
      currentValue = metrics.totalPnL;
      targetMeta = metas.find(m => m.tipo === 'anual');
    } else {
      // Monthly: get profit for specific month
      const monthData = monthlyStats.find(m => {
        const monthName = m.month.split(' ')[0].toLowerCase();
        const monthIndex = MONTHS.findIndex(mo => mo.label.toLowerCase().startsWith(monthName.substring(0, 3))) + 1;
        return monthIndex === selectedPeriod;
      });
      currentValue = monthData?.pnl || 0;
      targetMeta = metas.find(m => m.tipo === 'mensal' && m.mes === selectedPeriod);
    }
    
    const targetValue = targetMeta?.valor_meta || 0;
    const percentage = targetValue > 0 ? Math.min((currentValue / targetValue) * 100, 100) : 0;
    
    return {
      currentValue,
      targetValue,
      percentage,
      hasMeta: !!targetMeta,
    };
  }, [selectedPeriod, metas, metrics.totalPnL, monthlyStats]);

  // Get meta value for a specific period
  const getMetaForPeriod = (period: 'anual' | number) => {
    if (period === 'anual') {
      return metas.find(m => m.tipo === 'anual');
    }
    return metas.find(m => m.tipo === 'mensal' && m.mes === period);
  };

  // Open edit dialog for a period
  const handleEditClick = (e: React.MouseEvent, period: 'anual' | number) => {
    e.stopPropagation();
    const existingMeta = getMetaForPeriod(period);
    setEditingPeriod(period);
    setFormValor(existingMeta ? String(existingMeta.valor_meta) : '');
    setShowCreateDialog(true);
  };

  // Create/update meta
  const handleSaveMeta = async () => {
    if (!user || !formValor || editingPeriod === null) return;
    
    setLoading(true);
    
    try {
      const bancaId = selectedBancaIds.length === 1 ? selectedBancaIds[0] : null;
      const tipo = editingPeriod === 'anual' ? 'anual' : 'mensal';
      const mes = editingPeriod === 'anual' ? null : editingPeriod;
      
      const { error } = await supabase
        .from('metas')
        .upsert({
          user_id: user.id,
          banca_id: bancaId,
          tipo,
          mes,
          ano: currentYear,
          valor_meta: parseFloat(formValor.replace(',', '.')),
        }, {
          onConflict: 'user_id,banca_id,tipo,mes,ano',
        });
      
      if (error) throw error;
      
      toast.success('Meta salva com sucesso!');
      setShowCreateDialog(false);
      setFormValor('');
      setEditingPeriod(null);
      
      // Refresh metas
      const query = supabase
        .from('metas')
        .select('*')
        .eq('user_id', user.id)
        .eq('ano', currentYear);
      
      if (bancaId) {
        const { data } = await query.eq('banca_id', bancaId);
        setMetas((data || []) as Meta[]);
      } else {
        const { data } = await query.is('banca_id', null);
        setMetas((data || []) as Meta[]);
      }
    } catch (error) {
      console.error('Error saving meta:', error);
      toast.error('Erro ao salvar meta');
    } finally {
      setLoading(false);
    }
  };

  // Arc path calculation for progress gauge
  const getArcPath = (percentage: number, radius: number, cx: number, cy: number) => {
    const startAngle = -180;
    const endAngle = startAngle + (percentage / 100) * 180;
    
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    
    const largeArc = percentage > 50 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const isGoalMet = progressData.percentage >= 100;

  const periodLabel = selectedPeriod === 'anual' 
    ? 'Anual' 
    : MONTHS.find(m => m.value === selectedPeriod)?.label || '';

  const getEditingPeriodLabel = () => {
    if (editingPeriod === 'anual') return 'Anual';
    return MONTHS.find(m => m.value === editingPeriod)?.label || '';
  };

  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-sm h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Metas</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {selectedPeriod === 'anual' ? `Ano ${currentYear}` : `${periodLabel}/${currentYear}`}
          </p>
        </div>
        
        {/* Period Selector */}
        <Popover open={periodOpen} onOpenChange={setPeriodOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs">
              {periodLabel}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0" align="end">
            <Command>
              <CommandInput placeholder="Buscar mês..." />
              <CommandList>
                <CommandEmpty>Nenhum resultado</CommandEmpty>
                <CommandGroup>
                  {/* Annual option */}
                  <CommandItem
                    value="anual"
                    onSelect={() => {
                      setSelectedPeriod('anual');
                      setPeriodOpen(false);
                    }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <Check className={cn("mr-2 h-4 w-4", selectedPeriod === 'anual' ? "opacity-100" : "opacity-0")} />
                      <span>Anual</span>
                      {getMetaForPeriod('anual') && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (R$ {getMetaForPeriod('anual')?.valor_meta.toLocaleString('pt-BR')})
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleEditClick(e, 'anual')}
                      className="p-1 hover:bg-accent rounded"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                  </CommandItem>
                  
                  {/* Monthly options */}
                  {MONTHS.map((month) => {
                    const meta = getMetaForPeriod(month.value);
                    return (
                      <CommandItem
                        key={month.value}
                        value={month.label}
                        onSelect={() => {
                          setSelectedPeriod(month.value);
                          setPeriodOpen(false);
                        }}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <Check className={cn("mr-2 h-4 w-4", selectedPeriod === month.value ? "opacity-100" : "opacity-0")} />
                          <span>{month.label}</span>
                          {meta && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (R$ {meta.valor_meta.toLocaleString('pt-BR')})
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => handleEditClick(e, month.value)}
                          className="p-1 hover:bg-accent rounded"
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Progress Arc */}
      <div className="flex flex-col items-center justify-center flex-1">
        <div className="relative w-full flex justify-center">
          <svg width="200" height="110" viewBox="0 0 200 110">
            {/* Background arc */}
            <path
              d={getArcPath(100, 85, 100, 95)}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Progress arc */}
            {progressData.percentage > 0 && (
              <path
                d={getArcPath(progressData.percentage, 85, 100, 95)}
                fill="none"
                stroke="hsl(var(--success))"
                strokeWidth="12"
                strokeLinecap="round"
              />
            )}
            {/* End dot */}
            {progressData.percentage > 0 && (
              <circle
                cx={100 + 85 * Math.cos(((-180 + (progressData.percentage / 100) * 180) * Math.PI) / 180)}
                cy={95 + 85 * Math.sin(((-180 + (progressData.percentage / 100) * 180) * Math.PI) / 180)}
                r="6"
                fill="hsl(var(--success))"
              />
            )}
          </svg>
        </div>
        
        {/* Values below the arc */}
        <div className="text-center -mt-2">
          <div className="text-2xl font-bold">
            {isGoalMet && '🎉 '}
            R$ {progressData.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            {isGoalMet && ' 🎉'}
          </div>
          {progressData.hasMeta && (
            <p className="text-xs text-muted-foreground mt-0.5">
              de R$ {progressData.targetValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </p>
          )}
        </div>
        
        {!progressData.hasMeta && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Nenhuma meta definida para este período
          </p>
        )}
        
        {progressData.hasMeta && (
          <p className="text-sm text-success font-medium mt-1">
            {progressData.percentage.toFixed(1)}% da meta
          </p>
        )}
      </div>

      {/* Edit Meta Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        if (!open) {
          setEditingPeriod(null);
          setFormValor('');
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {getMetaForPeriod(editingPeriod!) ? 'Editar' : 'Criar'} Meta - {getEditingPeriodLabel()}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Valor da Meta (R$)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  R$
                </span>
                <Input
                  type="text"
                  value={formValor}
                  onChange={(e) => setFormValor(e.target.value)}
                  className="pl-10"
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveMeta} disabled={loading || !formValor}>
              {loading ? 'Salvando...' : 'Salvar Meta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}