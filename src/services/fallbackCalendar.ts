import type { CalendarOverlay } from '../domain/types';

const FALLBACK_BY_YEAR: Record<number, CalendarOverlay[]> = {
  2026: [
    {
      date: '2026-09-20',
      status: 'makeup',
      label: '调休上班',
      source: 'local-fallback',
    },
    {
      date: '2026-09-25',
      status: 'holiday',
      label: '中秋节',
      source: 'local-fallback',
    },
  ],
};

export function getFallbackOverlays(year: number): CalendarOverlay[] {
  return (FALLBACK_BY_YEAR[year] ?? []).map((overlay) => ({ ...overlay }));
}
