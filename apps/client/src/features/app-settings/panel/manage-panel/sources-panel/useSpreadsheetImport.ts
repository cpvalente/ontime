import { RundownImportPayload } from 'ontime-types';
import { useCallback } from 'react';

import { importRundownWithOptions } from '../../../../../common/api/rundown';

export default function useSpreadsheetImport() {
  /** applies a spreadsheet import: override or merge into the current rundown, or create a new one */
  const applyImport = useCallback(async (payload: RundownImportPayload) => {
    // the backend broadcasts a refetch once the rundown is parsed and applied, so the caches update
    // through that single path rather than racing it with an optimistic write from here
    await importRundownWithOptions(payload);
  }, []);

  return {
    applyImport,
  };
}
