import { useState } from 'react';
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
import { User, Bell, Palette, Database, Trash2, Download, CalendarIcon, LogOut, Check, ChevronRight, Zap, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useBanca } from '@/contexts/BancaContext';
import { useAuth } from '@/contexts/AuthContext';
import { useExportCSV } from '@/hooks/useExportCSV';
import { useProfile } from '@/hooks/useProfile';
import { useZapier } from '@/contexts/ZapierContext';

const Configuracoes = () => {
  const { bancas, entradas } = useBanca();
  const { user, signOut } = useAuth();
  const { exportToCSV } = useExportCSV();
  const { displayName, updateProfile, getInitials } = useProfile();
  const { webhookUrl, setWebhookUrl, isEnabled, setEnabled, testWebhook } = useZapier();
  
  // Profile editing state
  const [editName, setEditName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  
  // Zapier state
  const [tempWebhookUrl, setTempWebhookUrl] = useState('');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  
  // Export filters
  const [exportBancaId, setExportBancaId] = useState<string>('');
  const [exportDateFrom, setExportDateFrom] = useState<Date | undefined>();
  const [exportDateTo, setExportDateTo] = useState<Date | undefined>();
  const [exportResultado, setExportResultado] = useState<string>('');
  const [exportModalidade, setExportModalidade] = useState<string>('');

  const modalidades = [...new Set(entradas.map(e => e.modalidade).filter(Boolean))];

  const handleStartEditing = () => {
    setEditName(displayName);
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    
    setIsSavingName(true);
    
    const { error } = await updateProfile({ displayName: editName.trim() });
    
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

  const handleSaveWebhook = () => {
    if (!tempWebhookUrl.trim()) {
      toast.error('Cole a URL do webhook do Zapier');
      return;
    }
    setWebhookUrl(tempWebhookUrl.trim());
    toast.success('Webhook salvo!');
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      toast.error('Salve a URL do webhook primeiro');
      return;
    }
    
    setIsTestingWebhook(true);
    const success = await testWebhook();
    setIsTestingWebhook(false);
    
    if (success) {
      toast.success('Teste enviado! Verifique o histórico do seu Zap no Zapier.');
    } else {
      toast.error('Erro ao enviar teste');
    }
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
                  onClick={handleStartEditing}
                >
                  <Avatar className="h-12 w-12 bg-primary text-primary-foreground">
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {getInitials()}
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
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
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

            {/* Zapier Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Backup Automático (Zapier)
                </CardTitle>
                <CardDescription>
                  Sincronize automaticamente suas entradas com Google Sheets via Zapier
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Ativar sincronização</p>
                    <p className="text-sm text-muted-foreground">Enviar novas entradas automaticamente para o Zapier</p>
                  </div>
                  <Switch 
                    checked={isEnabled} 
                    onCheckedChange={setEnabled}
                    disabled={!webhookUrl}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <Label>URL do Webhook</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://hooks.zapier.com/hooks/catch/..."
                      value={tempWebhookUrl || webhookUrl}
                      onChange={(e) => setTempWebhookUrl(e.target.value)}
                    />
                    <Button onClick={handleSaveWebhook}>
                      Salvar
                    </Button>
                  </div>
                  {webhookUrl && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Check className="h-3 w-3 text-green-500" />
                      Webhook configurado
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleTestWebhook}
                    disabled={!webhookUrl || isTestingWebhook}
                  >
                    {isTestingWebhook ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Testando...
                      </>
                    ) : (
                      'Testar conexão'
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.open('https://zapier.com/app/zaps', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Zapier
                  </Button>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-2">
                  <p className="font-medium">Como configurar:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Crie um Zap com trigger "Webhooks by Zapier" → "Catch Hook"</li>
                    <li>Copie a URL do webhook e cole acima</li>
                    <li>Adicione ação "Google Sheets" → "Create Spreadsheet Row"</li>
                    <li>Mapeie os campos: data, evento, odd, stake, resultado, lucro</li>
                  </ol>
                </div>
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
