import { useState } from 'react';
import { Button } from '@chakra-ui/react';

import ExcelFileOptions from '../../../modals/upload-modal/upload-options/ExcelFileOptions';
import * as Panel from '../PanelUtils';

import useGoogleSheet from './useGoogleSheet';
import { useSheetStore } from './useSheetStore';

import style from './SourcesPanel.module.scss';

export default function ImportMap() {
  const { importRundownPreview, exportRundown } = useGoogleSheet();

  const importOptions = useSheetStore((state) => state.excelFileOptions);
  const patchImportOptions = useSheetStore((state) => state.patchExcelFileOptions);
  const stepData = useSheetStore((state) => state.stepData);
  const sheetId = useSheetStore((state) => state.sheetId);

  const [loading, setLoading] = useState<'' | 'export' | 'import'>('');

  const handleExport = async () => {
    if (!sheetId) return;
    setLoading('export');
    await exportRundown(sheetId, importOptions);
    setLoading('');
  };

  const handleImportPreview = async () => {
    if (!sheetId) return;
    setLoading('import');
    await importRundownPreview(sheetId, importOptions);
    setLoading('');
  };

  const isLoading = Boolean(loading);

  return (
    <Panel.Section>
      <Panel.Title>Import options</Panel.Title>
      <ExcelFileOptions importOptions={importOptions} updateOptions={patchImportOptions} />
      <Panel.Error>{stepData.worksheet.error}</Panel.Error>
      <div className={style.buttonRow}>
        <Button
          variant='ontime-filled'
          size='sm'
          onClick={handleExport}
          isDisabled={isLoading || !sheetId}
          isLoading={loading === 'export'}
        >
          Export
        </Button>
        <Button
          variant='ontime-filled'
          size='sm'
          onClick={handleImportPreview}
          isDisabled={isLoading || !sheetId}
          isLoading={loading === 'import'}
        >
          Import preview
        </Button>
      </div>
    </Panel.Section>
  );
}
