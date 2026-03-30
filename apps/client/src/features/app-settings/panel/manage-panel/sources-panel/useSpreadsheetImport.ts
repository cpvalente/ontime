import { useQueryClient } from '@tanstack/react-query';
import { CustomFields, ProjectRundowns } from 'ontime-types';
import { useCallback } from 'react';

import { CUSTOM_FIELDS, RUNDOWN } from '../../../../../common/api/constants';
import { patchData } from '../../../../../common/api/db';

export default function useSpreadsheetImport() {
  const queryClient = useQueryClient();

  /** applies rundown and customFields to current project */
  const importRundown = useCallback(
    async (rundowns: ProjectRundowns, customFields: CustomFields) => {
      await patchData({ rundowns, customFields });
      // we are unable to optimistically set the rundown since we need
      // it to be normalised
      await queryClient.invalidateQueries({
        queryKey: RUNDOWN,
      });
      await queryClient.invalidateQueries({
        queryKey: CUSTOM_FIELDS,
      });
    },
    [queryClient],
  );

  return {
    importRundown,
  };
}
