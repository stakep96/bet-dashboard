import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { cn } from '@/lib/utils';

export function MonthlyPerformance() {
  const { monthlyStats, hasData } = useDashboardMetrics();

  if (!hasData) {
    return (
      <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Performance Mensal</h3>
        </div>
        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
          <p className="text-sm">Nenhuma entrada cadastrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Performance Mensal</h3>
        <button className="text-xs text-primary font-medium hover:underline">
          Ver relatório
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Mês</th>
              <th className="text-center py-3 px-2 text-xs font-medium text-muted-foreground">Entradas</th>
              <th className="text-center py-3 px-2 text-xs font-medium text-muted-foreground">G/P</th>
              <th className="text-center py-3 px-2 text-xs font-medium text-muted-foreground">ROI</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">PNL</th>
              <th className="text-center py-3 px-2 text-xs font-medium text-muted-foreground">Cresc. Banca</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">Banca</th>
            </tr>
          </thead>
          <tbody>
            {monthlyStats.map((month) => (
              <tr key={month.month} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-3 px-2 text-sm font-medium">{month.month}</td>
                <td className="py-3 px-2 text-center text-sm">{month.entries}</td>
                <td className="py-3 px-2 text-center">
                  <span className="text-success text-sm">{month.wins}</span>
                  <span className="text-muted-foreground mx-1">/</span>
                  <span className="text-destructive text-sm">{month.losses}</span>
                </td>
                <td className={cn(
                  "py-3 px-2 text-center text-sm font-medium",
                  month.roi >= 0 ? "text-success" : "text-destructive"
                )}>
                  {month.roi >= 0 ? '+' : ''}{month.roi.toFixed(2)}%
                </td>
                <td className={cn(
                  "py-3 px-2 text-right text-sm font-medium",
                  month.pnl >= 0 ? "text-success" : "text-destructive"
                )}>
                  {month.pnl >= 0 ? '+' : ''}R$ {Math.abs(month.pnl).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className={cn(
                  "py-3 px-2 text-center text-sm font-medium",
                  month.bankrollGrowth >= 0 ? "text-success" : "text-destructive"
                )}>
                  {month.bankrollGrowth >= 0 ? '+' : ''}{month.bankrollGrowth.toFixed(2)}%
                </td>
                <td className="py-3 px-2 text-right text-sm">
                  R$ {month.bankroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
