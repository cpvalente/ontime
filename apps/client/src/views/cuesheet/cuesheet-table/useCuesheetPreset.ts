import { useEffect, useState } from 'react';
import { type Location, useLocation } from 'react-router-dom';
import { URLPreset } from 'ontime-types';

import useUrlPresets from '../../../common/hooks-query/useUrlPresets';

type CuesheetPresetOptions = {
  canRead: Set<string>;
  canWrite: Set<string>;
  hasFullAccess: boolean;
};

export function useCuesheetPreset() {
  const location = useLocation();
  const { data } = useUrlPresets();
  const [presetOptions, setPresetOptions] = useState<CuesheetPresetOptions>({
    canRead: new Set(),
    canWrite: new Set(),
    hasFullAccess: true,
  });

  function optionsFromPreset(urlPreset: URLPreset[], location: Location): URLPreset['options'] | undefined {
    for (let i = 0; i < urlPreset.length; i++) {
      if (urlPreset[i].enabled && urlPreset[i].alias === location.pathname) {
        return urlPreset[i].options;
      }
    }
    return;
  }

  useEffect(() => {
    if (!data) return;

    const maybeOptions = optionsFromPreset(data, location);
    if (!maybeOptions) return;

    setPresetOptions({
      canRead: new Set(maybeOptions.canRead),
      canWrite: new Set(maybeOptions.canWrite),
      hasFullAccess: maybeOptions.canRead.includes('*') && maybeOptions.canWrite.includes('*'),
    });
  }, [data, location]);

  return presetOptions;
}
