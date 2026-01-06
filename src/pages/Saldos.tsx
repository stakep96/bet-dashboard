import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Building2, Plus, TrendingUp, ArrowUpRight, ArrowDownRight, Pencil, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBanca } from '@/contexts/BancaContext';
import { toast } from 'sonner';

interface Saldo {
  id: string;
  name: string;
  currentBalance: number;
  initialBalance: number;
  bancaId: string | null;
}

interface SaldoTransacao {
  id: string;
  saldoId: string;
  type: 'deposito' | 'saque';
  amount: number;
  createdAt: string;
}

const Saldos = () => {
  const { user } = useAuth();
  const { entradas, selectedBancaIds, bancas, isVisaoGeral, getSelectedBancas } = useBanca();
  const selectedBancas = getSelectedBancas();
  
  const [saldos, setSaldos] = useState<Saldo[]>([]);
  const [transacoes, setTransacoes] = useState<SaldoTransacao[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteBalance, setNewSiteBalance] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [saldoToEdit, setSaldoToEdit] = useState<Saldo | null>(null);
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [editInitialBalance, setEditInitialBalance] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Deposit/Withdraw
  const [depositAmounts, setDepositAmounts] = useState<Record<string, string>>({});
  const [withdrawAmounts, setWithdrawAmounts] = useState<Record<string, string>>({});
  const [processingDeposit, setProcessingDeposit] = useState<string | null>(null);
  const [processingWithdraw, setProcessingWithdraw] = useState<string | null>(null);

  // Calcular totais por casa de aposta (site) por banca das entradas
  const betsByHouseAndBanca = useMemo(() => {
    // Map<bancaId, Map<siteName, totalProfit>>
    const result = new Map<string, Map<string, number>>();
    for (const e of entradas) {
      if (e.site && e.lucro !== undefined && e.bancaId) {
        const normalized = e.site.toLowerCase().trim();
        if (!result.has(e.bancaId)) {
          result.set(e.bancaId, new Map());
        }
        const bancaMap = result.get(e.bancaId)!;
        bancaMap.set(normalized, (bancaMap.get(normalized) || 0) + e.lucro);
      }
    }
    return result;
  }, [entradas]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      const [saldosRes, transacoesRes] = await Promise.all([
        supabase.from('saldos').select('*').eq('user_id', user.id).order('name'),
        supabase.from('saldo_transacoes').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);
      
      if (saldosRes.error) throw saldosRes.error;
      if (transacoesRes.error) throw transacoesRes.error;
      
      setSaldos(saldosRes.data.map(s => ({
        id: s.id,
        name: s.name,
        currentBalance: Number(s.current_balance),
        initialBalance: Number(s.initial_balance),
        bancaId: s.banca_id
      })));
      
      setTransacoes(transacoesRes.data.map(t => ({
        id: t.id,
        saldoId: t.saldo_id,
        type: t.type as 'deposito' | 'saque',
        amount: Number(t.amount),
        createdAt: t.created_at
      })));
    } catch (err) {
      console.error('Erro ao carregar saldos:', err);
      toast.error('Erro ao carregar saldos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleCreateSaldo = async () => {
    if (!user || !newSiteName.trim() || !newSiteBalance) return;
    if (isVisaoGeral || selectedBancaIds.length !== 1) {
      toast.error('Selecione uma banca específica para adicionar um site');
      return;
    }
    
    setIsCreating(true);
    try {
      const initialBalance = parseFloat(newSiteBalance) || 0;
      const { error } = await supabase.from('saldos').insert({
        user_id: user.id,
        name: newSiteName.trim(),
        initial_balance: initialBalance,
        current_balance: initialBalance,
        banca_id: selectedBancaIds[0]
      });
      
      if (error) throw error;
      
      toast.success('Site adicionado com sucesso!');
      setIsDialogOpen(false);
      setNewSiteName('');
      setNewSiteBalance('');
      fetchData();
    } catch (err) {
      console.error('Erro ao criar saldo:', err);
      toast.error('Erro ao criar saldo');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenEditDialog = (saldo: Saldo, e: React.MouseEvent) => {
    e.stopPropagation();
    setSaldoToEdit(saldo);
    setEditName(saldo.name);
    setEditBalance(saldo.currentBalance.toString());
    setEditInitialBalance(saldo.initialBalance.toString());
    setIsEditDialogOpen(true);
  };

  const handleEditSaldo = async () => {
    if (!saldoToEdit || !editName.trim() || !editBalance || !editInitialBalance) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase.from('saldos').update({
        name: editName.trim(),
        current_balance: parseFloat(editBalance) || 0,
        initial_balance: parseFloat(editInitialBalance) || 0
      }).eq('id', saldoToEdit.id);
      
      if (error) throw error;
      
      toast.success('Site atualizado com sucesso!');
      setIsEditDialogOpen(false);
      setSaldoToEdit(null);
      fetchData();
    } catch (err) {
      console.error('Erro ao editar saldo:', err);
      toast.error('Erro ao editar saldo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSaldo = async () => {
    if (!saldoToEdit) return;
    if (!confirm(`Tem certeza que deseja excluir "${saldoToEdit.name}"? Todas as transações serão removidas.`)) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('saldos').delete().eq('id', saldoToEdit.id);
      
      if (error) throw error;
      
      toast.success('Site excluído com sucesso!');
      setIsEditDialogOpen(false);
      setSaldoToEdit(null);
      fetchData();
    } catch (err) {
      console.error('Erro ao excluir saldo:', err);
      toast.error('Erro ao excluir saldo');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeposit = async (saldoId: string) => {
    if (!user) return;
    const amount = parseFloat(depositAmounts[saldoId] || '');
    if (!amount || amount <= 0) {
      toast.error('Informe um valor válido');
      return;
    }
    
    setProcessingDeposit(saldoId);
    try {
      // Insert transaction
      const { error: transError } = await supabase.from('saldo_transacoes').insert({
        user_id: user.id,
        saldo_id: saldoId,
        type: 'deposito',
        amount
      });
      
      if (transError) throw transError;
      
      // Update balance
      const saldo = saldos.find(s => s.id === saldoId);
      if (saldo) {
        const { error: updateError } = await supabase.from('saldos').update({
          current_balance: saldo.currentBalance + amount
        }).eq('id', saldoId);
        
        if (updateError) throw updateError;
      }
      
      toast.success('Depósito realizado!');
      setDepositAmounts(prev => ({ ...prev, [saldoId]: '' }));
      fetchData();
    } catch (err) {
      console.error('Erro ao depositar:', err);
      toast.error('Erro ao depositar');
    } finally {
      setProcessingDeposit(null);
    }
  };

  const handleWithdraw = async (saldoId: string) => {
    if (!user) return;
    const amount = parseFloat(withdrawAmounts[saldoId] || '');
    if (!amount || amount <= 0) {
      toast.error('Informe um valor válido');
      return;
    }
    
    setProcessingWithdraw(saldoId);
    try {
      // Insert transaction
      const { error: transError } = await supabase.from('saldo_transacoes').insert({
        user_id: user.id,
        saldo_id: saldoId,
        type: 'saque',
        amount
      });
      
      if (transError) throw transError;
      
      // Update balance
      const saldo = saldos.find(s => s.id === saldoId);
      if (saldo) {
        const { error: updateError } = await supabase.from('saldos').update({
          current_balance: saldo.currentBalance - amount
        }).eq('id', saldoId);
        
        if (updateError) throw updateError;
      }
      
      toast.success('Saque realizado!');
      setWithdrawAmounts(prev => ({ ...prev, [saldoId]: '' }));
      fetchData();
    } catch (err) {
      console.error('Erro ao sacar:', err);
      toast.error('Erro ao sacar');
    } finally {
      setProcessingWithdraw(null);
    }
  };

  // Filtrar saldos por banca selecionada e ordenar por saldo calculado (maior para menor)
  const filteredSaldos = useMemo(() => {
    let filtered: Saldo[];
    if (isVisaoGeral) {
      filtered = saldos.filter(s => s.bancaId && selectedBancaIds.includes(s.bancaId));
    } else if (selectedBancaIds.length === 1) {
      filtered = saldos.filter(s => s.bancaId === selectedBancaIds[0]);
    } else {
      filtered = saldos;
    }
    
    // Ordenar por saldo calculado (maior para menor)
    return filtered.sort((a, b) => {
      const getBalance = (saldo: Saldo) => {
        if (!saldo.bancaId) return saldo.currentBalance;
        const normalized = saldo.name.toLowerCase().trim();
        const bancaMap = betsByHouseAndBanca.get(saldo.bancaId);
        const betPnL = bancaMap?.get(normalized) || 0;
        return saldo.currentBalance + betPnL;
      };
      return getBalance(b) - getBalance(a);
    });
  }, [saldos, selectedBancaIds, isVisaoGeral, betsByHouseAndBanca]);

  // Calcular saldo atual considerando transações e bets apenas da mesma banca
  const getCalculatedBalance = (saldo: Saldo) => {
    if (!saldo.bancaId) return saldo.currentBalance;
    const normalized = saldo.name.toLowerCase().trim();
    const bancaMap = betsByHouseAndBanca.get(saldo.bancaId);
    const betPnL = bancaMap?.get(normalized) || 0;
    return saldo.currentBalance + betPnL;
  };

  const getROI = (saldo: Saldo) => {
    const calculatedBalance = getCalculatedBalance(saldo);
    if (saldo.initialBalance <= 0) return 0;
    return ((calculatedBalance - saldo.initialBalance) / saldo.initialBalance) * 100;
  };

  // Calcular totais agregados de todos os saldos filtrados
  const totals = useMemo(() => {
    const totalBalance = filteredSaldos.reduce((sum, s) => sum + getCalculatedBalance(s), 0);
    const totalInitial = filteredSaldos.reduce((sum, s) => sum + s.initialBalance, 0);
    const totalROI = totalInitial > 0 ? ((totalBalance - totalInitial) / totalInitial) * 100 : 0;
    return { totalBalance, totalInitial, totalROI };
  }, [filteredSaldos, betsByHouseAndBanca]);

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
        <Header onNewEntry={() => {}} />
        
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Gestão de Saldos</h1>
              <p className="text-muted-foreground">Controle e acompanhamento do saldo em cada site</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" disabled={isVisaoGeral || selectedBancaIds.length !== 1}>
                  <Plus className="h-4 w-4" />
                  Novo Site
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Site</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome do Site</Label>
                    <Input 
                      id="name" 
                      value={newSiteName}
                      onChange={(e) => setNewSiteName(e.target.value)}
                      placeholder="Ex: Bet365, Betano, Sportingbet..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="balance">Saldo Inicial (R$)</Label>
                    <Input 
                      id="balance" 
                      type="number"
                      value={newSiteBalance}
                      onChange={(e) => setNewSiteBalance(e.target.value)}
                      placeholder="Ex: 500"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreateSaldo} disabled={!newSiteName.trim() || !newSiteBalance || isCreating}>
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Adicionar Site
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Saldos Cards */}
          {filteredSaldos.length === 0 ? (
            <Card className="mb-6">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum site adicionado {selectedBancas.length === 1 ? `para ${selectedBancas[0].name}` : 'ainda'}.</p>
                <p className="text-sm mt-1">{isVisaoGeral ? 'Selecione uma banca específica para adicionar sites.' : 'Clique em "Novo Site" para começar.'}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-6">
              {/* Card de Total */}
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardHeader className="py-4 px-5 pb-2">
                  <CardTitle className="text-sm font-medium text-primary">Saldo Total</CardTitle>
                </CardHeader>
                <CardContent className="py-3 px-5 pt-0">
                  <div className="text-xl font-bold text-foreground">
                    R$ {totals.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                    <span>Inicial: R$ {totals.totalInitial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className={totals.totalROI >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {totals.totalROI >= 0 ? '+' : ''}{totals.totalROI.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-primary/20 text-xs text-muted-foreground text-center">
                    {filteredSaldos.length} site{filteredSaldos.length !== 1 ? 's' : ''}
                  </div>
                </CardContent>
              </Card>
              {filteredSaldos.map((saldo) => {
                const calculatedBalance = getCalculatedBalance(saldo);
                const roi = getROI(saldo);
                const isPositive = roi >= 0;
                
                return (
                  <Card key={saldo.id} className="transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between py-4 px-5 pb-2">
                      <CardTitle className="text-sm font-medium truncate">{saldo.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => handleOpenEditDialog(saldo, e)}
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </CardHeader>
                    <CardContent className="py-3 px-5 pt-0">
                      <div className="text-xl font-bold text-foreground">
                        R$ {calculatedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                        <span>Inicial: R$ {saldo.initialBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
                          {isPositive ? '+' : ''}{roi.toFixed(1)}%
                        </span>
                      </div>
                      
                      {/* Deposit/Withdraw side by side */}
                      <div className="mt-4 pt-3 border-t border-border flex gap-2">
                        <div className="flex gap-1 flex-1">
                          <Input 
                            type="number" 
                            placeholder="Dep."
                            value={depositAmounts[saldo.id] || ''}
                            onChange={(e) => setDepositAmounts(prev => ({ ...prev, [saldo.id]: e.target.value }))}
                            className="h-7 text-xs px-2"
                          />
                          <Button 
                            size="sm" 
                            className="bg-green-500 hover:bg-green-600 h-7 w-7 p-0"
                            onClick={() => handleDeposit(saldo.id)}
                            disabled={processingDeposit === saldo.id}
                          >
                            {processingDeposit === saldo.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <ArrowUpRight className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <div className="flex gap-1 flex-1">
                          <Input 
                            type="number" 
                            placeholder="Saq."
                            value={withdrawAmounts[saldo.id] || ''}
                            onChange={(e) => setWithdrawAmounts(prev => ({ ...prev, [saldo.id]: e.target.value }))}
                            className="h-7 text-xs px-2"
                          />
                          <Button 
                            size="sm" 
                            variant="destructive"
                            className="h-7 w-7 p-0"
                            onClick={() => handleWithdraw(saldo.id)}
                            disabled={processingWithdraw === saldo.id}
                          >
                            {processingWithdraw === saldo.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Site</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Nome do Site</Label>
                  <Input 
                    id="edit-name" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Ex: Bet365, Betano..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-initial-balance">Saldo Inicial (R$)</Label>
                  <Input 
                    id="edit-initial-balance" 
                    type="number"
                    value={editInitialBalance}
                    onChange={(e) => setEditInitialBalance(e.target.value)}
                    placeholder="Ex: 500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-balance">Saldo Atual (R$)</Label>
                  <Input 
                    id="edit-balance" 
                    type="number"
                    value={editBalance}
                    onChange={(e) => setEditBalance(e.target.value)}
                    placeholder="Ex: 750"
                  />
                </div>
              </div>
              <DialogFooter className="flex justify-between">
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteSaldo}
                  disabled={isDeleting || isSaving}
                >
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleEditSaldo} disabled={!editName.trim() || !editBalance || !editInitialBalance || isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
};

export default Saldos;
