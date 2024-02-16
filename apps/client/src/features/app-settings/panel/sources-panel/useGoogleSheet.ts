import { ChangeEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { OntimeRundown, UserFields } from 'ontime-types';
import { ExcelImportMap } from 'ontime-utils';

import { RUNDOWN, USERFIELDS } from '../../../../common/api/apiConstants';
import { maybeAxiosError } from '../../../../common/api/apiUtils';
import {
  getAuthentication,
  getSheetsAuthUrl,
  patchData,
  postId,
  postPreviewSheet,
  postPushSheet,
  postWorksheet,
  uploadSheetClientFile,
} from '../../../../common/api/ontimeApi';
import { openLink } from '../../../../common/utils/linkUtils';

import { useSheetStore } from './useSheetStore';

// TODO: recover useEffect for resuming previous state
export default function useGoogleSheet() {
  const queryClient = useQueryClient();

  // functions push data to store
  const setClientSecret = useSheetStore((state) => state.setClientSecret);
  const patchStepData = useSheetStore((state) => state.patchStepData);
  const setSheetId = useSheetStore((state) => state.setSheetId);
  const setWorksheetOptions = useSheetStore((state) => state.setWorksheetOptions);
  const setRundown = useSheetStore((state) => state.setRundown);
  const setUserFields = useSheetStore((state) => state.setUserFields);

  /** receives a client secrets file and passes on to the server */
  const handleClientSecret = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) {
      patchStepData({
        clientSecret: { available: true, error: 'Missing file' },
        authenticate: { available: false, error: '' },
      });
      return;
    }

    try {
      const selectedFile = event.target.files[0];
      await uploadSheetClientFile(selectedFile);
      setClientSecret(selectedFile);
      patchStepData({
        clientSecret: { available: true, error: '' },
        authenticate: { available: true, error: '' },
      });
    } catch (error) {
      patchStepData({
        clientSecret: { available: true, error: maybeAxiosError(error) },
        authenticate: { available: false, error: '' },
      });
    }
  };

  /** authenticate with the Google Sheets API */
  const handleAuthenticate = async () => {
    try {
      const authLink = await getSheetsAuthUrl();

      // request windown to open link and check auth when user is back
      openLink(authLink);
      window.addEventListener('focus', async () => await getAuthentication(), { once: true });

      patchStepData({
        authenticate: { available: false, error: '' },
        sheetId: { available: true, error: '' },
      });
    } catch (error) {
      patchStepData({
        authenticate: { available: true, error: maybeAxiosError(error) },
        sheetId: { available: false, error: '' },
      });
    }
  };

  /** fetches data from a Google Sheet by its ID */
  const handleConnect = async (sheetId: string) => {
    try {
      setSheetId(sheetId);
      const data = await postId(sheetId);
      setWorksheetOptions(data.worksheetOptions);
      patchStepData({ worksheet: { available: true, error: '' } });
    } catch (error) {
      patchStepData({
        sheetId: { available: true, error: maybeAxiosError(error) },
        worksheet: { available: false, error: '' },
        pullPush: { available: false, error: '' },
      });
      setWorksheetOptions([]);
    }
  };

  /** fetches data from a worksheet by its ID */
  const handleImportPreview = async (sheetId: string, worksheet: string, fileOptions: ExcelImportMap) => {
    try {
      // update worksheet data in the server
      await postWorksheet(sheetId, worksheet);

      // get data from google
      const data = await postPreviewSheet(sheetId, fileOptions);
      setRundown(data.rundown);
      setUserFields(data.userFields);
    } catch (error) {
      patchStepData({ pullPush: { available: true, error: maybeAxiosError(error) } });
    }
  };

  /** writes data to a worksheet by its ID */
  const handleExport = async (sheetId: string, worksheet: string, fileOptions: ExcelImportMap) => {
    try {
      // update worksheet data in the server
      await postWorksheet(sheetId, worksheet);

      // write data to google
      await postPushSheet(sheetId, fileOptions);
      patchStepData({ pullPush: { available: false, error: '' } });
    } catch (error) {
      patchStepData({ pullPush: { available: true, error: maybeAxiosError(error) } });
    }
  };

  /** applies rundown and userfields to current project */
  const handleImport = async (rundown: OntimeRundown, userFields: UserFields) => {
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
    handleClientSecret,
    handleAuthenticate,
    handleConnect,
    handleImportPreview,
    handleImport,
    handleExport,
  };
}
