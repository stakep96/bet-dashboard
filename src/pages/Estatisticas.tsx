import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Target, BarChart3, PieChart, Activity } from 'lucide-react';

const Estatisticas = () => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-72">
        <Header onNewEntry={() => {}} />
        
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Estatísticas</h1>
            <p className="text-muted-foreground">Análise detalhada do seu desempenho</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Maior Sequência de Vitórias</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">12</div>
                <p className="text-xs text-muted-foreground">entradas consecutivas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Maior Sequência de Perdas</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">5</div>
                <p className="text-xs text-muted-foreground">entradas consecutivas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Média de Odd</CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">1.85</div>
                <p className="text-xs text-muted-foreground">nas entradas ganhas</p>
              </CardContent>
            </Card>
          </div>

          {/* Performance by Category */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Desempenho por Esporte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Futebol', wins: 45, total: 60, profit: 850 },
                    { name: 'Basquete', wins: 22, total: 30, profit: 420 },
                    { name: 'Tênis', wins: 15, total: 25, profit: 180 },
                    { name: 'E-Sports', wins: 8, total: 12, profit: 95 },
                  ].map((sport) => (
                    <div key={sport.name} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{sport.name}</span>
                          <span className="text-sm text-muted-foreground">{sport.wins}/{sport.total}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${(sport.wins / sport.total) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="ml-4 text-sm font-medium text-green-500">+R$ {sport.profit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Desempenho por Mercado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Resultado Final', wins: 38, total: 50, profit: 620 },
                    { name: 'Over/Under', wins: 28, total: 40, profit: 380 },
                    { name: 'Handicap', wins: 18, total: 30, profit: 290 },
                    { name: 'Ambas Marcam', wins: 12, total: 20, profit: 145 },
                  ].map((market) => (
                    <div key={market.name} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{market.name}</span>
                          <span className="text-sm text-muted-foreground">{market.wins}/{market.total}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${(market.wins / market.total) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="ml-4 text-sm font-medium text-green-500">+R$ {market.profit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Métricas Avançadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">67.5%</p>
                  <p className="text-sm text-muted-foreground">Win Rate Geral</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">R$ 45,20</p>
                  <p className="text-sm text-muted-foreground">Lucro Médio por Entrada</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">2.3</p>
                  <p className="text-sm text-muted-foreground">Ratio Ganho/Perda</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">127</p>
                  <p className="text-sm text-muted-foreground">Total de Entradas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Estatisticas;