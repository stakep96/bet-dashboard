import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { dailyPnL } from '@/data/mockData';
import { useBanca } from '@/contexts/BancaContext';
import { subDays, subWeeks, subMonths, subYears, isAfter } from 'date-fns';

type Period = '1W' | '1M' | '3M' | '6M' | '1Y';

export function DailyPnLChart() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('3M');
  const { selectedBanca } = useBanca();

  // Filter data based on selected period
  const getFilteredData = () => {
    const now = new Date();
    let startDate: Date;

    switch (selectedPeriod) {
      case '1W':
        startDate = subWeeks(now, 1);
        break;
      case '1M':
        startDate = subMonths(now, 1);
        break;
      case '3M':
        startDate = subMonths(now, 3);
        break;
      case '6M':
        startDate = subMonths(now, 6);
        break;
      case '1Y':
        startDate = subYears(now, 1);
        break;
      default:
        startDate = subMonths(now, 3);
    }

    return dailyPnL.filter((item) => {
      const [day, month] = item.date.split('/').map(Number);
      const itemDate = new Date(2025, month - 1, day);
      return isAfter(itemDate, startDate);
    });
  };

  const filteredData = getFilteredData();
  const totalPnL = filteredData.reduce((acc, curr) => acc + curr.pnl, 0);
  const isPositive = totalPnL >= 0;

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
          {isPositive ? '+' : '-'}{((Math.abs(totalPnL) / 10000) * 100).toFixed(1)}%
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
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              formatter={(value: number) => [
                `R$ ${value >= 0 ? '+' : ''}${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
                'PNL'
              ]}
              labelFormatter={(label) => `Data: ${label}`}
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
