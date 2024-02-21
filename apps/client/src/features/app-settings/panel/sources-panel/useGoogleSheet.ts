import { useQueryClient } from '@tanstack/react-query';
import { AuthenticationStatus, OntimeRundown, UserFields } from 'ontime-types';
import { ExcelImportMap } from 'ontime-utils';

import { RUNDOWN, USERFIELDS } from '../../../../common/api/apiConstants';
import { maybeAxiosError } from '../../../../common/api/apiUtils';
import {
  patchData,
  previewRundown,
  requestConnection,
  revokeAuthentication,
  uploadRundown,
  verifyAuthenticationStatus,
} from '../../../../common/api/ontimeApi';

import { useSheetStore } from './useSheetStore';

export default function useGoogleSheet() {
  const queryClient = useQueryClient();
  // functions push data to store
  const patchStepData = useSheetStore((state) => state.patchStepData);
  const setRundown = useSheetStore((state) => state.setRundown);
  const setUserFields = useSheetStore((state) => state.setUserFields);

  /** whether the current session has been authenticated */
  const verifyAuth = async (): Promise<{ authenticated: AuthenticationStatus } | void> => {
    try {
      return verifyAuthenticationStatus();
    } catch (_error) {
      /** we do not handle errors here */
    }
  };

  /** requests connection to a google sheet */
  const connect = async (
    file: File,
    sheetId: string,
  ): Promise<{ verification_url: string; user_code: string } | void> => {
    try {
      return requestConnection(file, sheetId);
    } catch (_error) {
      /** we do not handle errors here */
    }
  };

  const revoke = async (): Promise<{ authenticated: AuthenticationStatus } | void> => {
    try {
      return revokeAuthentication();
    } catch (_error) {
      /** we do not handle errors here */
    }
  };

  /** fetches data from a worksheet by its ID */
  const importRundownPreview = async (sheetId: string, fileOptions: ExcelImportMap) => {
    try {
      const data = await previewRundown(sheetId, fileOptions);
      setRundown(data.rundown);
      setUserFields(data.userFields);
    } catch (error) {
      patchStepData({ pullPush: { available: true, error: maybeAxiosError(error) } });
    }
  };

  /** writes data to a worksheet by its ID */
  const exportRundown = async (sheetId: string, fileOptions: ExcelImportMap) => {
    try {
      // write data to google
      await uploadRundown(sheetId, fileOptions);
      patchStepData({ pullPush: { available: false, error: '' } });
    } catch (error) {
      patchStepData({ pullPush: { available: true, error: maybeAxiosError(error) } });
    }
  };

  /** applies rundown and userfields to current project */
  const importRundown = async (rundown: OntimeRundown, userFields: UserFields) => {
    try {
      await patchData({ rundown, userFields });
      queryClient.setQueryData(RUNDOWN, rundown);
      queryClient.setQueryData(USERFIELDS, userFields);
      await queryClient.invalidateQueries({
        queryKey: [...RUNDOWN, ...USERFIELDS],
      });
    } catch (error) {
      patchStepData({ pullPush: { available: true, error: maybeAxiosError(error) } });
    }
  };

  return {
    connect,
    revoke,
    verifyAuth,

    importRundownPreview,
    importRundown,
    exportRundown,
  };
}
