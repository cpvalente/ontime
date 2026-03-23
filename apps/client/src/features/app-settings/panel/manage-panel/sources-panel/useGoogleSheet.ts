import { useQueryClient } from '@tanstack/react-query';
import { AuthenticationStatus, CustomFields, ProjectRundowns, ProjectRundownsList } from 'ontime-types';
import { ImportMap } from 'ontime-utils';

import {
  CURRENT_RUNDOWN_QUERY_KEY,
  CUSTOM_FIELDS,
  PROJECT_RUNDOWNS,
  getRundownQueryKey,
} from '../../../../../common/api/constants';
import { patchData } from '../../../../../common/api/db';
import { requestConnection, revokeAuthentication, verifyAuthenticationStatus } from '../../../../../common/api/sheets';
import { maybeAxiosError } from '../../../../../common/api/utils';
import { useSheetStore } from './useSheetStore';

export default function useGoogleSheet() {
  const queryClient = useQueryClient();
  const patchStepData = useSheetStore((state) => state.patchStepData);

  /** whether the current session has been authenticated */
  const verifyAuth = async (): Promise<{ authenticated: AuthenticationStatus; sheetId: string } | void> => {
    try {
      return await verifyAuthenticationStatus();
    } catch (error) {
      patchStepData({ authenticate: { available: false, error: maybeAxiosError(error) } });
    }
  };

  /** requests connection to a google sheet */
  const connect = async (
    file: File,
    sheetId: string,
  ): Promise<{ verification_url: string; user_code: string } | void> => {
    try {
      return await requestConnection(file, sheetId);
    } catch (error) {
      patchStepData({ authenticate: { available: false, error: maybeAxiosError(error) } });
    }
  };

  /** requests the revoking of an existing authenticated session */
  const revoke = async (): Promise<{ authenticated: AuthenticationStatus } | void> => {
    try {
      return await revokeAuthentication();
    } catch (error) {
      patchStepData({ authenticate: { available: false, error: maybeAxiosError(error) } });
    }
  };

  /** applies rundown and customFields to current project */
  const importRundown = async (rundowns: ProjectRundowns, customFields: CustomFields) => {
    try {
      await patchData({ rundowns, customFields });
      // we are unable to optimistically set the rundown since we need
      // it to be normalised
      const loadedRundownId = queryClient.getQueryData<ProjectRundownsList>(PROJECT_RUNDOWNS)?.loaded;
      const rundownQueryKey = loadedRundownId ? getRundownQueryKey(loadedRundownId) : CURRENT_RUNDOWN_QUERY_KEY;
      await queryClient.invalidateQueries({ queryKey: rundownQueryKey });
      await queryClient.invalidateQueries({ queryKey: CUSTOM_FIELDS });
    } catch (error) {
      patchStepData({ pullPush: { available: true, error: maybeAxiosError(error) } });
      throw error;
    }
  };

  return {
    connect,
    revoke,
    verifyAuth,
    importRundown,
  };
}
