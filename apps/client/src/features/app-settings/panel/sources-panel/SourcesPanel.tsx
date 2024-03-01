import { ChangeEvent, useRef, useState } from 'react';
import { Button, Input } from '@chakra-ui/react';
import { IoCloudOutline } from '@react-icons/all-files/io5/IoCloudOutline';
import { IoDownloadOutline } from '@react-icons/all-files/io5/IoDownloadOutline';
import { ImportMap, unpackError } from 'ontime-utils';

import { maybeAxiosError } from '../../../../common/api/apiUtils';
import { importSpreadsheetPreview } from '../../../../common/api/ontimeApi';
import { validateSpreadsheetImport } from '../../../../common/utils/uploadUtils';
import * as Panel from '../PanelUtils';

import ImportMapForm from './import-map/ImportMapForm';
import GSheetInfo from './GSheetInfo';
import GSheetSetup from './GSheetSetup';
import ImportReview from './ImportReview';
import useGoogleSheet from './useGoogleSheet';
import { useSheetStore } from './useSheetStore';

import style from './SourcesPanel.module.scss';

export default function SourcesPanel() {
  const [importFlow, setImportFlow] = useState<'none' | 'excel' | 'gsheet'>('none');
  const [error, setError] = useState('');

  const { exportRundown, importRundownPreview, revoke, verifyAuth } = useGoogleSheet();

  const spreadsheet = useSheetStore((state) => state.spreadsheet);
  const setSpreadsheet = useSheetStore((state) => state.setSpreadsheet);
  const authenticationStatus = useSheetStore((state) => state.authenticationStatus);
  const setAuthenticationStatus = useSheetStore((state) => state.setAuthenticationStatus);
  const rundown = useSheetStore((state) => state.rundown);
  const setRundown = useSheetStore((state) => state.setRundown);
  const customFields = useSheetStore((state) => state.customFields);
  const setCustomFields = useSheetStore((state) => state.setCustomFields);
  const sheetId = useSheetStore((state) => state.sheetId);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const fileToUpload = event.target.files?.[0];

    if (!fileToUpload) {
      setSpreadsheet(null);
      return;
    }
    try {
      validateSpreadsheetImport(fileToUpload);
      setSpreadsheet(fileToUpload);
      setImportFlow('excel');
    } catch (error) {
      const errorMessage = unpackError(error);
      setError(`Error uploading file: ${errorMessage}`);
      setSpreadsheet(null);
    }
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const openGSheetFlow = () => {
    setImportFlow('gsheet');
  };

  const cancelGSheetFlow = () => {
    setImportFlow('none');
  };

  const handleSubmitImportPreview = async (importMap: ImportMap) => {
    if (importFlow === 'excel') {
      if (!spreadsheet) return;
      try {
        const previewData = await importSpreadsheetPreview(spreadsheet, importMap);
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
    setImportFlow('none');
    if (spreadsheet) {
      setSpreadsheet(null);
    }

    if (authenticationStatus === 'authenticated') {
      await revoke();
      const result = await verifyAuth();
      if (result) {
        setAuthenticationStatus(result.authenticated);
      }
    }
  };

  const handleFinished = () => {
    setImportFlow('none');
    setRundown(null);
    setSpreadsheet(null);
    setCustomFields(null);
  };

  const handleSubmitExport = async (importMap: ImportMap) => {
    if (!sheetId) return;
    await exportRundown(sheetId, importMap);
  };

  const isExcelFlow = importFlow === 'excel';
  const isGSheetFlow = importFlow === 'gsheet';
  const hasFile = Boolean(spreadsheet);
  const isAuthenticated = authenticationStatus === 'authenticated';
  const showInput = importFlow === 'none';
  const showAuth = isGSheetFlow && !isAuthenticated;
  const showImportMap = (isGSheetFlow && isAuthenticated) || (isExcelFlow && hasFile);
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
                  <Button variant='ontime-filled' size='sm' leftIcon={<IoDownloadOutline />} onClick={handleUpload}>
                    Import from spreadsheet
                  </Button>
                  <Panel.Description>Accepts .xlsx files</Panel.Description>
                </div>
                <div>
                  <Button variant='ontime-filled' size='sm' leftIcon={<IoCloudOutline />} onClick={openGSheetFlow}>
                    Synchronise with Google
                  </Button>
                  <Panel.Description>Start authentication process</Panel.Description>
                </div>
              </div>
            </>
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
          {showReview && <ImportReview rundown={rundown} customFields={customFields} onFinished={handleFinished} />}
        </Panel.Card>
      </Panel.Section>
    </>
  );
}
