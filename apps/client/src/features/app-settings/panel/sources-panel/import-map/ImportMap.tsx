import { useState } from 'react';
import { Button } from '@chakra-ui/react';

import * as Panel from '../../PanelUtils';
import useGoogleSheet from '../useGoogleSheet';
import { useSheetStore } from '../useSheetStore';

import ImportMapTable from './ImportMapTable';

import style from '../SourcesPanel.module.scss';

export default function ImportMap() {
  const { importRundownPreview, exportRundown } = useGoogleSheet();

  const importMap = useSheetStore((state) => state.spreadsheetImportMap);
  const patchImportOptions = useSheetStore((state) => state.patchSpreadsheetImportMap);
  const stepData = useSheetStore((state) => state.stepData);
  const sheetId = useSheetStore((state) => state.sheetId);

  const [loading, setLoading] = useState<'' | 'export' | 'import'>('');

  const handleExport = async () => {
    if (!sheetId) return;
    setLoading('export');
    await exportRundown(sheetId, importMap);
    setLoading('');
  };

  const handleImportPreview = async () => {
    if (!sheetId) return;
    setLoading('import');
    await importRundownPreview(sheetId, importMap);
    setLoading('');
  };

  const isLoading = Boolean(loading);

  return (
    <Panel.Section>
      <Panel.Title>Import options</Panel.Title>
      <ImportMapTable importOptions={importMap} updateOptions={patchImportOptions} />
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
