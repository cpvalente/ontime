import { use, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { getTimezoneFromParams } from '../components/view-params-editor/common.options';
import { PresetContext } from '../context/PresetContext';
import usePlanTimezone from '../hooks-query/usePlanTimezone';
import { type DisplayTimezone, getTimezoneDelta } from '../utils/time';

export type DisplayTimezoneData = {
  /** shift to apply to plan wall-clock times, 0 when showing plan time */
  timezoneDelta: number;
  /** name of the timezone being shown */
  displayZone: string;
};

/**
 * Resolves which timezone a view shows wall-clock times in
 * Precedence: element override -> view URL param (preset first) -> plan timezone
 * @param elementTimezone - timezone pinned by an individual element
 */
export function useDisplayTimezone(elementTimezone?: DisplayTimezone): DisplayTimezoneData {
  const [searchParams] = useSearchParams();
  const maybePreset = use(PresetContext);
  const planTimezone = usePlanTimezone();

  return useMemo(() => {
    const defaultValues = maybePreset ? new URLSearchParams(maybePreset.search) : undefined;
    const display = elementTimezone ?? getTimezoneFromParams(searchParams, defaultValues);

    if (!planTimezone) {
      return { timezoneDelta: 0, displayZone: '' };
    }

    return {
      timezoneDelta: getTimezoneDelta(display, planTimezone),
      displayZone: resolveZoneName(display, planTimezone.zone),
    };
  }, [elementTimezone, maybePreset, planTimezone, searchParams]);
}

function resolveZoneName(display: DisplayTimezone, planZone: string): string {
  if (display === 'plan') return planZone;
  if (display === 'local') return Intl.DateTimeFormat().resolvedOptions().timeZone;
  return display;
}
