import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Target, BarChart3, PieChart, Activity } from 'lucide-react';
import { useStatisticsMetrics } from '@/hooks/useStatisticsMetrics';
import { cn } from '@/lib/utils';

const Estatisticas = () => {
  const { monthSummary, modalityStats, marketStats, advancedMetrics, hasData } = useStatisticsMetrics();

  const formatCurrency = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}R$ ${Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

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

          {!hasData ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">Nenhuma entrada cadastrada para exibir estatísticas</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Resumo do Mês */}
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-foreground">Resumo do Mês</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <p className={cn(
                        "text-2xl font-bold",
                        monthSummary.totalProfit >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {formatCurrency(monthSummary.totalProfit)}
                      </p>
                      <p className="text-sm text-muted-foreground">Lucro Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{monthSummary.daysWithBets}</p>
                      <p className="text-sm text-muted-foreground">Dias com Apostas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-success">{monthSummary.positiveDays}</p>
                      <p className="text-sm text-muted-foreground">Dias Positivos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-destructive">{monthSummary.negativeDays}</p>
                      <p className="text-sm text-muted-foreground">Dias Negativos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Maior Sequência de Vitórias</CardTitle>
                    <TrendingUp className="h-4 w-4 text-success" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{advancedMetrics.longestWinStreak}</div>
                    <p className="text-xs text-muted-foreground">entradas consecutivas</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Maior Sequência de Perdas</CardTitle>
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{advancedMetrics.longestLossStreak}</div>
                    <p className="text-xs text-muted-foreground">entradas consecutivas</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Média de Odd</CardTitle>
                    <Target className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{advancedMetrics.avgOddWins.toFixed(2)}</div>
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
                      Desempenho por Modalidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {modalityStats.length > 0 ? (
                      <div className="space-y-4">
                        {modalityStats.map((modality) => (
                          <div key={modality.name} className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-foreground truncate max-w-[150px]">{modality.name}</span>
                                <span className="text-sm text-muted-foreground">{modality.wins}/{modality.total}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ width: `${modality.total > 0 ? (modality.wins / modality.total) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                            <span className={cn(
                              "ml-4 text-sm font-medium",
                              modality.profit >= 0 ? "text-success" : "text-destructive"
                            )}>
                              {formatCurrency(modality.profit)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">Sem dados de modalidade</p>
                    )}
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
                    {marketStats.length > 0 ? (
                      <div className="space-y-4">
                        {marketStats.map((market) => (
                          <div key={market.name} className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-foreground truncate max-w-[150px]">{market.name}</span>
                                <span className="text-sm text-muted-foreground">{market.wins}/{market.total}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ width: `${market.total > 0 ? (market.wins / market.total) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                            <span className={cn(
                              "ml-4 text-sm font-medium",
                              market.profit >= 0 ? "text-success" : "text-destructive"
                            )}>
                              {formatCurrency(market.profit)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">Sem dados de mercado</p>
                    )}
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
                      <p className="text-3xl font-bold text-foreground">{advancedMetrics.winRate.toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground">Win Rate Geral</p>
                    </div>
                    <div className="text-center">
                      <p className={cn(
                        "text-3xl font-bold",
                        advancedMetrics.avgProfitPerEntry >= 0 ? "text-success" : "text-destructive"
                      )}>
                        R$ {advancedMetrics.avgProfitPerEntry.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-muted-foreground">Lucro Médio por Entrada</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-foreground">{advancedMetrics.winLossRatio.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Ratio Ganho/Perda</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-foreground">{advancedMetrics.totalEntries}</p>
                      <p className="text-sm text-muted-foreground">Total de Entradas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Estatisticas;
