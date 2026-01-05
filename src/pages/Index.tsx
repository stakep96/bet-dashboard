import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { BankrollChart } from '@/components/dashboard/BankrollChart';
import { WinRateChart } from '@/components/dashboard/WinRateChart';
import { DailyPnLChart } from '@/components/dashboard/DailyPnLChart';
import { RecentBets } from '@/components/dashboard/RecentBets';
import { MonthlyPerformance } from '@/components/dashboard/MonthlyPerformance';
import { NewBetForm } from '@/components/forms/NewBetForm';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useBanca, Entrada } from '@/contexts/BancaContext';
import { toast } from 'sonner';
import { Wallet, TrendingUp, Target, BarChart3, Loader2 } from 'lucide-react';

const Index = () => {
  const [showNewBetForm, setShowNewBetForm] = useState(false);
  const { metrics, hasData } = useDashboardMetrics();
  const { addEntradas, selectedBancaIds, loading } = useBanca();

  const handleNewBet = async (data: any) => {
    if (selectedBancaIds.length !== 1) {
      toast.error('Selecione apenas uma banca para cadastrar a entrada.');
      return false;
    }

    const toISODate = (value: any) => {
      if (!value) return new Date().toISOString().split('T')[0];
      const d = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      return d.toISOString().split('T')[0];
    };

    const mapResultado = (value: any): Entrada['resultado'] => {
      const v = String(value || '').toUpperCase().trim();
      if (v === 'GREEN' || v === 'G') return 'G';
      if (v === 'RED' || v === 'P') return 'P';
      if (v === 'CASHOUT' || v === 'CASH' || v === 'C') return 'C';
      if (v === 'DEVOLVIDA' || v === 'DEV' || v === 'D') return 'D';
      return 'Pendente';
    };

    const mapEntry = (item: any) => ({
      data: toISODate(item?.createdAt),
      dataEvento: toISODate(item?.eventDate),
      modalidade: (item?.modality || 'OUTRO') as string,
      evento: String(item?.match || ''),
      mercado: String(item?.market || ''),
      entrada: String(item?.entry || ''),
      odd: Number(item?.odd || 0),
      stake: Number(item?.stake || 0),
      resultado: mapResultado(item?.result),
      lucro: Number(item?.profitLoss || 0),
      timing: String(item?.timing || 'PRÉ'),
      site: String(item?.bookmaker || ''),
    });

    // Handle array of entries (combined bets) or single entry
    const entries = Array.isArray(data) ? data.map(mapEntry) : [mapEntry(data)];
    await addEntradas(entries);

    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-72">
        <Header onNewEntry={() => setShowNewBetForm(true)} />
        
        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="Banca Atual"
              value={`R$ ${metrics.currentBankroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              change={metrics.roi}
              changeLabel="ROI total"
              icon={<Wallet className="w-4 h-4" />}
              variant={metrics.totalPnL >= 0 ? 'success' : 'danger'}
            />
            <StatsCard
              title="ROI Total"
              value={`${metrics.roi.toFixed(2)}%`}
              icon={<TrendingUp className="w-4 h-4" />}
              variant={metrics.roi >= 0 ? 'success' : 'danger'}
            />
            <StatsCard
              title="Win Rate"
              value={`${metrics.winRate.toFixed(1)}%`}
              icon={<Target className="w-4 h-4" />}
            />
            <StatsCard
              title="Total Entradas"
              value={metrics.totalEntries.toString()}
              changeLabel={`${metrics.wins}G / ${metrics.losses}P`}
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

          {/* PNL Chart */}
          <div className="mb-6">
            <DailyPnLChart />
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
