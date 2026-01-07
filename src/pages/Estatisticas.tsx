import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Target, BarChart3, PieChart, Activity, DollarSign, Percent, AlertTriangle, Trophy, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStatisticsMetrics } from '@/hooks/useStatisticsMetrics';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, subMonths, addMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Estatisticas = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { monthSummary, modalityStats, marketStats, advancedMetrics, topWinners, topLosers, hasData } = useStatisticsMetrics(selectedMonth);

  const isCurrentMonth = isSameMonth(selectedMonth, new Date());

  const handlePreviousMonth = () => {
    setSelectedMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    if (!isCurrentMonth) {
      setSelectedMonth(prev => addMonths(prev, 1));
    }
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(new Date());
  };

  const formatCurrency = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}R$ ${Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatCurrencySimple = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-72">
        <Header onNewEntry={() => {}} />
        
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Estatísticas</h1>
              <p className="text-muted-foreground">Análise detalhada do seu desempenho</p>
            </div>
            
            {/* Month Selector */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={handlePreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant={isCurrentMonth ? "default" : "outline"}
                onClick={handleCurrentMonth}
                className="min-w-[140px] capitalize"
              >
                {format(selectedMonth, "MMMM yyyy", { locale: ptBR })}
              </Button>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleNextMonth}
                disabled={isCurrentMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!hasData ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">
                  Nenhuma entrada encontrada em {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Resumo Geral */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <BarChart3 className="h-3.5 w-3.5" />
                      Total Apostas
                    </div>
                    <p className="text-2xl font-bold text-foreground">{advancedMetrics.totalEntries}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <Trophy className="h-3.5 w-3.5 text-success" />
                      Vitórias
                    </div>
                    <p className="text-2xl font-bold text-success">{advancedMetrics.wins}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <XCircle className="h-3.5 w-3.5 text-destructive" />
                      Derrotas
                    </div>
                    <p className="text-2xl font-bold text-destructive">{advancedMetrics.losses}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <Clock className="h-3.5 w-3.5 text-warning" />
                      Pendentes
                    </div>
                    <p className="text-2xl font-bold text-warning">{advancedMetrics.pending}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      Volume Total
                    </div>
                    <p className="text-2xl font-bold text-foreground">{formatCurrencySimple(advancedMetrics.totalVolume)}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <Percent className="h-3.5 w-3.5" />
                      ROI Geral
                    </div>
                    <p className={cn(
                      "text-2xl font-bold",
                      advancedMetrics.roi >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {advancedMetrics.roi.toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Lucros e Perdas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-success/30 bg-success/5">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-success text-xs mb-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Total Ganho
                    </div>
                    <p className="text-2xl font-bold text-success">+{formatCurrencySimple(advancedMetrics.totalProfit)}</p>
                  </CardContent>
                </Card>
                
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-destructive text-xs mb-1">
                      <TrendingDown className="h-3.5 w-3.5" />
                      Total Perdido
                    </div>
                    <p className="text-2xl font-bold text-destructive">-{formatCurrencySimple(advancedMetrics.totalLoss)}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <Target className="h-3.5 w-3.5" />
                      Win Rate
                    </div>
                    <p className="text-2xl font-bold text-foreground">{advancedMetrics.winRate.toFixed(1)}%</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      Stake Média
                    </div>
                    <p className="text-2xl font-bold text-foreground">{formatCurrencySimple(advancedMetrics.avgStake)}</p>
                  </CardContent>
                </Card>
              </div>

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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                    <CardTitle className="text-sm font-medium text-muted-foreground">Média de Odd (Vitórias)</CardTitle>
                    <Target className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{advancedMetrics.avgOddWins.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">nas entradas ganhas</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Médio/Entrada</CardTitle>
                    <Activity className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className={cn(
                      "text-2xl font-bold",
                      advancedMetrics.avgProfitPerEntry >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {formatCurrency(advancedMetrics.avgProfitPerEntry)}
                    </div>
                    <p className="text-xs text-muted-foreground">por aposta</p>
                  </CardContent>
                </Card>
              </div>

              {/* Onde mais venceu */}
              {(topWinners.bestModality && topWinners.bestModality.profit > 0) || (topWinners.bestMarket && topWinners.bestMarket.profit > 0) ? (
                <Card className="mb-6 border-success/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-success">
                      <Trophy className="h-5 w-5" />
                      Onde Você Mais Venceu
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {topWinners.bestModality && topWinners.bestModality.profit > 0 && (
                        <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                          <p className="text-sm text-muted-foreground mb-1">Melhor Modalidade</p>
                          <p className="text-lg font-semibold text-foreground">{topWinners.bestModality.name}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-success font-bold">{formatCurrency(topWinners.bestModality.profit)}</span>
                            <span className="text-sm text-muted-foreground">
                              {topWinners.bestModality.wins} vitórias • {topWinners.bestModality.winRate.toFixed(0)}% win rate
                            </span>
                          </div>
                        </div>
                      )}
                      {topWinners.bestMarket && topWinners.bestMarket.profit > 0 && (
                        <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                          <p className="text-sm text-muted-foreground mb-1">Melhor Mercado</p>
                          <p className="text-lg font-semibold text-foreground">{topWinners.bestMarket.name}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-success font-bold">{formatCurrency(topWinners.bestMarket.profit)}</span>
                            <span className="text-sm text-muted-foreground">
                              {topWinners.bestMarket.wins} vitórias • {topWinners.bestMarket.winRate.toFixed(0)}% win rate
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {/* Onde mais perdeu */}
              {(topLosers.worstModality && topLosers.worstModality.profit < 0) || (topLosers.worstMarket && topLosers.worstMarket.profit < 0) ? (
                <Card className="mb-6 border-destructive/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Onde Você Mais Perdeu
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {topLosers.worstModality && topLosers.worstModality.profit < 0 && (
                        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                          <p className="text-sm text-muted-foreground mb-1">Pior Modalidade</p>
                          <p className="text-lg font-semibold text-foreground">{topLosers.worstModality.name}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-destructive font-bold">{formatCurrency(topLosers.worstModality.profit)}</span>
                            <span className="text-sm text-muted-foreground">
                              {topLosers.worstModality.losses} perdas • {topLosers.worstModality.winRate.toFixed(0)}% win rate
                            </span>
                          </div>
                        </div>
                      )}
                      {topLosers.worstMarket && topLosers.worstMarket.profit < 0 && (
                        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                          <p className="text-sm text-muted-foreground mb-1">Pior Mercado</p>
                          <p className="text-lg font-semibold text-foreground">{topLosers.worstMarket.name}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-destructive font-bold">{formatCurrency(topLosers.worstMarket.profit)}</span>
                            <span className="text-sm text-muted-foreground">
                              {topLosers.worstMarket.losses} perdas • {topLosers.worstMarket.winRate.toFixed(0)}% win rate
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {/* Performance por Modalidade - Tabela Completa */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    Desempenho por Modalidade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {modalityStats.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Modalidade</TableHead>
                            <TableHead className="text-center">Apostas</TableHead>
                            <TableHead className="text-center">V/D</TableHead>
                            <TableHead className="text-center">Win Rate</TableHead>
                            <TableHead className="text-right">Volume</TableHead>
                            <TableHead className="text-right">Lucro/Perda</TableHead>
                            <TableHead className="text-right">ROI</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {modalityStats.map((modality) => (
                            <TableRow key={modality.name}>
                              <TableCell className="font-medium">{modality.name}</TableCell>
                              <TableCell className="text-center">{modality.total}</TableCell>
                              <TableCell className="text-center">
                                <span className="text-success">{modality.wins}</span>
                                <span className="text-muted-foreground">/</span>
                                <span className="text-destructive">{modality.losses}</span>
                              </TableCell>
                              <TableCell className="text-center">{modality.winRate.toFixed(1)}%</TableCell>
                              <TableCell className="text-right">{formatCurrencySimple(modality.volume)}</TableCell>
                              <TableCell className={cn(
                                "text-right font-medium",
                                modality.profit >= 0 ? "text-success" : "text-destructive"
                              )}>
                                {formatCurrency(modality.profit)}
                              </TableCell>
                              <TableCell className={cn(
                                "text-right font-medium",
                                modality.roi >= 0 ? "text-success" : "text-destructive"
                              )}>
                                {modality.roi.toFixed(1)}%
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">Sem dados de modalidade</p>
                  )}
                </CardContent>
              </Card>

              {/* Performance por Mercado - Tabela Completa */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Desempenho por Mercado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {marketStats.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mercado</TableHead>
                            <TableHead className="text-center">Apostas</TableHead>
                            <TableHead className="text-center">V/D</TableHead>
                            <TableHead className="text-center">Win Rate</TableHead>
                            <TableHead className="text-right">Volume</TableHead>
                            <TableHead className="text-right">Lucro/Perda</TableHead>
                            <TableHead className="text-right">ROI</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {marketStats.map((market) => (
                            <TableRow key={market.name}>
                              <TableCell className="font-medium">{market.name}</TableCell>
                              <TableCell className="text-center">{market.total}</TableCell>
                              <TableCell className="text-center">
                                <span className="text-success">{market.wins}</span>
                                <span className="text-muted-foreground">/</span>
                                <span className="text-destructive">{market.losses}</span>
                              </TableCell>
                              <TableCell className="text-center">{market.winRate.toFixed(1)}%</TableCell>
                              <TableCell className="text-right">{formatCurrencySimple(market.volume)}</TableCell>
                              <TableCell className={cn(
                                "text-right font-medium",
                                market.profit >= 0 ? "text-success" : "text-destructive"
                              )}>
                                {formatCurrency(market.profit)}
                              </TableCell>
                              <TableCell className={cn(
                                "text-right font-medium",
                                market.roi >= 0 ? "text-success" : "text-destructive"
                              )}>
                                {market.roi.toFixed(1)}%
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">Sem dados de mercado</p>
                  )}
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
