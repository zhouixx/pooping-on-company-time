import { useEffect, useState } from 'react';
import { fetchCalendarOverlays } from '../services/calendarApi';
import type { CalendarOverlay } from '../domain/types';

type CalendarLoadState = {
  overlays: CalendarOverlay[];
  source: 'loading' | 'api' | 'fallback';
  error?: string;
};

export function useCalendar(year: number): CalendarLoadState {
  const [state, setState] = useState<CalendarLoadState>({ overlays: [], source: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ overlays: [], source: 'loading' });

    void fetchCalendarOverlays(year).then((result) => {
      if (active) {
        setState(result);
      }
    });

    return () => {
      active = false;
    };
  }, [year]);

  return state;
}
