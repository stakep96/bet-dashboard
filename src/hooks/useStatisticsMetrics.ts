import { useMemo } from 'react';
import { useBanca, Entrada } from '@/contexts/BancaContext';
import { format, startOfMonth, endOfMonth, isWithinInterval, startOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ModalityStats {
  name: string;
  wins: number;
  total: number;
  profit: number;
}

interface MarketStats {
  name: string;
  wins: number;
  total: number;
  profit: number;
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

export function useStatisticsMetrics() {
  const { getEntradasByBanca } = useBanca();
  const entradas = getEntradasByBanca();

  // Current month summary
  const monthSummary = useMemo((): MonthSummary => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthEntries = entradas.filter(e => {
      const date = parseEntradaDate(e.dataEvento || e.data);
      return isWithinInterval(date, { start: monthStart, end: monthEnd });
    });

    const totalProfit = monthEntries.reduce((acc, e) => acc + (e.lucro || 0), 0);

    // Group by day
    const dailyPnL: Map<string, number> = new Map();
    monthEntries.forEach(e => {
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

  // Stats by modality
  const modalityStats = useMemo((): ModalityStats[] => {
    const statsMap: Map<string, { wins: number; total: number; profit: number }> = new Map();

    entradas.forEach(e => {
      // Handle combined bets with multiple modalities
      const modalities = e.modalidade?.split('|').map(m => m.trim()) || ['Outros'];
      const profitPerModality = (e.lucro || 0) / modalities.length;
      
      modalities.forEach(modality => {
        const name = modality || 'Outros';
        const current = statsMap.get(name) || { wins: 0, total: 0, profit: 0 };
        
        current.total++;
        if (e.resultado === 'G') current.wins++;
        current.profit += profitPerModality;
        
        statsMap.set(name, current);
      });
    });

    return Array.from(statsMap.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 6);
  }, [entradas]);

  // Stats by market
  const marketStats = useMemo((): MarketStats[] => {
    const statsMap: Map<string, { wins: number; total: number; profit: number }> = new Map();

    entradas.forEach(e => {
      // Handle combined bets with multiple markets
      const markets = e.mercado?.split('|').map(m => m.trim()) || ['Outros'];
      const profitPerMarket = (e.lucro || 0) / markets.length;
      
      markets.forEach(market => {
        const name = market || 'Outros';
        const current = statsMap.get(name) || { wins: 0, total: 0, profit: 0 };
        
        current.total++;
        if (e.resultado === 'G') current.wins++;
        current.profit += profitPerMarket;
        
        statsMap.set(name, current);
      });
    });

    return Array.from(statsMap.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 6);
  }, [entradas]);

  // Advanced metrics
  const advancedMetrics = useMemo((): AdvancedMetrics => {
    const wins = entradas.filter(e => e.resultado === 'G').length;
    const losses = entradas.filter(e => e.resultado === 'P').length;
    const decidedBets = wins + losses;
    
    const winRate = decidedBets > 0 ? (wins / decidedBets) * 100 : 0;
    const totalProfit = entradas.reduce((acc, e) => acc + (e.lucro || 0), 0);
    const avgProfitPerEntry = entradas.length > 0 ? totalProfit / entradas.length : 0;
    const winLossRatio = losses > 0 ? wins / losses : wins;

    return {
      winRate,
      avgProfitPerEntry,
      winLossRatio,
      totalEntries: entradas.length,
      longestWinStreak: streaks.longestWinStreak,
      longestLossStreak: streaks.longestLossStreak,
      avgOddWins,
    };
  }, [entradas, streaks, avgOddWins]);

  return {
    monthSummary,
    modalityStats,
    marketStats,
    advancedMetrics,
    hasData: entradas.length > 0,
  };
}
