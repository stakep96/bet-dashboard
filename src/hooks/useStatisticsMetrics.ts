import { useMemo } from 'react';
import { useBanca, Entrada } from '@/contexts/BancaContext';
import { format, startOfMonth, endOfMonth, isWithinInterval, startOfYear, endOfYear, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ModalityStats {
  name: string;
  wins: number;
  losses: number;
  total: number;
  profit: number;
  volume: number;
  winRate: number;
  roi: number;
}

interface MarketStats {
  name: string;
  wins: number;
  losses: number;
  total: number;
  profit: number;
  volume: number;
  winRate: number;
  roi: number;
}

interface MonthSummary {
  totalProfit: number;
  daysWithBets: number;
  positiveDays: number;
  negativeDays: number;
}

interface AdvancedMetrics {
  winRate: number;
  avgProfitPerEntry: number;
  winLossRatio: number;
  totalEntries: number;
  longestWinStreak: number;
  longestLossStreak: number;
  avgOddWins: number;
  totalVolume: number;
  totalProfit: number;
  totalLoss: number;
  roi: number;
  avgStake: number;
  wins: number;
  losses: number;
  pending: number;
}

interface TopLosers {
  worstModality: ModalityStats | null;
  worstMarket: MarketStats | null;
}

interface TopWinners {
  bestModality: ModalityStats | null;
  bestMarket: MarketStats | null;
}

function parseEntradaDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  
  const cleanDate = dateStr.split(' ')[0];
  
  if (cleanDate.includes('/')) {
    const parts = cleanDate.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts.map(Number);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month - 1, day);
      }
    }
  }
  
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

export function useStatisticsMetrics(selectedMonth: Date | null = new Date()) {
  const { getEntradasByBanca } = useBanca();
  const allEntradas = getEntradasByBanca();

  // Filter entries by selected month (null = all year)
  const entradas = useMemo(() => {
    // If null, show all entries for current year
    if (selectedMonth === null) {
      const currentYear = getYear(new Date());
      const yearStart = startOfYear(new Date(currentYear, 0, 1));
      const yearEnd = endOfYear(new Date(currentYear, 0, 1));
      
      return allEntradas.filter(e => {
        const date = parseEntradaDate(e.dataEvento || e.data);
        return isWithinInterval(date, { start: yearStart, end: yearEnd });
      });
    }
    
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    return allEntradas.filter(e => {
      const date = parseEntradaDate(e.dataEvento || e.data);
      return isWithinInterval(date, { start: monthStart, end: monthEnd });
    });
  }, [allEntradas, selectedMonth]);

  // Current month summary
  const monthSummary = useMemo((): MonthSummary => {
    const totalProfit = entradas.reduce((acc, e) => acc + (e.lucro || 0), 0);

    // Group by day
    const dailyPnL: Map<string, number> = new Map();
    entradas.forEach(e => {
      const dateStr = e.dataEvento || e.data;
      const dateKey = dateStr.split(' ')[0];
      const current = dailyPnL.get(dateKey) || 0;
      dailyPnL.set(dateKey, current + (e.lucro || 0));
    });

    const daysWithBets = dailyPnL.size;
    let positiveDays = 0;
    let negativeDays = 0;

    dailyPnL.forEach(pnl => {
      if (pnl > 0) positiveDays++;
      else if (pnl < 0) negativeDays++;
    });

    return {
      totalProfit,
      daysWithBets,
      positiveDays,
      negativeDays,
    };
  }, [entradas]);

  // Streaks calculation
  const streaks = useMemo(() => {
    const sortedEntradas = [...entradas]
      .filter(e => e.resultado === 'G' || e.resultado === 'P')
      .sort((a, b) => {
        const dateA = parseEntradaDate(a.dataEvento || a.data);
        const dateB = parseEntradaDate(b.dataEvento || b.data);
        return dateA.getTime() - dateB.getTime();
      });

    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;

    sortedEntradas.forEach(e => {
      if (e.resultado === 'G') {
        currentWinStreak++;
        currentLossStreak = 0;
        longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
      } else if (e.resultado === 'P') {
        currentLossStreak++;
        currentWinStreak = 0;
        longestLossStreak = Math.max(longestLossStreak, currentLossStreak);
      }
    });

    return { longestWinStreak, longestLossStreak };
  }, [entradas]);

  // Average odd on wins
  const avgOddWins = useMemo(() => {
    const wins = entradas.filter(e => e.resultado === 'G');
    if (wins.length === 0) return 0;
    return wins.reduce((acc, e) => acc + (e.odd || 0), 0) / wins.length;
  }, [entradas]);

  // Stats by modality (ALL, sorted by profit)
  const modalityStats = useMemo((): ModalityStats[] => {
    const statsMap: Map<string, { wins: number; losses: number; total: number; profit: number; volume: number }> = new Map();

    entradas.forEach(e => {
      const modalities = e.modalidade?.split('|').map(m => m.trim()) || ['Outros'];
      const profitPerModality = (e.lucro || 0) / modalities.length;
      const stakePerModality = (e.stake || 0) / modalities.length;
      
      modalities.forEach(modality => {
        const name = modality || 'Outros';
        const current = statsMap.get(name) || { wins: 0, losses: 0, total: 0, profit: 0, volume: 0 };
        
        current.total++;
        current.volume += stakePerModality;
        if (e.resultado === 'G') current.wins++;
        else if (e.resultado === 'P') current.losses++;
        current.profit += profitPerModality;
        
        statsMap.set(name, current);
      });
    });

    return Array.from(statsMap.entries())
      .map(([name, stats]) => ({ 
        name, 
        ...stats,
        winRate: (stats.wins + stats.losses) > 0 ? (stats.wins / (stats.wins + stats.losses)) * 100 : 0,
        roi: stats.volume > 0 ? (stats.profit / stats.volume) * 100 : 0
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [entradas]);

  // Stats by market (ALL, sorted by profit)
  const marketStats = useMemo((): MarketStats[] => {
    const statsMap: Map<string, { wins: number; losses: number; total: number; profit: number; volume: number }> = new Map();

    entradas.forEach(e => {
      const markets = e.mercado?.split('|').map(m => m.trim()) || ['Outros'];
      const profitPerMarket = (e.lucro || 0) / markets.length;
      const stakePerMarket = (e.stake || 0) / markets.length;
      
      markets.forEach(market => {
        const name = market || 'Outros';
        const current = statsMap.get(name) || { wins: 0, losses: 0, total: 0, profit: 0, volume: 0 };
        
        current.total++;
        current.volume += stakePerMarket;
        if (e.resultado === 'G') current.wins++;
        else if (e.resultado === 'P') current.losses++;
        current.profit += profitPerMarket;
        
        statsMap.set(name, current);
      });
    });

    return Array.from(statsMap.entries())
      .map(([name, stats]) => ({ 
        name, 
        ...stats,
        winRate: (stats.wins + stats.losses) > 0 ? (stats.wins / (stats.wins + stats.losses)) * 100 : 0,
        roi: stats.volume > 0 ? (stats.profit / stats.volume) * 100 : 0
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [entradas]);

  // Top winners (best performing)
  const topWinners = useMemo((): TopWinners => {
    const bestModality = [...modalityStats].sort((a, b) => b.profit - a.profit)[0] || null;
    const bestMarket = [...marketStats].sort((a, b) => b.profit - a.profit)[0] || null;
    
    return { bestModality, bestMarket };
  }, [modalityStats, marketStats]);

  // Top losers (worst performing)
  const topLosers = useMemo((): TopLosers => {
    const worstModality = [...modalityStats].sort((a, b) => a.profit - b.profit)[0] || null;
    const worstMarket = [...marketStats].sort((a, b) => a.profit - b.profit)[0] || null;
    
    return { worstModality, worstMarket };
  }, [modalityStats, marketStats]);

  // Advanced metrics
  const advancedMetrics = useMemo((): AdvancedMetrics => {
    const wins = entradas.filter(e => e.resultado === 'G').length;
    const losses = entradas.filter(e => e.resultado === 'P').length;
    const pending = entradas.filter(e => e.resultado === 'Pendente').length;
    const decidedBets = wins + losses;
    
    const winRate = decidedBets > 0 ? (wins / decidedBets) * 100 : 0;
    const totalProfit = entradas.filter(e => e.lucro > 0).reduce((acc, e) => acc + (e.lucro || 0), 0);
    const totalLoss = Math.abs(entradas.filter(e => e.lucro < 0).reduce((acc, e) => acc + (e.lucro || 0), 0));
    const netProfit = entradas.reduce((acc, e) => acc + (e.lucro || 0), 0);
    const avgProfitPerEntry = entradas.length > 0 ? netProfit / entradas.length : 0;
    const winLossRatio = losses > 0 ? wins / losses : wins;
    const totalVolume = entradas.reduce((acc, e) => acc + (e.stake || 0), 0);
    const avgStake = entradas.length > 0 ? totalVolume / entradas.length : 0;
    const roi = totalVolume > 0 ? (netProfit / totalVolume) * 100 : 0;

    return {
      winRate,
      avgProfitPerEntry,
      winLossRatio,
      totalEntries: entradas.length,
      longestWinStreak: streaks.longestWinStreak,
      longestLossStreak: streaks.longestLossStreak,
      avgOddWins,
      totalVolume,
      totalProfit,
      totalLoss,
      roi,
      avgStake,
      wins,
      losses,
      pending,
    };
  }, [entradas, streaks, avgOddWins]);

  return {
    monthSummary,
    modalityStats,
    marketStats,
    advancedMetrics,
    topWinners,
    topLosers,
    hasData: entradas.length > 0,
  };
}
