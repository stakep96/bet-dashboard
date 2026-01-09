import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';

export function WinRateChart() {
  const { metrics, hasData } = useDashboardMetrics();

  // Dados para o gráfico de pizza (apenas ganhas vs perdidas para o visual principal)
  const chartData = [
    { name: 'Ganhas', value: metrics.wins, color: 'hsl(142, 71%, 45%)' },
    { name: 'Perdidas', value: metrics.losses, color: 'hsl(0, 72%, 51%)' },
  ];

  // Dados completos para exibição na legenda
  const allResults = [
    { name: 'Ganhas', value: metrics.wins - metrics.halfWins, color: 'hsl(142, 71%, 45%)' },
    { name: 'Perdidas', value: metrics.losses - metrics.halfLosses, color: 'hsl(0, 72%, 51%)' },
    { name: 'Ganhou Metade', value: metrics.halfWins, color: 'hsl(142, 71%, 65%)' },
    { name: 'Perdeu Metade', value: metrics.halfLosses, color: 'hsl(0, 72%, 70%)' },
    { name: 'Cashout', value: metrics.cashouts, color: 'hsl(45, 93%, 47%)' },
    { name: 'Devolvida', value: metrics.returned, color: 'hsl(220, 9%, 46%)' },
    { name: 'Pendente', value: metrics.pending, color: 'hsl(220, 14%, 71%)' },
  ].filter(item => item.value > 0);

  if (!hasData) {
    return (
      <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Taxa de Acerto</h3>
        </div>
        <div className="h-[160px] flex items-center justify-center text-muted-foreground">
          <p className="text-sm">Sem dados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Taxa de Acerto</h3>
        <button className="text-xs text-primary font-medium hover:underline">
          Detalhes
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="h-[160px] w-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1">
          <p className="text-3xl font-bold text-success">{metrics.winRate.toFixed(1)}%</p>
          <p className="text-sm text-muted-foreground mt-1">Win Rate</p>
          
          <div className="mt-3 space-y-1.5 max-h-[100px] overflow-y-auto">
            {allResults.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs">{item.name}</span>
                </div>
                <span className="text-xs font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
