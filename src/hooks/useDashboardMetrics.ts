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
  const { getEntradasByBanca, getTotalInitialBalance, getTotalBalance, isVisaoGeral } = useBanca();
  const entradas = getEntradasByBanca();

  const metrics = useMemo((): DashboardMetrics => {
    const initialBalance = getTotalInitialBalance();
    const currentBalance = getTotalBalance();

    // Quando há entradas, o saldo atual deve refletir o valor inicial + lucro/prejuízo acumulado.
    // Quando não há entradas, usamos o saldo salvo na banca (útil para bancas recém-criadas/ajustadas manualmente).
    const pnlFromEntradas = entradas.reduce((acc, e) => acc + (e.lucro || 0), 0);
    const totalPnL = entradas.length > 0 ? pnlFromEntradas : currentBalance - initialBalance;
    const currentBankroll = entradas.length > 0 ? initialBalance + pnlFromEntradas : currentBalance;

    const wins = entradas.filter(e => e.resultado === 'G').length;
    const losses = entradas.filter(e => e.resultado === 'P').length;
    const decidedBets = wins + losses;
    const winRate = decidedBets > 0 ? (wins / decidedBets) * 100 : 0;

    const totalStaked = entradas.reduce((acc, e) => acc + e.stake, 0);

    // ROI baseado no valor inicial da banca
    const roi = initialBalance > 0 ? (totalPnL / initialBalance) * 100 : 0;

    const avgOdd = entradas.length > 0
      ? entradas.reduce((acc, e) => acc + e.odd, 0) / entradas.length
      : 0;

    const avgStake = entradas.length > 0 ? totalStaked / entradas.length : 0;

    return {
      currentBankroll,
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
  }, [entradas, getTotalInitialBalance, getTotalBalance]);

  // Generate bankroll history from entries, starting from initialBalance
  // Uses eventDate for statistics instead of registration date
  const bankrollHistory = useMemo((): BankrollDataPoint[] => {
    const initialBalance = getTotalInitialBalance();
    
    if (entradas.length === 0) return [];

    // Sort entries by event date (fall back to registration date if not available)
    const sortedEntradas = [...entradas].sort((a, b) => {
      const dateA = parseEntradaDate(a.dataEvento || a.data);
      const dateB = parseEntradaDate(b.dataEvento || b.data);
      return dateA.getTime() - dateB.getTime();
    });

    // Group by event date and calculate cumulative bankroll
    const dailyData: Map<string, number> = new Map();
    
    sortedEntradas.forEach(entrada => {
      const dateStr = entrada.dataEvento || entrada.data;
      const dateKey = dateStr.split(' ')[0]; // Get just the date part
      const current = dailyData.get(dateKey) || 0;
      dailyData.set(dateKey, current + entrada.lucro);
    });

    // Start from initial balance
    let cumulativeValue = initialBalance;
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
  }, [entradas, getTotalInitialBalance]);

  // Generate daily PnL data using event date
  const dailyPnL = useMemo((): DailyPnLDataPoint[] => {
    if (entradas.length === 0) return [];

    const sortedEntradas = [...entradas].sort((a, b) => {
      const dateA = parseEntradaDate(a.dataEvento || a.data);
      const dateB = parseEntradaDate(b.dataEvento || b.data);
      return dateA.getTime() - dateB.getTime();
    });

    const dailyData: Map<string, number> = new Map();
    
    sortedEntradas.forEach(entrada => {
      const dateStr = entrada.dataEvento || entrada.data;
      const dateKey = dateStr.split(' ')[0];
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

  // Generate monthly stats using event date
  const monthlyStats = useMemo((): MonthlyStats[] => {
    if (entradas.length === 0) return [];

    const initialBalance = getTotalInitialBalance();
    const monthlyData: Map<string, Entrada[]> = new Map();
    
    entradas.forEach(entrada => {
      const dateStr = entrada.dataEvento || entrada.data;
      const date = parseEntradaDate(dateStr);
      const monthKey = format(date, 'MMM yyyy', { locale: ptBR });
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, []);
      }
      monthlyData.get(monthKey)!.push(entrada);
    });

    let cumulativeBankroll = initialBalance;
    const stats: MonthlyStats[] = [];

    // Sort by date and process
    const sortedMonths = Array.from(monthlyData.entries()).sort((a, b) => {
      const [, entriesA] = a;
      const [, entriesB] = b;
      const dateA = parseEntradaDate(entriesA[0].dataEvento || entriesA[0].data);
      const dateB = parseEntradaDate(entriesB[0].dataEvento || entriesB[0].data);
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

  // Recent bets (last 5) sorted by event date
  const recentBets = useMemo(() => {
    return [...entradas]
      .sort((a, b) => {
        const dateA = parseEntradaDate(a.dataEvento || a.data);
        const dateB = parseEntradaDate(b.dataEvento || b.data);
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
// IMPORTANT: Parse dates as local time to avoid timezone issues
function parseEntradaDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  
  // Try common formats
  const cleanDate = dateStr.split(' ')[0]; // Remove time if present
  
  // DD/MM/YYYY format
  if (cleanDate.includes('/')) {
    const parts = cleanDate.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts.map(Number);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month - 1, day);
      }
    }
  }
  
  // YYYY-MM-DD format - parse as local time, not UTC
  if (cleanDate.includes('-')) {
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts.map(Number);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month - 1, day);
      }
    }
  }
  
  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? new Date() : fallback;
}

// Format date for chart display
function formatDateForChart(dateStr: string): string {
  const date = parseEntradaDate(dateStr);
  if (isNaN(date.getTime())) {
    return 'N/A';
  }
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
