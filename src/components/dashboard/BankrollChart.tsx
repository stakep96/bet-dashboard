import { useState, useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { useBanca } from '@/contexts/BancaContext';
import { useDashboardMetrics, filterByPeriod } from '@/hooks/useDashboardMetrics';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Period = '1D' | '1W' | '1M' | '3M' | '1Y';

// Helper to parse date string to Date object
const parseChartDate = (dateStr: string): Date | null => {
  // Try dd/MM format first
  let parsed = parse(dateStr, 'dd/MM', new Date());
  if (isValid(parsed)) return parsed;
  
  // Try dd/MM/yyyy
  parsed = parse(dateStr, 'dd/MM/yyyy', new Date());
  if (isValid(parsed)) return parsed;
  
  // Try ISO format
  parsed = new Date(dateStr);
  if (isValid(parsed)) return parsed;
  
  return null;
};

export function BankrollChart() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('3M');
  const { selectedBanca } = useBanca();
  const { bankrollHistory, hasData } = useDashboardMetrics();

  // Filter data based on selected period
  const filteredHistory = filterByPeriod(bankrollHistory, selectedPeriod);

  // Aggregate data by month
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, { value: number; change: number; label: string }>();
    
    filteredHistory.forEach((item) => {
      const date = parseChartDate(item.date);
      if (!date) return;
      
      const monthKey = format(date, 'yyyy-MM');
      const monthLabel = format(date, 'MMM/yy', { locale: ptBR });
      
      if (monthMap.has(monthKey)) {
        const existing = monthMap.get(monthKey)!;
        existing.change += item.change;
        existing.value = item.value; // Take the last value of the month
      } else {
        monthMap.set(monthKey, {
          value: item.value,
          change: item.change,
          label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        });
      }
    });
    
    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, data]) => data);
  }, [filteredHistory]);

  // Transform data for waterfall chart
  const chartData = monthlyData.map((item, index) => {
    const prevValue = index > 0 ? monthlyData[index - 1].value : 0;
    const isPositive = item.change >= 0;
    
    return {
      date: item.label,
      value: item.value,
      change: item.change,
      base: isPositive ? prevValue : item.value,
      barHeight: Math.abs(item.change),
      isPositive,
    };
  });

  // Calculate current value and growth
  const currentValue = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].value : 0;
  const initialValue = monthlyData.length > 0 ? monthlyData[0].value - (monthlyData[0].change || 0) : 0;
  const growthPercent = initialValue > 0 ? ((currentValue - initialValue) / initialValue * 100).toFixed(0) : 0;

  if (!hasData) {
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
            <p className="text-2xl font-bold mt-1">R$ 0,00</p>
          </div>
        </div>
        <div className="h-[220px] flex items-center justify-center text-muted-foreground">
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
            <h3 className="text-sm font-medium text-muted-foreground">Evolução da Banca</h3>
            {selectedBanca && (
              <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                {selectedBanca.name}
              </span>
            )}
          </div>
          <p className="text-2xl font-bold mt-1">R$ {currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
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
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              interval={0}
              height={30}
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
                        Banca: R$ {data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className={`text-xs font-medium mt-1 ${isPositive ? 'text-primary' : 'text-muted-foreground'}`}>
                        Variação: {isPositive ? '+' : ''}R$ {data.change.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
