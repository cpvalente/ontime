import { useEffect } from 'react';

import { markClean, markDirty } from './appSettingsDirtyState';

export function useSettingsDirty(isDirty: boolean) {
  useEffect(() => {
    if (isDirty) {
      markDirty();
    } else {
      markClean();
    }
    return () => markClean();
  }, [isDirty]);
}
