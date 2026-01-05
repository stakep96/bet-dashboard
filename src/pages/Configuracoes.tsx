import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Bell, Shield, Palette, Database, Trash2, Download, CalendarIcon, LogOut, Check, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useBanca } from '@/contexts/BancaContext';
import { useAuth } from '@/contexts/AuthContext';
import { useExportCSV } from '@/hooks/useExportCSV';
import { supabase } from '@/integrations/supabase/client';

const Configuracoes = () => {
  const { bancas, entradas } = useBanca();
  const { user, signOut } = useAuth();
  const { exportToCSV } = useExportCSV();
  
  // Profile state
  const [displayName, setDisplayName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  
  // Export filters
  const [exportBancaId, setExportBancaId] = useState<string>('');
  const [exportDateFrom, setExportDateFrom] = useState<Date | undefined>();
  const [exportDateTo, setExportDateTo] = useState<Date | undefined>();
  const [exportResultado, setExportResultado] = useState<string>('');
  const [exportModalidade, setExportModalidade] = useState<string>('');

  const modalidades = [...new Set(entradas.map(e => e.modalidade).filter(Boolean))];

  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data?.display_name) {
        setDisplayName(data.display_name);
      }
    };
    
    loadProfile();
  }, [user]);

  const handleSaveName = async () => {
    if (!user || !displayName.trim()) return;
    
    setIsSavingName(true);
    
    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        user_id: user.id, 
        display_name: displayName.trim() 
      }, { onConflict: 'user_id' });
    
    setIsSavingName(false);
    
    if (error) {
      toast.error('Erro ao salvar nome');
    } else {
      toast.success('Nome atualizado!');
      setIsEditingName(false);
    }
  };

  const handleExport = () => {
    let toExport = [...entradas];

    if (exportBancaId) {
      toExport = toExport.filter(e => e.bancaId === exportBancaId);
    }

    const result = exportToCSV(toExport, {
      bancaId: exportBancaId || undefined,
      bancaName: exportBancaId ? bancas.find(b => b.id === exportBancaId)?.name : 'todas_bancas',
      filters: {
        dateFrom: exportDateFrom,
        dateTo: exportDateTo,
        resultado: exportResultado,
        modalidade: exportModalidade,
      },
    });

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Logout realizado com sucesso!');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-72">
        <Header onNewEntry={() => {}} />
        
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
            <p className="text-muted-foreground">Gerencie suas preferências e configurações da conta</p>
          </div>

          <div className="space-y-6">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Perfil
                </CardTitle>
                <CardDescription>Informações básicas da sua conta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Profile Card - like the image */}
                <div 
                  className="flex items-center gap-4 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setIsEditingName(true)}
                >
                  <Avatar className="h-12 w-12 bg-primary text-primary-foreground">
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {displayName ? getInitials(displayName) : user?.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {displayName || 'Adicionar nome'}
                      </span>
                      {displayName && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <span className="text-sm text-muted-foreground">{user?.email}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* Edit name form */}
                {isEditingName && (
                  <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                    <Label htmlFor="displayName">Nome de exibição</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Seu nome"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSaveName} disabled={isSavingName}>
                        {isSavingName ? 'Salvando...' : 'Salvar'}
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditingName(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 pt-2">
                  <Button variant="outline" onClick={handleSignOut} className="gap-2">
                    <LogOut className="h-4 w-4" />
                    Sair da Conta
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Data Export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  Exportar Entradas para CSV
                </CardTitle>
                <CardDescription>Exporte suas entradas com filtros personalizados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Banca</Label>
                    <Select value={exportBancaId || "_all"} onValueChange={(v) => setExportBancaId(v === "_all" ? "" : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as bancas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">Todas as bancas</SelectItem>
                        {bancas.map(b => (
                          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Resultado</Label>
                    <Select value={exportResultado || "_all"} onValueChange={(v) => setExportResultado(v === "_all" ? "" : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">Todos</SelectItem>
                        <SelectItem value="G">Ganhou</SelectItem>
                        <SelectItem value="P">Perdeu</SelectItem>
                        <SelectItem value="C">Cashout</SelectItem>
                        <SelectItem value="D">Devolvida</SelectItem>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Período - De</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {exportDateFrom ? format(exportDateFrom, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={exportDateFrom}
                          onSelect={setExportDateFrom}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Período - Até</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {exportDateTo ? format(exportDateTo, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={exportDateTo}
                          onSelect={setExportDateTo}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Modalidade</Label>
                  <Select value={exportModalidade || "_all"} onValueChange={(v) => setExportModalidade(v === "_all" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">Todas</SelectItem>
                      {modalidades.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleExport} className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar CSV
                </Button>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notificações
                </CardTitle>
                <CardDescription>Configure suas preferências de notificação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Resumo Diário</p>
                    <p className="text-sm text-muted-foreground">Receba um resumo diário por email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Alertas de Metas</p>
                    <p className="text-sm text-muted-foreground">Notificações quando atingir suas metas</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Relatório Semanal</p>
                    <p className="text-sm text-muted-foreground">Relatório semanal de desempenho</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Aparência
                </CardTitle>
                <CardDescription>Personalize a interface do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Modo Escuro</p>
                    <p className="text-sm text-muted-foreground">Alternar entre tema claro e escuro</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Animações</p>
                    <p className="text-sm text-muted-foreground">Habilitar animações na interface</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Dados
                </CardTitle>
                <CardDescription>Gerenciamento de dados da sua conta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-red-500">Excluir Conta</p>
                    <p className="text-sm text-muted-foreground">Excluir permanentemente sua conta e dados</p>
                  </div>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Configuracoes;
