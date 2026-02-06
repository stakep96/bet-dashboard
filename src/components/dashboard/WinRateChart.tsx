import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';

interface WinRateChartProps {
  selectedMonth?: Date | null;
}

export function WinRateChart({ selectedMonth }: WinRateChartProps) {
  const { metrics, hasData } = useDashboardMetrics(selectedMonth);

  // Dados completos para exibição (incluindo valores zerados na legenda)
  // Ordenados do maior para o menor valor
  const allResultsSorted = [
    { name: 'Ganhas', value: metrics.wins - metrics.halfWins, color: 'hsl(142, 71%, 45%)' },
    { name: 'Perdidas', value: metrics.losses - metrics.halfLosses, color: 'hsl(0, 72%, 51%)' },
    { name: 'Ganhou Metade', value: metrics.halfWins, color: 'hsl(142, 71%, 65%)' },
    { name: 'Perdeu Metade', value: metrics.halfLosses, color: 'hsl(0, 72%, 70%)' },
    { name: 'Cashout', value: metrics.cashouts, color: 'hsl(45, 93%, 47%)' },
    { name: 'Devolvida', value: metrics.returned, color: 'hsl(220, 9%, 46%)' },
    { name: 'Pendente', value: metrics.pending, color: 'hsl(220, 14%, 71%)' },
  ].sort((a, b) => b.value - a.value);

  // Dividir em duas colunas: primeiro metade na coluna 1 (de cima para baixo), depois na coluna 2
  const halfLength = Math.ceil(allResultsSorted.length / 2);
  const column1 = allResultsSorted.slice(0, halfLength);
  const column2 = allResultsSorted.slice(halfLength);

  // Dados para o gráfico de pizza (apenas valores > 0)
  const chartData = allResultsSorted.filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = metrics.wins + metrics.losses;
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0';
      return (
        <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
          <div className="flex items-center gap-2">
            <div 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: data.color }}
            />
            <span className="text-sm font-medium">{data.name}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {data.value} apostas ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (!hasData) {
    return (
      <div className="bg-card rounded-xl p-5 border border-border shadow-sm h-full">
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
    <div className="bg-card rounded-xl p-5 border border-border shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">Taxa de Acerto</h3>
        <button className="text-xs text-primary font-medium hover:underline">
          Detalhes
        </button>
      </div>

      {/* Pie Chart and Win Rate - centered in available space */}
      <div className="flex-1 flex items-center justify-center gap-6">
        <div className="h-[160px] w-[160px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-success">{metrics.winRate.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">Win Rate</p>
        </div>
      </div>

      {/* Legend below - 2 columns, sorted by value descending, column 1 then column 2 */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-auto">
        {/* Column 1 */}
        <div className="flex flex-col gap-1.5">
          {column1.map((item, index) => (
            <div key={index} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs truncate">{item.name}</span>
              </div>
              <span className="text-xs font-semibold flex-shrink-0">{item.value}</span>
            </div>
          ))}
        </div>
        {/* Column 2 */}
        <div className="flex flex-col gap-1.5">
          {column2.map((item, index) => (
            <div key={index} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs truncate">{item.name}</span>
              </div>
              <span className="text-xs font-semibold flex-shrink-0">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
