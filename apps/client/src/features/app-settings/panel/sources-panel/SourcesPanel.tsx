import { ChangeEvent, useRef, useState } from 'react';
import { IoCloudOutline, IoDownloadOutline } from 'react-icons/io5';
import { Button, Input } from '@chakra-ui/react';
import { getErrorMessage, ImportMap } from 'ontime-utils';

import {
  getWorksheetNames as getWorksheetNamesExcel,
  importRundownPreview as importRundownPreviewExcel,
  upload as uploadExcel,
} from '../../../../common/api/excel';
import { getWorksheetNames } from '../../../../common/api/sheets';
import { maybeAxiosError } from '../../../../common/api/utils';
import { validateExcelImport } from '../../../../common/utils/uploadUtils';
import * as Panel from '../../panel-utils/PanelUtils';

import ImportMapForm from './import-map/ImportMapForm';
import GSheetInfo from './GSheetInfo';
import GSheetSetup from './GSheetSetup';
import ImportReview from './ImportReview';
import useGoogleSheet from './useGoogleSheet';
import { useSheetStore } from './useSheetStore';

import style from './SourcesPanel.module.scss';

export default function SourcesPanel() {
  const [importFlow, setImportFlow] = useState<'none' | 'excel' | 'gsheet' | 'finished'>('none');
  const [error, setError] = useState('');
  const [hasFile, setHasFile] = useState<'none' | 'loading' | 'done'>('none');

  const { exportRundown, importRundownPreview, verifyAuth } = useGoogleSheet();

  const setWorksheets = useSheetStore((state) => state.setWorksheets);
  const authenticationStatus = useSheetStore((state) => state.authenticationStatus);
  const setAuthenticationStatus = useSheetStore((state) => state.setAuthenticationStatus);
  const rundown = useSheetStore((state) => state.rundown);
  const setRundown = useSheetStore((state) => state.setRundown);
  const customFields = useSheetStore((state) => state.customFields);
  const setCustomFields = useSheetStore((state) => state.setCustomFields);
  const setSheetId = useSheetStore((state) => state.setSheetId);
  const sheetId = useSheetStore((state) => state.sheetId);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const fileToUpload = event.target.files?.[0];

    if (!fileToUpload) {
      setWorksheets(null);
      setHasFile('none');
      return;
    }
    try {
      setHasFile('loading');
      validateExcelImport(fileToUpload);
      await uploadExcel(fileToUpload);
      const names = await getWorksheetNamesExcel();
      setWorksheets(names);
      setImportFlow('excel');
      setHasFile('done');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(`Error uploading file: ${errorMessage}`);
      setWorksheets(null);
      setHasFile('none');
    }
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const resetFlow = () => {
    // we purposely omit clearing the authentication status
    setImportFlow('none');
    setRundown(null);
    setHasFile('none');
    setWorksheets(null);
    setCustomFields(null);
    setError('');
    setSheetId(null);
  };

  const openGSheetFlow = async () => {
    const result = await verifyAuth();
    if (result) {
      setAuthenticationStatus(result.authenticated);
      setSheetId(result.sheetId);
      if (result.authenticated === 'authenticated' && result.sheetId) {
        try {
          const names = await getWorksheetNames(result.sheetId);
          setWorksheets(names);
        } catch (error) {
          const message = maybeAxiosError(error);
          setError(`Error getting worksheets: ${message}`);
        }
      }
    }
    setImportFlow('gsheet');
  };

  const cancelGSheetFlow = () => {
    resetFlow();
  };

  const handleSubmitImportPreview = async (importMap: ImportMap) => {
    setError(''); // to clear previous error
    if (importFlow === 'excel') {
      try {
        const previewData = await importRundownPreviewExcel(importMap);
        setRundown(previewData.rundown);
        setCustomFields(previewData.customFields);
      } catch (error) {
        setError(maybeAxiosError(error));
      }
    }

    if (importFlow === 'gsheet') {
      if (!sheetId) return;
      await importRundownPreview(sheetId, importMap);
    }
  };

  const cancelImportMap = async () => {
    resetFlow();
    if (authenticationStatus === 'authenticated') {
      const result = await verifyAuth();
      if (result) {
        setAuthenticationStatus(result.authenticated);
      }
    }
  };

  const handleFinished = () => {
    setImportFlow('finished');
    setRundown(null);
    setHasFile('none');
    setWorksheets(null);
    setCustomFields(null);
    setError('');
  };

  const handleSubmitExport = async (importMap: ImportMap) => {
    if (!sheetId) return;
    await exportRundown(sheetId, importMap);
  };

  const isExcelFlow = importFlow === 'excel';
  const isGSheetFlow = importFlow === 'gsheet';
  const isAuthenticated = authenticationStatus === 'authenticated';
  const showInput = importFlow === 'none';
  const showCompleted = importFlow === 'finished';
  const showAuth = isGSheetFlow && !isAuthenticated;
  const showImportMap = (isGSheetFlow && isAuthenticated) || (isExcelFlow && hasFile === 'done');
  const showReview = rundown !== null && customFields !== null;

  return (
    <>
      <Panel.Header>Data sources</Panel.Header>
      <Panel.Section>
        <Panel.Card>
          <Panel.SubHeader>Synchronise your rundown with an external source</Panel.SubHeader>
          {error && <Panel.Error>{error}</Panel.Error>}
          {showInput && (
            <>
              <GSheetInfo />
              <Input
                ref={fileInputRef}
                style={{ display: 'none' }}
                type='file'
                onChange={handleFile}
                accept='.xlsx'
                data-testid='file-input'
              />
              <div className={style.uploadSection}>
                <div>
                  <Button
                    variant='ontime-filled'
                    size='sm'
                    leftIcon={<IoDownloadOutline />}
                    onClick={handleUpload}
                    isLoading={hasFile === 'loading'}
                  >
                    Import from spreadsheet
                  </Button>
                  <Panel.Description>Accepts .xlsx files</Panel.Description>
                </div>
                <div>
                  <Button
                    variant='ontime-filled'
                    size='sm'
                    leftIcon={<IoCloudOutline />}
                    onClick={openGSheetFlow}
                    isDisabled={hasFile !== 'none'}
                  >
                    Synchronise with Google
                  </Button>
                  <Panel.Description>Start authentication process</Panel.Description>
                </div>
              </div>
            </>
          )}
          {showCompleted && (
            <div className={style.finishSection}>
              {error ? (
                <span key='finish__error' className={style.error}>
                  Import failed
                </span>
              ) : (
                <span key='finish__success' className={style.success}>
                  Import successful
                </span>
              )}
              <Button variant='ontime-filled' size='sm' onClick={resetFlow}>
                Return
              </Button>
            </div>
          )}
          {showAuth && <GSheetSetup onCancel={cancelGSheetFlow} />}
          {showImportMap && !showReview && (
            <ImportMapForm
              isSpreadsheet={isExcelFlow}
              onCancel={cancelImportMap}
              onSubmitExport={handleSubmitExport}
              onSubmitImport={handleSubmitImportPreview}
            />
          )}
          {showReview && (
            <ImportReview
              rundown={rundown}
              customFields={customFields}
              onFinished={handleFinished}
              onCancel={cancelImportMap}
            />
          )}
        </Panel.Card>
      </Panel.Section>
    </>
  );
}
