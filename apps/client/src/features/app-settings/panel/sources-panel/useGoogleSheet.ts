import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { OntimeRundown, UserFields } from 'ontime-types';
import { defaultExcelImportMap, ExcelImportMap } from 'ontime-utils';

import { RUNDOWN, USERFIELDS } from '../../../../common/api/apiConstants';
import { maybeAxiosError } from '../../../../common/api/apiUtils';
import {
  getAuthentication,
  getClientSecret,
  getSheetsAuthUrl,
  patchData,
  postId,
  postPreviewSheet,
  postPushSheet,
  postWorksheet,
  uploadSheetClientFile,
} from '../../../../common/api/ontimeApi';
import { openLink } from '../../../../common/utils/linkUtils';

export default function useGoogleSheet() {
  const queryClient = useQueryClient();

  const [rundown, setRundown] = useState<OntimeRundown | null>(null);
  const [userFields, setUserFields] = useState<UserFields | null>(null);

  const [id, setSheetId] = useState('');
  const [worksheet, setWorksheet] = useState('');
  const [worksheetOptions, setWorksheetOptions] = useState<string[]>([]);

  // TODO: can we improve the logic around direction?
  const [direction, setDirection] = useState('none');
  const excelFileOptions = useRef<ExcelImportMap>(defaultExcelImportMap);

  const [stepData, setStepData] = useState({
    clientSecret: { complete: false, message: '' },
    authenticate: { complete: false, message: '' },
    id: { complete: false, message: '' },
    worksheet: { complete: false, message: '' },
    pullPush: { complete: false, message: '' },
  });

  // verify authentication state
  useEffect(() => {
    setDirection('none');
    testClientSecret();
    if (stepData.clientSecret.complete) testAuthentication();
    if (stepData.authenticate.complete) testSheetId();

    return () => {};
  }, []);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) {
      setStepData({
        clientSecret: { complete: false, message: 'Missing file' },
        authenticate: { complete: false, message: '' },
        id: { complete: false, message: '' },
        worksheet: { complete: false, message: '' },
        pullPush: { complete: false, message: '' },
      });
      return;
    }

    const selectedFile = event.target.files[0];

    try {
      await uploadSheetClientFile(selectedFile);
      setStepData((prev) => ({ ...prev, clientSecret: { complete: true, message: '' } }));
    } catch (error) {
      const message = maybeAxiosError(error);
      setStepData((prev) => ({
        ...prev,
        clientSecret: { complete: false, message },
        authenticate: { complete: false, message: '' },
        id: { complete: false, message: '' },
        worksheet: { complete: false, message: '' },
        pullPush: { complete: false, message: '' },
      }));
    }
  };

  const testClientSecret = async () => {
    try {
      await getClientSecret();
      setStepData((prev) => ({ ...prev, clientSecret: { complete: true, message: '' } }));
    } catch (error) {
      const message = maybeAxiosError(error);
      setStepData({
        clientSecret: { complete: false, message },
        authenticate: { complete: false, message: '' },
        id: { complete: false, message: '' },
        worksheet: { complete: false, message: '' },
        pullPush: { complete: false, message: '' },
      });
    }
  };

  //STEP-2 Authenticate
  const handleAuthenticate = async () => {
    try {
      const authLink = await getSheetsAuthUrl();
      openLink(authLink);
      window.addEventListener('focus', () => testAuthentication(), { once: true });
    } catch (error) {
      const message = maybeAxiosError(error);
      setStepData((prev) => ({
        ...prev,
        authenticate: { complete: false, message },
        id: { complete: false, message: '' },
        worksheet: { complete: false, message: '' },
        pullPush: { complete: false, message: '' },
      }));
    }
  };

  const testAuthentication = async () => {
    try {
      await getAuthentication();
      setStepData((prev) => ({ ...prev, authenticate: { complete: true, message: '' } }));
    } catch (error) {
      const message = maybeAxiosError(error);
      setStepData((prev) => ({
        ...prev,
        authenticate: { complete: false, message },
        id: { complete: false, message: '' },
        worksheet: { complete: false, message: '' },
        pullPush: { complete: false, message: '' },
      }));
    }
  };

  //STEP-3 set sheet ID
  const testSheetId = async () => {
    try {
      const data = await postId(id);
      setStepData((prev) => ({ ...prev, id: { complete: true, message: '' } }));
      setWorksheetOptions(data.worksheetOptions);
    } catch (error) {
      const message = maybeAxiosError(error);
      setStepData((prev) => ({
        ...prev,
        id: { complete: false, message },
        worksheet: { complete: false, message: '' },
        pullPush: { complete: false, message: '' },
      }));
      setWorksheetOptions([]);
    }
  };

  //STEP-4 Select Worksheet
  const testWorksheet = async (value: string) => {
    excelFileOptions.current.worksheet = value;
    setWorksheet(value);
    try {
      await postWorksheet(id, worksheet);
      setStepData((prev) => ({ ...prev, worksheet: { complete: true, message: '' } }));
    } catch (error) {
      const message = maybeAxiosError(error);
      setStepData({ ...stepData, worksheet: { complete: false, message }, pullPush: { complete: false, message: '' } });
    }
  };

  //STEP-5 Upload / Download
  const updateExcelFileOptions = <T extends keyof ExcelImportMap>(field: T, value: ExcelImportMap[T]) => {
    if (excelFileOptions.current[field] !== value) {
      excelFileOptions.current = { ...excelFileOptions.current, [field]: value };
    }
  };

  const handlePullData = async () => {
    try {
      const data = await postPreviewSheet(id, excelFileOptions.current);
      setRundown(data.rundown);
      setUserFields(data.userFields);
    } catch (error) {
      const message = maybeAxiosError(error);
      setDirection('none');
      setStepData((prev) => ({ ...prev, pullPush: { complete: false, message } }));
    }
  };

  const handlePushData = async () => {
    try {
      postPushSheet(id, excelFileOptions.current);
      setDirection('none');
      setStepData((prev) => ({ ...prev, pullPush: { complete: true, message: '' } }));
    } catch (error) {
      const message = maybeAxiosError(error);
      setDirection('none');
      setStepData((prev) => ({ ...prev, pullPush: { complete: false, message } }));
    }
  };

  // GET preview
  const handleFinalise = async () => {
    if (rundown && userFields) {
      try {
        await patchData({ rundown, userFields });
        queryClient.setQueryData(RUNDOWN, rundown);
        queryClient.setQueryData(USERFIELDS, userFields);
        await queryClient.invalidateQueries({
          queryKey: [...RUNDOWN, ...USERFIELDS],
        });
      } catch (error) {
        const message = maybeAxiosError(error);
        console.error(message);
      }
    }
  };

  // TODO: reset process
  // TODO: add loading states
  return {
    stepData,
    handleFile,
    testClientSecret,
    handleAuthenticate,
    testAuthentication,
    testSheetId,
    testWorksheet,
    updateExcelFileOptions,
    handlePullData,
    handlePushData,
    handleFinalise,
    worksheetOptions,
    setSheetId,
  };
}
