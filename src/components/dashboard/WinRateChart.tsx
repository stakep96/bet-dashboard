import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';

export function WinRateChart() {
  const { metrics, hasData } = useDashboardMetrics();

  const data = [
    { name: 'Ganhas', value: metrics.wins, color: 'hsl(142, 71%, 45%)' },
    { name: 'Perdidas', value: metrics.losses, color: 'hsl(0, 72%, 51%)' },
  ];

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
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1">
          <p className="text-3xl font-bold text-success">{metrics.winRate.toFixed(1)}%</p>
          <p className="text-sm text-muted-foreground mt-1">Win Rate</p>
          
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-sm">Ganhas</span>
              </div>
              <span className="text-sm font-medium">{metrics.wins}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-sm">Perdidas</span>
              </div>
              <span className="text-sm font-medium">{metrics.losses}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
