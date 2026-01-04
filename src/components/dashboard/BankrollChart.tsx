import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { bankrollHistory } from '@/data/mockData';

export function BankrollChart() {
  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Evolução da Banca</h3>
          <p className="text-2xl font-bold mt-1">R$ 16.564,45</p>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-success/10 text-success text-sm font-medium">
          +465%
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {['1D', '1W', '1M', '3M', '1Y'].map((period) => (
          <button
            key={period}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              period === '1M' 
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
          <AreaChart data={bankrollHistory} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBankroll" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0}/>
              </linearGradient>
            </defs>
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
              tickFormatter={(value) => `R$${(value/1000).toFixed(0)}k`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Banca']}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(24, 95%, 53%)" 
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorBankroll)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
