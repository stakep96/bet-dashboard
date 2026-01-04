import { useMemo } from 'react';
import { useBanca, Entrada } from '@/contexts/BancaContext';
import { format, parse, isAfter, subDays, subWeeks, subMonths, subYears, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DashboardMetrics {
  // Stats Cards
  currentBankroll: number;
  totalPnL: number;
  roi: number;
  winRate: number;
  totalEntries: number;
  wins: number;
  losses: number;
  avgOdd: number;
  avgStake: number;
  totalStaked: number;
}

export interface BankrollDataPoint {
  date: string;
  value: number;
  change: number;
}

export interface DailyPnLDataPoint {
  date: string;
  pnl: number;
}

export interface MonthlyStats {
  month: string;
  entries: number;
  wins: number;
  losses: number;
  cashouts: number;
  returned: number;
  avgOdd: number;
  avgStake: number;
  totalStaked: number;
  pnl: number;
  roi: number;
  bankroll: number;
}

export function useDashboardMetrics() {
  const { getEntradasByBanca, selectedBanca } = useBanca();
  const entradas = getEntradasByBanca();

  const metrics = useMemo((): DashboardMetrics => {
    if (entradas.length === 0) {
      return {
        currentBankroll: selectedBanca?.balance || 0,
        totalPnL: 0,
        roi: 0,
        winRate: 0,
        totalEntries: 0,
        wins: 0,
        losses: 0,
        avgOdd: 0,
        avgStake: 0,
        totalStaked: 0,
      };
    }

    const wins = entradas.filter(e => e.resultado === 'G').length;
    const losses = entradas.filter(e => e.resultado === 'P').length;
    const decidedBets = wins + losses;
    const winRate = decidedBets > 0 ? (wins / decidedBets) * 100 : 0;

    const totalPnL = entradas.reduce((acc, e) => acc + e.lucro, 0);
    const totalStaked = entradas.reduce((acc, e) => acc + e.stake, 0);
    const roi = totalStaked > 0 ? (totalPnL / totalStaked) * 100 : 0;

    const avgOdd = entradas.reduce((acc, e) => acc + e.odd, 0) / entradas.length;
    const avgStake = totalStaked / entradas.length;

    const initialBankroll = (selectedBanca?.balance || 0) - totalPnL;
    const currentBankroll = selectedBanca?.balance || totalPnL;

    return {
      currentBankroll: totalPnL + (selectedBanca?.balance || 0) - totalPnL,
      totalPnL,
      roi,
      winRate,
      totalEntries: entradas.length,
      wins,
      losses,
      avgOdd,
      avgStake,
      totalStaked,
    };
  }, [entradas, selectedBanca]);

  // Generate bankroll history from entries
  const bankrollHistory = useMemo((): BankrollDataPoint[] => {
    if (entradas.length === 0) return [];

    // Sort entries by date
    const sortedEntradas = [...entradas].sort((a, b) => {
      const dateA = parseEntradaDate(a.data);
      const dateB = parseEntradaDate(b.data);
      return dateA.getTime() - dateB.getTime();
    });

    // Group by date and calculate cumulative bankroll
    const dailyData: Map<string, number> = new Map();
    
    sortedEntradas.forEach(entrada => {
      const dateKey = entrada.data.split(' ')[0]; // Get just the date part
      const current = dailyData.get(dateKey) || 0;
      dailyData.set(dateKey, current + entrada.lucro);
    });

    let cumulativeValue = 0;
    const history: BankrollDataPoint[] = [];
    
    dailyData.forEach((pnl, date) => {
      const prevValue = cumulativeValue;
      cumulativeValue += pnl;
      history.push({
        date: formatDateForChart(date),
        value: cumulativeValue,
        change: pnl,
      });
    });

    return history;
  }, [entradas]);

  // Generate daily PnL data
  const dailyPnL = useMemo((): DailyPnLDataPoint[] => {
    if (entradas.length === 0) return [];

    const sortedEntradas = [...entradas].sort((a, b) => {
      const dateA = parseEntradaDate(a.data);
      const dateB = parseEntradaDate(b.data);
      return dateA.getTime() - dateB.getTime();
    });

    const dailyData: Map<string, number> = new Map();
    
    sortedEntradas.forEach(entrada => {
      const dateKey = entrada.data.split(' ')[0];
      const current = dailyData.get(dateKey) || 0;
      dailyData.set(dateKey, current + entrada.lucro);
    });

    const result: DailyPnLDataPoint[] = [];
    dailyData.forEach((pnl, date) => {
      result.push({
        date: formatDateForChart(date),
        pnl,
      });
    });

    return result;
  }, [entradas]);

  // Generate monthly stats
  const monthlyStats = useMemo((): MonthlyStats[] => {
    if (entradas.length === 0) return [];

    const monthlyData: Map<string, Entrada[]> = new Map();
    
    entradas.forEach(entrada => {
      const date = parseEntradaDate(entrada.data);
      const monthKey = format(date, 'MMM yyyy', { locale: ptBR });
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, []);
      }
      monthlyData.get(monthKey)!.push(entrada);
    });

    let cumulativeBankroll = 0;
    const stats: MonthlyStats[] = [];

    // Sort by date and process
    const sortedMonths = Array.from(monthlyData.entries()).sort((a, b) => {
      const [, entriesA] = a;
      const [, entriesB] = b;
      const dateA = parseEntradaDate(entriesA[0].data);
      const dateB = parseEntradaDate(entriesB[0].data);
      return dateA.getTime() - dateB.getTime();
    });

    sortedMonths.forEach(([month, monthEntries]) => {
      const wins = monthEntries.filter(e => e.resultado === 'G').length;
      const losses = monthEntries.filter(e => e.resultado === 'P').length;
      const cashouts = monthEntries.filter(e => e.resultado === 'C').length;
      const returned = monthEntries.filter(e => e.resultado === 'D').length;
      
      const pnl = monthEntries.reduce((acc, e) => acc + e.lucro, 0);
      const totalStaked = monthEntries.reduce((acc, e) => acc + e.stake, 0);
      const roi = totalStaked > 0 ? (pnl / totalStaked) * 100 : 0;
      const avgOdd = monthEntries.reduce((acc, e) => acc + e.odd, 0) / monthEntries.length;
      const avgStake = totalStaked / monthEntries.length;

      cumulativeBankroll += pnl;

      stats.push({
        month: month.charAt(0).toUpperCase() + month.slice(1),
        entries: monthEntries.length,
        wins,
        losses,
        cashouts,
        returned,
        avgOdd,
        avgStake,
        totalStaked,
        pnl,
        roi,
        bankroll: cumulativeBankroll,
      });
    });

    return stats;
  }, [entradas]);

  // Recent bets (last 5)
  const recentBets = useMemo(() => {
    return [...entradas]
      .sort((a, b) => {
        const dateA = parseEntradaDate(a.data);
        const dateB = parseEntradaDate(b.data);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
  }, [entradas]);

  return {
    metrics,
    bankrollHistory,
    dailyPnL,
    monthlyStats,
    recentBets,
    hasData: entradas.length > 0,
  };
}

// Helper to parse entrada date (handles various formats)
function parseEntradaDate(dateStr: string): Date {
  // Try common formats
  const cleanDate = dateStr.split(' ')[0]; // Remove time if present
  
  // DD/MM/YYYY format
  if (cleanDate.includes('/')) {
    const parts = cleanDate.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts.map(Number);
      return new Date(year, month - 1, day);
    }
  }
  
  // YYYY-MM-DD format
  if (cleanDate.includes('-')) {
    return new Date(cleanDate);
  }
  
  return new Date(dateStr);
}

// Format date for chart display
function formatDateForChart(dateStr: string): string {
  const date = parseEntradaDate(dateStr);
  return format(date, 'dd/MM');
}

// Filter function for period selection
export function filterByPeriod<T extends { date: string }>(
  data: T[],
  period: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y'
): T[] {
  const now = new Date();
  let startDate: Date;

  switch (period) {
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
    case '6M':
      startDate = subMonths(now, 6);
      break;
    case '1Y':
      startDate = subYears(now, 1);
      break;
    default:
      startDate = subMonths(now, 3);
  }

  return data.filter((item) => {
    const [day, month] = item.date.split('/').map(Number);
    const currentYear = new Date().getFullYear();
    const itemDate = new Date(currentYear, month - 1, day);
    return isAfter(itemDate, startDate);
  });
}
