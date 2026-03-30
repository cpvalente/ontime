import type {
  SpreadsheetPreviewResponse,
  SpreadsheetWorksheetMetadata,
  SpreadsheetWorksheetOptions,
} from 'ontime-types';
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
  previewRundown as previewGoogleSheet,
  uploadRundown,
} from '../../../../../common/api/sheets';
import Button from '../../../../../common/components/buttons/Button';
import Info from '../../../../../common/components/info/Info';
import ExternalLink from '../../../../../common/components/link/external-link/ExternalLink';
import Modal from '../../../../../common/components/modal/Modal';
import useRundown from '../../../../../common/hooks-query/useRundown';
import { validateExcelImport } from '../../../../../common/utils/uploadUtils';
import * as Panel from '../../../panel-utils/PanelUtils';
import GSheetSetup from './GSheetSetup';
import SheetImportEditor from './sheet-import/SheetImportEditor';
import useSpreadsheetImport from './useSpreadsheetImport';

import style from './SourcesPanel.module.scss';

const googleSheetDocsUrl = 'https://docs.getontime.no/features/import-spreadsheet-gsheet/';

type ActiveSource =
  | {
      kind: 'excel';
      worksheetNames: string[];
      initialWorksheetMetadata: SpreadsheetWorksheetMetadata | null;
    }
  | {
      kind: 'gsheet';
      sheetId: string;
      worksheetNames: string[];
      initialWorksheetMetadata: SpreadsheetWorksheetMetadata | null;
    };

export default function SourcesPanel() {
  const [importFlow, setImportFlow] = useState<'none' | 'excel' | 'gsheet' | 'finished'>('none');
  const [error, setError] = useState('');
  const [hasFile, setHasFile] = useState<'none' | 'loading' | 'done'>('none');
  const [activeSource, setActiveSource] = useState<ActiveSource | null>(null);

  const { data: currentRundown } = useRundown();
  const { importRundown } = useSpreadsheetImport();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const fileToUpload = event.target.files?.[0];

    if (!fileToUpload) {
      setActiveSource(null);
      setHasFile('none');
      return;
    }
    try {
      setHasFile('loading');
      setError('');
      validateExcelImport(fileToUpload);
      const worksheetOptions = await uploadExcel(fileToUpload);
      setActiveSource({
        kind: 'excel',
        worksheetNames: worksheetOptions.worksheets,
        initialWorksheetMetadata: worksheetOptions.metadata,
      });
      setImportFlow('excel');
      setHasFile('done');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(`Error uploading file: ${errorMessage}`);
      setActiveSource(null);
      setHasFile('none');
    }
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const resetFlow = () => {
    setImportFlow('none');
    setHasFile('none');
    setActiveSource(null);
    setError('');
  };

  const openGSheetFlow = () => {
    setError('');
    setActiveSource(null);
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
    setActiveSource(null);
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
    (worksheet: string) => {
      if (!activeSource) {
        throw new Error('No spreadsheet source loaded');
      }

      return activeSource.kind === 'excel'
        ? getExcelWorksheetMetadata(worksheet)
        : getGoogleWorksheetMetadata(activeSource.sheetId, worksheet);
    },
    [activeSource],
  );

  const previewImport = useCallback(
    (importMap: ImportMap): Promise<SpreadsheetPreviewResponse> => {
      if (!activeSource) {
        throw new Error('No spreadsheet source loaded');
      }

      return activeSource.kind === 'excel'
        ? importExcelPreview(importMap)
        : previewGoogleSheet(activeSource.sheetId, importMap);
    },
    [activeSource],
  );

  const exportToGoogleSheet = useCallback(
    (importMap: ImportMap): Promise<void> => {
      if (!activeSource || activeSource.kind !== 'gsheet') {
        throw new Error('Google Sheet source not available');
      }

      return uploadRundown(activeSource.sheetId, importMap);
    },
    [activeSource],
  );

  const handleSheetLoaded = useCallback((sheetId: string, worksheetOptions: SpreadsheetWorksheetOptions) => {
    setActiveSource({
      kind: 'gsheet',
      sheetId,
      worksheetNames: worksheetOptions.worksheets,
      initialWorksheetMetadata: worksheetOptions.metadata,
    });
  }, []);

  const isGSheetFlow = importFlow === 'gsheet';
  const showInput = importFlow === 'none';
  const showCompleted = importFlow === 'finished';
  const showAuth = isGSheetFlow && activeSource === null;
  const showImportWorkspace = activeSource !== null;
  const importModalTitle = activeSource?.kind === 'excel' ? 'Import spreadsheet' : 'Synchronise with Google Sheet';
  const sourceKey = (() => {
    if (!activeSource) return null;
    if (activeSource.kind === 'excel') return 'excel';
    return `gsheet:${activeSource.sheetId}`;
  })();

  return (
    <Panel.Section>
      <Panel.Card>
        <Panel.SubHeader>Synchronise your rundown with an external source</Panel.SubHeader>
        {error && <Panel.Error>{error}</Panel.Error>}
        {showInput && (
          <div className={style.introStack}>
            <Info>
              <Info.Title>Choose between a quick file import or a live Google Sheet connection.</Info.Title>
              <Info.Body>
                Google Sheets sync needs a client secret and a one-time device authentication before you can load a
                sheet by ID.
              </Info.Body>
              <Info.Footer>
                <ExternalLink href={googleSheetDocsUrl}>Read setup guide</ExternalLink>
              </Info.Footer>
            </Info>
            <input
              ref={fileInputRef}
              style={{ display: 'none' }}
              type='file'
              onChange={handleFile}
              accept='.xlsx'
              data-testid='file-input'
            />
            <div className={style.sourceGrid}>
              <section className={style.sourceCard}>
                <div className={style.sourceHeader}>
                  <h4 className={style.sourceTitle}>Import spreadsheet</h4>
                </div>
                <p className={style.sourceDescription}>
                  Bring in a one-off spreadsheet, review the mapping, and apply the data to the current rundown.
                </p>
                <div className={style.sourceMeta}>Accepts `.xlsx` files</div>
                <Button variant='primary' size='large' fluid onClick={handleUpload} loading={hasFile === 'loading'}>
                  <IoDownloadOutline />
                  Import from spreadsheet
                </Button>
              </section>
              <section className={style.sourceCard}>
                <div className={style.sourceHeader}>
                  <h4 className={style.sourceTitle}>Synchronise with Google</h4>
                </div>
                <p className={style.sourceDescription}>
                  Connect a Google account once, then load any sheet by ID and keep the import flow inside Ontime.
                </p>
                <div className={style.sourceMeta}>Requires Google OAuth client credentials</div>
                <Button variant='primary' size='large' fluid onClick={openGSheetFlow} disabled={hasFile !== 'none'}>
                  <IoCloudOutline />
                  Synchronise with Google
                </Button>
              </section>
            </div>
          </div>
        )}
        {showCompleted && (
          <div className={style.finishSection}>
            <span className={style.finishBadge}>Import complete</span>
            <div className={style.finishTitle}>Spreadsheet data applied.</div>
            <div className={style.finishDescription}>You can close this flow or start another import.</div>
            <Button variant='subtle-white' onClick={resetFlow}>
              Reset flow
            </Button>
          </div>
        )}
        {showAuth && <GSheetSetup onCancel={cancelGSheetFlow} onSheetLoaded={handleSheetLoaded} />}
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
              worksheetNames={activeSource?.worksheetNames ?? []}
              initialMetadata={activeSource?.initialWorksheetMetadata ?? null}
              loadMetadata={loadWorksheetMetadata}
              previewImport={previewImport}
              onApply={handleApplyImport}
              onCancel={cancelImportFlow}
              onExport={activeSource?.kind === 'gsheet' ? exportToGoogleSheet : undefined}
            />
          }
        />
      </Panel.Card>
    </Panel.Section>
  );
}
