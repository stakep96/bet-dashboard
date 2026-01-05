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
import { Wallet, Plus, TrendingUp, ArrowUpRight, ArrowDownRight, History, Pencil } from 'lucide-react';
import { useBanca } from '@/contexts/BancaContext';

interface BancaToEdit {
  id: string;
  name: string;
  balance: number;
  initialBalance: number;
}

const Banca = () => {
  const { bancas, entradas, selectedBanca, setSelectedBanca, addBanca, editBanca } = useBanca();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBancaName, setNewBancaName] = useState('');
  const [newBancaBalance, setNewBancaBalance] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [bancaToEdit, setBancaToEdit] = useState<BancaToEdit | null>(null);
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [editInitialBalance, setEditInitialBalance] = useState('');

  const handleCreateBanca = () => {
    if (newBancaName.trim() && newBancaBalance) {
      addBanca(newBancaName, parseFloat(newBancaBalance) || 0);
      setIsDialogOpen(false);
      setNewBancaName('');
      setNewBancaBalance('');
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

  const handleEditBanca = () => {
    if (bancaToEdit && editName.trim() && editBalance && editInitialBalance) {
      editBanca(bancaToEdit.id, editName, parseFloat(editBalance) || 0, parseFloat(editInitialBalance) || 0);
      setIsEditDialogOpen(false);
      setBancaToEdit(null);
    }
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

  // Mock transaction history
  const transactions = [
    { id: 1, type: 'deposit', amount: 1000, date: '01/01/2025', description: 'Depósito inicial' },
    { id: 2, type: 'profit', amount: 185, date: '03/01/2025', description: 'Lucro de apostas' },
    { id: 3, type: 'profit', amount: 55, date: '02/01/2025', description: 'Lucro de apostas' },
    { id: 4, type: 'loss', amount: -110, date: '31/12/2024', description: 'Perda de apostas' },
    { id: 5, type: 'deposit', amount: 500, date: '30/12/2024', description: 'Depósito adicional' },
  ];

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
                  <Button onClick={handleCreateBanca} disabled={!newBancaName.trim() || !newBancaBalance}>Criar Banca</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Bancas Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {bancas.map((banca) => (
              <Card 
                key={banca.id}
                className={`cursor-pointer transition-all hover:shadow-md ${selectedBanca?.id === banca.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedBanca(banca)}
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
                  {selectedBanca?.id === banca.id && (
                    <Badge className="mt-3 bg-primary/10 text-primary hover:bg-primary/20">
                      Selecionada
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

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
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleEditBanca} disabled={!editName.trim() || !editBalance || !editInitialBalance}>Salvar</Button>
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
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === 'deposit' ? 'bg-blue-500/10' : 
                        tx.type === 'profit' ? 'bg-green-500/10' : 'bg-red-500/10'
                      }`}>
                        {tx.type === 'deposit' ? (
                          <ArrowUpRight className="h-5 w-5 text-blue-500" />
                        ) : tx.type === 'profit' ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{tx.description}</p>
                        <p className="text-sm text-muted-foreground">{tx.date}</p>
                      </div>
                    </div>
                    <span className={`font-bold ${
                      tx.amount >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {tx.amount >= 0 ? '+' : ''}R$ {Math.abs(tx.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Banca;