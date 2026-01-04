import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, TrendingUp, TrendingDown } from 'lucide-react';

const Calendario = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Mock data for calendar events
  const eventDays = [
    { date: new Date(2025, 0, 1), profit: 185, entries: 2 },
    { date: new Date(2025, 0, 2), profit: 55, entries: 2 },
    { date: new Date(2025, 0, 3), profit: 85, entries: 1 },
    { date: new Date(2024, 11, 30), profit: 88, entries: 1 },
    { date: new Date(2024, 11, 31), profit: -110, entries: 2 },
  ];

  const selectedDayEvents = eventDays.find(
    (event) => event.date.toDateString() === date?.toDateString()
  );

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-72">
        <Header onNewEntry={() => {}} />
        
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Calendário</h1>
            <p className="text-muted-foreground">Visualize seu desempenho por dia</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Calendário de Apostas
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border pointer-events-auto"
                  modifiers={{
                    profit: eventDays.filter(e => e.profit > 0).map(e => e.date),
                    loss: eventDays.filter(e => e.profit < 0).map(e => e.date),
                  }}
                  modifiersClassNames={{
                    profit: 'bg-green-500/20 text-green-600 font-bold',
                    loss: 'bg-red-500/20 text-red-600 font-bold',
                  }}
                />
              </CardContent>
            </Card>

            {/* Selected Day Details */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Dia</CardTitle>
              </CardHeader>
              <CardContent>
                {date ? (
                  <div className="space-y-4">
                    <p className="text-lg font-medium text-foreground">
                      {date.toLocaleDateString('pt-BR', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </p>
                    
                    {selectedDayEvents ? (
                      <>
                        <div className="flex items-center gap-3">
                          {selectedDayEvents.profit >= 0 ? (
                            <TrendingUp className="h-8 w-8 text-green-500" />
                          ) : (
                            <TrendingDown className="h-8 w-8 text-red-500" />
                          )}
                          <div>
                            <p className={`text-2xl font-bold ${selectedDayEvents.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {selectedDayEvents.profit >= 0 ? '+' : ''}R$ {selectedDayEvents.profit.toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground">Resultado do dia</p>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-border">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Entradas</span>
                            <Badge variant="secondary">{selectedDayEvents.entries}</Badge>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">Nenhuma entrada neste dia</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Selecione uma data</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Monthly Summary */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Resumo do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-500">+R$ 1.545</p>
                  <p className="text-sm text-muted-foreground">Lucro Total</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">18</p>
                  <p className="text-sm text-muted-foreground">Dias com Apostas</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-500">14</p>
                  <p className="text-sm text-muted-foreground">Dias Positivos</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-500">4</p>
                  <p className="text-sm text-muted-foreground">Dias Negativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Calendario;