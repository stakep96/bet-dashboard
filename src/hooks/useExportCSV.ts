import { Entrada } from '@/contexts/BancaContext';
import { FilterState } from '@/components/filters/EntradasFilter';

interface ExportOptions {
  bancaId?: string;
  bancaName?: string;
  filters?: Partial<FilterState>;
}

export function useExportCSV() {
  const exportToCSV = (entradas: Entrada[], options?: ExportOptions) => {
    let filtered = [...entradas];

    // Apply filters if provided
    if (options?.filters) {
      const { dateFrom, dateTo, resultado, modalidade } = options.filters;

      if (dateFrom) {
        filtered = filtered.filter(e => new Date(e.data) >= dateFrom);
      }
      if (dateTo) {
        filtered = filtered.filter(e => new Date(e.data) <= dateTo);
      }
      if (resultado) {
        filtered = filtered.filter(e => e.resultado === resultado);
      }
      if (modalidade) {
        filtered = filtered.filter(e => e.modalidade === modalidade);
      }
    }

    // Filter by banca if specified
    if (options?.bancaId) {
      filtered = filtered.filter(e => e.bancaId === options.bancaId);
    }

    if (filtered.length === 0) {
      return { success: false, message: 'Nenhuma entrada para exportar.' };
    }

    // Create CSV content
    const headers = [
      'Data',
      'Modalidade',
      'Data do Evento',
      'Evento',
      'Mercado',
      'Entrada',
      'Odd',
      'Stake',
      'Resultado',
      'Lucro/Prejuízo',
      'Timing',
      'Site'
    ];

    const resultadoMap: Record<string, string> = {
      'G': 'Ganha',
      'P': 'Perdida',
      'GM': 'Ganhou Metade',
      'PM': 'Perdeu Metade',
      'C': 'Cashout',
      'D': 'Devolvida',
      'Pendente': 'Pendente'
    };

    const rows = filtered.map(e => [
      e.data,
      e.modalidade,
      e.dataEvento,
      `"${e.evento.replace(/"/g, '""')}"`,
      `"${e.mercado.replace(/"/g, '""')}"`,
      `"${(e.entrada || '').replace(/"/g, '""')}"`,
      e.odd.toFixed(2),
      e.stake.toFixed(2),
      resultadoMap[e.resultado] || e.resultado,
      e.lucro.toFixed(2),
      e.timing,
      e.site
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const dateStr = new Date().toISOString().split('T')[0];
    const bancaSuffix = options?.bancaName ? `_${options.bancaName.replace(/\s+/g, '_')}` : '';
    link.download = `entradas${bancaSuffix}_${dateStr}.csv`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, message: `${filtered.length} entradas exportadas com sucesso!` };
  };

  return { exportToCSV };
}
