import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { useBanca } from '@/contexts/BancaContext';
import { useDashboardMetrics, filterByPeriod } from '@/hooks/useDashboardMetrics';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const parseChartDate = (dateStr: string): Date | null => {
  try {
    const parsed = parse(dateStr, 'dd/MM', new Date());
    if (!isNaN(parsed.getTime())) return parsed;
    return null;
  } catch {
    return null;
  }
};

type Period = '1W' | '1M' | '3M' | '6M' | '1Y';

export function DailyPnLChart() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('3M');
  const { selectedBanca } = useBanca();
  const { dailyPnL, hasData } = useDashboardMetrics();

  const filteredData = filterByPeriod(dailyPnL, selectedPeriod);
  const totalPnL = filteredData.reduce((acc, curr) => acc + curr.pnl, 0);
  const isPositive = totalPnL >= 0;

  if (!hasData) {
    return (
      <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-muted-foreground">PNL Diário</h3>
              {selectedBanca && (
                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                  {selectedBanca.name}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold mt-1">R$ 0,00</p>
          </div>
        </div>
        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
          <p>Importe entradas para visualizar o gráfico</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">PNL Diário</h3>
            {selectedBanca && (
              <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                {selectedBanca.name}
              </span>
            )}
          </div>
          <p className="text-2xl font-bold mt-1">
            R$ {Math.abs(totalPnL).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
          isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
        }`}>
          {isPositive ? '+' : '-'}{Math.abs(totalPnL).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(['1W', '1M', '3M', '6M', '1Y'] as Period[]).map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              period === selectedPeriod 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData} margin={{ top: 10, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={45}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `R$${value >= 0 ? '' : '-'}${Math.abs(value / 1000).toFixed(1)}k`}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const date = parseChartDate(data.date);
                  const formattedDate = date ? format(date, "dd/MMM", { locale: ptBR }).replace('.', '') : data.date;
                  const isPositive = data.pnl >= 0;
                  return (
                    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                      <p className="text-xs text-muted-foreground mb-2">{formattedDate}</p>
                      <p className={`text-sm font-semibold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                        PNL: R$ {isPositive ? '+' : ''}{data.pnl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
            <Bar 
              dataKey="pnl" 
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            >
              {filteredData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.pnl >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
