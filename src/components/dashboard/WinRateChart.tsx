import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { mockDashboardStats } from '@/data/mockData';

const data = [
  { name: 'Ganhas', value: mockDashboardStats.wins, color: 'hsl(142, 71%, 45%)' },
  { name: 'Perdidas', value: mockDashboardStats.losses, color: 'hsl(0, 72%, 51%)' },
];

export function WinRateChart() {
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
          <p className="text-3xl font-bold text-success">{mockDashboardStats.winRate}%</p>
          <p className="text-sm text-muted-foreground mt-1">Win Rate</p>
          
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-sm">Ganhas</span>
              </div>
              <span className="text-sm font-medium">{mockDashboardStats.wins}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-sm">Perdidas</span>
              </div>
              <span className="text-sm font-medium">{mockDashboardStats.losses}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
