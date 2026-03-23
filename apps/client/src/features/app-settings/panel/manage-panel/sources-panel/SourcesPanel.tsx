import type { SpreadsheetPreviewResponse, SpreadsheetWorksheetMetadata } from 'ontime-types';
import { getErrorMessage, ImportMap } from 'ontime-utils';
import { ChangeEvent, useCallback, useRef, useState } from 'react';
import { IoCloudOutline, IoDownloadOutline } from 'react-icons/io5';

import {
  getWorksheetMetadata as getExcelWorksheetMetadata,
  importRundownPreview as importExcelPreview,
  upload as uploadExcel,
} from '../../../../../common/api/excel';
import {
  getWorksheetMetadata as getGoogleWorksheetMetadata,
  getWorksheetOptions,
  previewRundown as previewGoogleSheet,
  uploadRundown,
} from '../../../../../common/api/sheets';
import { maybeAxiosError } from '../../../../../common/api/utils';
import Button from '../../../../../common/components/buttons/Button';
import * as Editor from '../../../../../common/components/editor-utils/EditorUtils';
import Modal from '../../../../../common/components/modal/Modal';
import useRundown from '../../../../../common/hooks-query/useRundown';
import { validateExcelImport } from '../../../../../common/utils/uploadUtils';
import * as Panel from '../../../panel-utils/PanelUtils';
import GSheetInfo from './GSheetInfo';
import GSheetSetup from './GSheetSetup';
import SheetImportEditor from './sheet-import/SheetImportEditor';
import useGoogleSheet from './useGoogleSheet';
import { useSheetStore } from './useSheetStore';

import style from './SourcesPanel.module.scss';

export default function SourcesPanel() {
  const [importFlow, setImportFlow] = useState<'none' | 'excel' | 'gsheet' | 'finished'>('none');
  const [error, setError] = useState('');
  const [hasFile, setHasFile] = useState<'none' | 'loading' | 'done'>('none');
  const [initialWorksheetMetadata, setInitialWorksheetMetadata] = useState<SpreadsheetWorksheetMetadata | null>(null);

  const { data: currentRundown } = useRundown();
  const { importRundown, verifyAuth } = useGoogleSheet();

  const setWorksheets = useSheetStore((state) => state.setWorksheets);
  const worksheetNames = useSheetStore((state) => state.worksheetNames);
  const authenticationStatus = useSheetStore((state) => state.authenticationStatus);
  const setAuthenticationStatus = useSheetStore((state) => state.setAuthenticationStatus);
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
      setError('');
      validateExcelImport(fileToUpload);
      const worksheetOptions = await uploadExcel(fileToUpload);
      setWorksheets(worksheetOptions.worksheets);
      setInitialWorksheetMetadata(worksheetOptions.metadata);
      setImportFlow('excel');
      setHasFile('done');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(`Error uploading file: ${errorMessage}`);
      setWorksheets(null);
      setInitialWorksheetMetadata(null);
      setHasFile('none');
    }
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const resetFlow = () => {
    // we purposely omit clearing the authentication status
    setImportFlow('none');
    setHasFile('none');
    setWorksheets(null);
    setError('');
    setSheetId(null);
    setInitialWorksheetMetadata(null);
  };

  const openGSheetFlow = async () => {
    setError('');
    setInitialWorksheetMetadata(null);
    const result = await verifyAuth();
    if (result) {
      setAuthenticationStatus(result.authenticated);
      setSheetId(result.sheetId);
      if (result.authenticated === 'authenticated' && result.sheetId) {
        try {
          const worksheetOptions = await getWorksheetOptions(result.sheetId);
          setWorksheets(worksheetOptions.worksheets);
          setInitialWorksheetMetadata(worksheetOptions.metadata);
        } catch (error) {
          const message = maybeAxiosError(error);
          setError(`Error getting worksheets: ${message}`);
          setInitialWorksheetMetadata(null);
        }
      }
    }
    setImportFlow('gsheet');
  };

  const cancelGSheetFlow = () => {
    resetFlow();
  };

  const cancelImportFlow = () => {
    resetFlow();
  };

  const handleFinished = () => {
    setImportFlow('finished');
    setHasFile('none');
    setWorksheets(null);
    setError('');
  };

  const handleApplyImport = async (preview: SpreadsheetPreviewResponse) => {
    if (!currentRundown) {
      throw new Error('No current rundown loaded');
    }

    await importRundown(
      {
        [currentRundown.id]: {
          ...preview.rundown,
          id: currentRundown.id,
          title: currentRundown.title,
        },
      },
      preview.customFields,
    );
    handleFinished();
  };

  const loadWorksheetMetadata = useCallback(
    (worksheet: string) =>
      importFlow === 'excel'
        ? getExcelWorksheetMetadata(worksheet)
        : getGoogleWorksheetMetadata(sheetId as string, worksheet),
    [importFlow, sheetId],
  );

  const previewImport = useCallback(
    (importMap: ImportMap): Promise<SpreadsheetPreviewResponse> =>
      importFlow === 'excel' ? importExcelPreview(importMap) : previewGoogleSheet(sheetId as string, importMap),
    [importFlow, sheetId],
  );

  const exportToGoogleSheet = useCallback(
    (importMap: ImportMap): Promise<void> => uploadRundown(sheetId as string, importMap),
    [sheetId],
  );

  const isExcelFlow = importFlow === 'excel';
  const isGSheetFlow = importFlow === 'gsheet';
  const isAuthenticated = authenticationStatus === 'authenticated';
  const showInput = importFlow === 'none';
  const showCompleted = importFlow === 'finished';
  const showAuth = isGSheetFlow && (!isAuthenticated || !worksheetNames?.length);
  const showImportWorkspace =
    (isExcelFlow && hasFile === 'done' && Boolean(worksheetNames?.length)) ||
    (isGSheetFlow && isAuthenticated && Boolean(sheetId) && Boolean(worksheetNames?.length));
  const importModalTitle = isExcelFlow ? 'Import spreadsheet' : 'Synchronise with Google Sheet';
  const sourceKey = isExcelFlow ? 'excel' : sheetId ? `gsheet:${sheetId}` : null;

  return (
    <Panel.Section>
      <Panel.Card>
        <Panel.SubHeader>Synchronise your rundown with an external source</Panel.SubHeader>
        {error && <Panel.Error>{error}</Panel.Error>}
        {showInput && (
          <>
            <GSheetInfo />
            <input
              ref={fileInputRef}
              style={{ display: 'none' }}
              type='file'
              onChange={handleFile}
              accept='.xlsx'
              data-testid='file-input'
            />
            <div className={style.uploadSection}>
              <div>
                <Button variant='primary' onClick={handleUpload} loading={hasFile === 'loading'}>
                  <IoDownloadOutline />
                  Import from spreadsheet
                </Button>
                <Panel.Description>Accepts .xlsx files</Panel.Description>
              </div>
              <Editor.Separator orientation='vertical' />
              <div>
                <Button variant='primary' onClick={openGSheetFlow} disabled={hasFile !== 'none'}>
                  <IoCloudOutline />
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
            <Button variant='primary' onClick={resetFlow}>
              Return
            </Button>
          </div>
        )}
        {showAuth && (
          <GSheetSetup
            onCancel={cancelGSheetFlow}
            onWorksheetOptionsLoaded={(worksheetOptions) => {
              setWorksheets(worksheetOptions.worksheets);
              setInitialWorksheetMetadata(worksheetOptions.metadata);
            }}
          />
        )}
        <Modal
          isOpen={showImportWorkspace}
          title={importModalTitle}
          showBackdrop
          showCloseButton
          size='wide'
          onClose={cancelImportFlow}
          bodyElements={
            <SheetImportEditor
              sourceKey={sourceKey ?? 'spreadsheet'}
              worksheetNames={worksheetNames ?? []}
              initialMetadata={initialWorksheetMetadata}
              loadMetadata={loadWorksheetMetadata}
              previewImport={previewImport}
              onApply={handleApplyImport}
              onCancel={cancelImportFlow}
              onExport={isGSheetFlow && sheetId ? exportToGoogleSheet : undefined}
            />
          }
        />
      </Panel.Card>
    </Panel.Section>
  );
}
