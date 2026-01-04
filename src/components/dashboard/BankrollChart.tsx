import { useState } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { bankrollHistory } from '@/data/mockData';
import { useBanca } from '@/contexts/BancaContext';
import { subDays, subWeeks, subMonths, subYears, isAfter, parse } from 'date-fns';

type Period = '1D' | '1W' | '1M' | '3M' | '1Y';

export function BankrollChart() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('3M');
  const { selectedBanca } = useBanca();

  // Filter data based on selected period
  const getFilteredData = () => {
    const now = new Date();
    let startDate: Date;

    switch (selectedPeriod) {
      case '1D':
        startDate = subDays(now, 1);
        break;
      case '1W':
        startDate = subWeeks(now, 1);
        break;
      case '1M':
        startDate = subMonths(now, 1);
        break;
      case '3M':
        startDate = subMonths(now, 3);
        break;
      case '1Y':
        startDate = subYears(now, 1);
        break;
      default:
        startDate = subMonths(now, 3);
    }

    return bankrollHistory.filter((item) => {
      // Parse date in DD/MM format and assume current year
      const [day, month] = item.date.split('/').map(Number);
      const itemDate = new Date(2025, month - 1, day);
      return isAfter(itemDate, startDate);
    });
  };

  const filteredHistory = getFilteredData();

  // Transform data for waterfall chart
  const chartData = filteredHistory.map((item, index) => {
    const prevValue = index > 0 ? filteredHistory[index - 1].value : 0;
    const isPositive = item.change >= 0;
    
    return {
      ...item,
      base: isPositive ? prevValue : item.value,
      barHeight: Math.abs(item.change),
      isPositive,
    };
  });

  // Calculate current value and growth
  const currentValue = filteredHistory.length > 0 ? filteredHistory[filteredHistory.length - 1].value : 0;
  const initialValue = filteredHistory.length > 0 ? filteredHistory[0].value - (filteredHistory[0].change || 0) : 0;
  const growthPercent = initialValue > 0 ? ((currentValue - initialValue) / initialValue * 100).toFixed(0) : 0;

  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">Evolução da Banca</h3>
            {selectedBanca && (
              <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                {selectedBanca.name}
              </span>
            )}
          </div>
          <p className="text-2xl font-bold mt-1">R$ {currentValue.toLocaleString('pt-BR')}</p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
          Number(growthPercent) >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
        }`}>
          {Number(growthPercent) >= 0 ? '+' : ''}{growthPercent}%
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(['1D', '1W', '1M', '3M', '1Y'] as Period[]).map((period) => (
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

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(24, 95%, 53%)' }} />
          <span className="text-muted-foreground">Positivo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(24, 50%, 30%)' }} />
          <span className="text-muted-foreground">Negativo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-0.5 rounded" style={{ backgroundColor: 'hsl(24, 80%, 60%)', borderStyle: 'dashed' }} />
          <span className="text-muted-foreground">Subtotal</span>
        </div>
      </div>

      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 5, left: 0, bottom: 0 }}>
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
              tickFormatter={(value) => {
                if (value < 0) return `-R$${Math.abs(value/1000).toFixed(0)}k`;
                return `R$${(value/1000).toFixed(0)}k`
              }}
              domain={['dataMin - 2000', 'dataMax + 2000']}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const isPositive = data.change >= 0;
                  return (
                    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                      <p className="text-xs text-muted-foreground mb-1">{label}</p>
                      <p className="text-sm font-semibold">
                        Banca: R$ {data.value.toLocaleString('pt-BR')}
                      </p>
                      <p className={`text-xs font-medium mt-1 ${isPositive ? 'text-primary' : 'text-muted-foreground'}`}>
                        Variação: {isPositive ? '+' : ''}R$ {data.change.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeOpacity={0.5} />
            
            <Bar 
              dataKey="base" 
              stackId="waterfall"
              fill="transparent"
              maxBarSize={8}
            />
            
            <Bar 
              dataKey="barHeight" 
              stackId="waterfall"
              maxBarSize={8}
              radius={[1, 1, 1, 1]}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.isPositive ? 'hsl(24, 95%, 53%)' : 'hsl(24, 50%, 30%)'}
                />
              ))}
            </Bar>
            
            <Line 
              type="stepAfter" 
              dataKey="value" 
              stroke="hsl(24, 80%, 60%)"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 3"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
