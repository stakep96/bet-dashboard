import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { dailyPnL } from '@/data/mockData';

export function DailyPnLChart() {
  const totalPnL = dailyPnL.reduce((acc, curr) => acc + curr.pnl, 0);
  const isPositive = totalPnL >= 0;

  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">PNL Diário</h3>
          <p className="text-2xl font-bold mt-1">
            R$ {Math.abs(totalPnL).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
          isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
        }`}>
          {isPositive ? '+' : '-'}{((totalPnL / 10000) * 100).toFixed(1)}%
        </div>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dailyPnL} margin={{ top: 10, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
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
              {dailyPnL.map((entry, index) => (
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
