import { mockBets } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const resultColors = {
  GREEN: 'bg-success/10 text-success',
  RED: 'bg-destructive/10 text-destructive',
  CASHOUT: 'bg-warning/10 text-warning-foreground',
  DEVOLVIDA: 'bg-muted text-muted-foreground',
  PENDING: 'bg-primary/10 text-primary',
};

const resultLabels = {
  GREEN: 'G',
  RED: 'P',
  CASHOUT: 'C',
  DEVOLVIDA: 'D',
  PENDING: '-',
};

export function RecentBets() {
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
              <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Partida</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Mercado</th>
              <th className="text-center py-3 px-2 text-xs font-medium text-muted-foreground">Odd</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">Stake</th>
              <th className="text-center py-3 px-2 text-xs font-medium text-muted-foreground">G/P</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {mockBets.slice(0, 5).map((bet) => (
              <tr key={bet.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-3 px-2 text-sm">
                  {format(bet.createdAt, 'dd/MM', { locale: ptBR })}
                </td>
                <td className="py-3 px-2">
                  <div>
                    <p className="text-sm font-medium">{bet.match}</p>
                    <p className="text-xs text-muted-foreground">{bet.modality}</p>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div>
                    <p className="text-sm">{bet.market}</p>
                    <p className="text-xs text-muted-foreground">{bet.entry}</p>
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
                    resultColors[bet.result]
                  )}>
                    {resultLabels[bet.result]}
                  </span>
                </td>
                <td className={cn(
                  "py-3 px-2 text-right text-sm font-medium",
                  bet.profitLoss >= 0 ? "text-success" : "text-destructive"
                )}>
                  {bet.profitLoss >= 0 ? '+' : ''}R$ {bet.profitLoss.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
