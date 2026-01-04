import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { BankrollChart } from '@/components/dashboard/BankrollChart';
import { WinRateChart } from '@/components/dashboard/WinRateChart';
import { RecentBets } from '@/components/dashboard/RecentBets';
import { MonthlyPerformance } from '@/components/dashboard/MonthlyPerformance';
import { NewBetForm } from '@/components/forms/NewBetForm';
import { mockDashboardStats } from '@/data/mockData';
import { Wallet, TrendingUp, Target, BarChart3 } from 'lucide-react';

const Index = () => {
  const [showNewBetForm, setShowNewBetForm] = useState(false);

  const handleNewBet = (data: any) => {
    console.log('Nova entrada:', data);
    // Aqui você salvaria os dados
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-64">
        <Header onNewEntry={() => setShowNewBetForm(true)} />
        
        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="Banca Atual"
              value={`R$ ${mockDashboardStats.currentBankroll.toLocaleString('pt-BR')}`}
              change={465.42}
              changeLabel="desde o início"
              icon={<Wallet className="w-4 h-4" />}
              variant="success"
            />
            <StatsCard
              title="ROI Total"
              value={`${mockDashboardStats.roi.toFixed(2)}%`}
              change={12.5}
              changeLabel="vs mês anterior"
              icon={<TrendingUp className="w-4 h-4" />}
              variant="success"
            />
            <StatsCard
              title="Win Rate"
              value={`${mockDashboardStats.winRate}%`}
              change={2.3}
              changeLabel="vs mês anterior"
              icon={<Target className="w-4 h-4" />}
            />
            <StatsCard
              title="Total Entradas"
              value={mockDashboardStats.totalEntries.toString()}
              change={8.1}
              changeLabel="vs mês anterior"
              icon={<BarChart3 className="w-4 h-4" />}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-2">
              <BankrollChart />
            </div>
            <WinRateChart />
          </div>

          {/* Tables Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RecentBets />
            <MonthlyPerformance />
          </div>
        </main>
      </div>

      {/* New Bet Modal */}
      {showNewBetForm && (
        <NewBetForm 
          onClose={() => setShowNewBetForm(false)}
          onSubmit={handleNewBet}
        />
      )}
    </div>
  );
};

export default Index;
