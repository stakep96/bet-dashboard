import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle, MessageCircle, Book, Mail, ExternalLink } from 'lucide-react';

const Suporte = () => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-72">
        <Header onNewEntry={() => {}} />
        
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Suporte</h1>
            <p className="text-muted-foreground">Precisa de ajuda? Estamos aqui para você</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Links */}
            <div className="space-y-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Book className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Documentação</p>
                    <p className="text-sm text-muted-foreground">Guias e tutoriais</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <MessageCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Chat ao Vivo</p>
                    <p className="text-sm text-muted-foreground">Fale conosco agora</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Email</p>
                    <p className="text-sm text-muted-foreground">suporte@hyperbets.com</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Enviar uma Mensagem
                </CardTitle>
                <CardDescription>
                  Descreva seu problema e nossa equipe entrará em contato
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" placeholder="Seu nome" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="seu@email.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Assunto</Label>
                  <Input id="subject" placeholder="Resumo do seu problema" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Descreva seu problema em detalhes..."
                    rows={5}
                  />
                </div>
                <Button className="w-full">Enviar Mensagem</Button>
              </CardContent>
            </Card>
          </div>

          {/* FAQ */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Perguntas Frequentes</CardTitle>
              <CardDescription>Respostas para as dúvidas mais comuns</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Como cadastro uma nova entrada?</AccordionTrigger>
                  <AccordionContent>
                    Clique no botão "Cadastrar Entrada" no canto superior direito da tela. 
                    Preencha os campos obrigatórios como evento, mercado, odd e stake, 
                    e clique em salvar.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Como gerencio múltiplas bancas?</AccordionTrigger>
                  <AccordionContent>
                    Na página de Banca, você pode criar quantas bancas quiser. 
                    Use o seletor no header para alternar entre elas. 
                    Cada banca mantém seu próprio histórico e estatísticas.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Como exporto meus dados?</AccordionTrigger>
                  <AccordionContent>
                    Acesse Configurações {'->'} Dados e clique em "Exportar". 
                    Você receberá um arquivo CSV com todas as suas entradas e estatísticas.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>Posso importar dados de planilhas?</AccordionTrigger>
                  <AccordionContent>
                    Sim! Entre em contato com nosso suporte enviando sua planilha 
                    e faremos a importação para você. Em breve teremos uma ferramenta 
                    de importação automática.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger>O sistema é seguro?</AccordionTrigger>
                  <AccordionContent>
                    Sim, utilizamos criptografia de ponta a ponta e seguimos 
                    as melhores práticas de segurança. Seus dados estão protegidos 
                    e nunca são compartilhados com terceiros.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Suporte;