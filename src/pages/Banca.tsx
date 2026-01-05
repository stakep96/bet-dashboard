import { useMemo, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Wallet, Plus, TrendingUp, ArrowUpRight, ArrowDownRight, History, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useBanca } from '@/contexts/BancaContext';
import { toast } from 'sonner';

interface BancaToEdit {
  id: string;
  name: string;
  balance: number;
  initialBalance: number;
}

const Banca = () => {
  const { bancas, entradas, selectedBancaIds, selectSingleBanca, addBanca, editBanca, deleteBanca, loading } = useBanca();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBancaName, setNewBancaName] = useState('');
  const [newBancaBalance, setNewBancaBalance] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [bancaToEdit, setBancaToEdit] = useState<BancaToEdit | null>(null);
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [editInitialBalance, setEditInitialBalance] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateBanca = async () => {
    if (newBancaName.trim() && newBancaBalance) {
      setIsCreating(true);
      await addBanca(newBancaName, parseFloat(newBancaBalance) || 0);
      setIsDialogOpen(false);
      setNewBancaName('');
      setNewBancaBalance('');
      setIsCreating(false);
    }
  };

  const handleOpenEditDialog = (banca: BancaToEdit, e: React.MouseEvent) => {
    e.stopPropagation();
    setBancaToEdit(banca);
    setEditName(banca.name);
    setEditBalance(banca.balance.toString());
    setEditInitialBalance(banca.initialBalance.toString());
    setIsEditDialogOpen(true);
  };

  const handleEditBanca = async () => {
    if (bancaToEdit && editName.trim() && editBalance && editInitialBalance) {
      setIsSaving(true);
      await editBanca(bancaToEdit.id, editName, parseFloat(editBalance) || 0, parseFloat(editInitialBalance) || 0);
      setIsEditDialogOpen(false);
      setBancaToEdit(null);
      setIsSaving(false);
    }
  };

  const handleDeleteBanca = async () => {
    if (!bancaToEdit) return;
    if (!confirm(`Tem certeza que deseja excluir a banca "${bancaToEdit.name}"? Todas as entradas associadas serão removidas.`)) return;
    
    setIsDeleting(true);
    await deleteBanca(bancaToEdit.id);
    setIsEditDialogOpen(false);
    setBancaToEdit(null);
    setIsDeleting(false);
  };

  const bancaAggregates = useMemo(() => {
    const pnlByBancaId = new Map<string, number>();
    const countByBancaId = new Map<string, number>();

    for (const e of entradas) {
      pnlByBancaId.set(e.bancaId, (pnlByBancaId.get(e.bancaId) || 0) + (e.lucro || 0));
      countByBancaId.set(e.bancaId, (countByBancaId.get(e.bancaId) || 0) + 1);
    }

    return { pnlByBancaId, countByBancaId };
  }, [entradas]);

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
              <h1 className="text-2xl font-bold text-foreground">Gestão de Banca</h1>
              <p className="text-muted-foreground">Controle e acompanhamento do seu capital</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Banca
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Banca</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome da Banca</Label>
                    <Input 
                      id="name" 
                      value={newBancaName}
                      onChange={(e) => setNewBancaName(e.target.value)}
                      placeholder="Ex: 2025, Futebol, Esports..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="balance">Valor inicial (R$)</Label>
                    <Input 
                      id="balance" 
                      type="number"
                      value={newBancaBalance}
                      onChange={(e) => setNewBancaBalance(e.target.value)}
                      placeholder="Ex: 1000"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreateBanca} disabled={!newBancaName.trim() || !newBancaBalance || isCreating}>
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Banca
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Bancas Cards */}
          {bancas.length === 0 ? (
            <Card className="mb-6">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma banca criada ainda.</p>
                <p className="text-sm mt-1">Clique em "Nova Banca" para começar.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {bancas.map((banca) => (
                <Card 
                  key={banca.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${selectedBancaIds.includes(banca.id) && selectedBancaIds.length === 1 ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => selectSingleBanca(banca.id)}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">{banca.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleOpenEditDialog(banca, e)}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const entriesCount = bancaAggregates.countByBancaId.get(banca.id) || 0;
                      const pnlFromEntries = bancaAggregates.pnlByBancaId.get(banca.id) || 0;

                      const currentBankroll = entriesCount > 0
                        ? banca.initialBalance + pnlFromEntries
                        : banca.balance;

                      const totalPnL = entriesCount > 0
                        ? pnlFromEntries
                        : banca.balance - banca.initialBalance;

                      const roi = banca.initialBalance > 0 ? (totalPnL / banca.initialBalance) * 100 : 0;
                      const isPositive = roi >= 0;

                      return (
                        <>
                          <div className="text-2xl font-bold text-foreground">
                            R$ {currentBankroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Inicial: R$ {banca.initialBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <TrendingUp className={`h-4 w-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
                            <span className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                              {isPositive ? '+' : ''}{roi.toFixed(2)}% ROI
                            </span>
                          </div>
                        </>
                      );
                    })()}
                    {selectedBancaIds.includes(banca.id) && selectedBancaIds.length === 1 && (
                      <Badge className="mt-3 bg-primary/10 text-primary hover:bg-primary/20">
                        Selecionada
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Edit Banca Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Banca</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Nome da Banca</Label>
                  <Input 
                    id="edit-name" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Ex: 2025, Futebol, Esports..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-initial-balance">Valor Inicial (R$)</Label>
                  <Input 
                    id="edit-initial-balance" 
                    type="number"
                    value={editInitialBalance}
                    onChange={(e) => setEditInitialBalance(e.target.value)}
                    placeholder="Ex: 1000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-balance">Valor Atual (R$)</Label>
                  <Input 
                    id="edit-balance" 
                    type="number"
                    value={editBalance}
                    onChange={(e) => setEditBalance(e.target.value)}
                    placeholder="Ex: 1000"
                  />
                </div>
              </div>
              <DialogFooter className="flex justify-between">
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteBanca}
                  disabled={isDeleting || isSaving}
                >
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleEditBanca} disabled={!editName.trim() || !editBalance || !editInitialBalance || isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5 text-green-500" />
                  Depositar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    placeholder="Valor do depósito"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                  <Button className="bg-green-500 hover:bg-green-600">Depositar</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDownRight className="h-5 w-5 text-red-500" />
                  Sacar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input type="number" placeholder="Valor do saque" />
                  <Button variant="destructive">Sacar</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Histórico de Transações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>Histórico de transações em breve.</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Banca;
