import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { cn } from '@/lib/utils';

const resultColors: Record<string, string> = {
  G: 'bg-success/10 text-success',
  P: 'bg-destructive/10 text-destructive',
  C: 'bg-warning/10 text-warning-foreground',
  D: 'bg-muted text-muted-foreground',
};

export function RecentBets() {
  const { recentBets, hasData } = useDashboardMetrics();

  if (!hasData) {
    return (
      <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Entradas Recentes</h3>
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
        <h3 className="text-sm font-medium text-muted-foreground">Entradas Recentes</h3>
        <button className="text-xs text-primary font-medium hover:underline">
          Ver todas
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Data</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Evento</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Mercado</th>
              <th className="text-center py-3 px-2 text-xs font-medium text-muted-foreground">Odd</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">Stake</th>
              <th className="text-center py-3 px-2 text-xs font-medium text-muted-foreground">G/P</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">Lucro</th>
            </tr>
          </thead>
          <tbody>
            {recentBets.map((bet) => (
              <tr key={bet.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-3 px-2 text-sm">
                  {bet.data.split(' ')[0]}
                </td>
                <td className="py-3 px-2">
                  <div>
                    <p className="text-sm font-medium truncate max-w-[150px]">{bet.evento}</p>
                    <p className="text-xs text-muted-foreground">{bet.modalidade}</p>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div>
                    <p className="text-sm truncate max-w-[120px]">{bet.mercado}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[120px]">{bet.entrada}</p>
                  </div>
                </td>
                <td className="py-3 px-2 text-center text-sm font-medium">
                  {bet.odd.toFixed(2)}
                </td>
                <td className="py-3 px-2 text-right text-sm">
                  R$ {bet.stake.toFixed(2)}
                </td>
                <td className="py-3 px-2 text-center">
                  <span className={cn(
                    "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                    resultColors[bet.resultado] || 'bg-muted text-muted-foreground'
                  )}>
                    {bet.resultado}
                  </span>
                </td>
                <td className={cn(
                  "py-3 px-2 text-right text-sm font-medium",
                  bet.lucro >= 0 ? "text-success" : "text-destructive"
                )}>
                  {bet.lucro >= 0 ? '+' : ''}R$ {bet.lucro.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
