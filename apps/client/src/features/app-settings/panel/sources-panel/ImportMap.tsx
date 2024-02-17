import { Button } from '@chakra-ui/react';

import ExcelFileOptions from '../../../modals/upload-modal/upload-options/ExcelFileOptions';
import * as Panel from '../PanelUtils';

import useGoogleSheet from './useGoogleSheet';
import { useSheetStore } from './useSheetStore';

import style from './SourcesPanel.module.scss';

export default function ImportMap() {
  const { handleImportPreview, handleExport } = useGoogleSheet();

  const sheetId = useSheetStore((state) => state.sheetId);
  const worksheetId = useSheetStore((state) => state.worksheet);
  const importOptions = useSheetStore((state) => state.excelFileOptions);
  const patchImportOptions = useSheetStore((state) => state.patchExcelFileOptions);
  const stepData = useSheetStore((state) => state.stepData);

  const exportRundown = () => {
    if (!worksheetId || !sheetId) return;
    handleExport(sheetId, worksheetId, importOptions);
  };

  const importPreviewRundown = () => {
    if (!worksheetId || !sheetId) return;
    handleImportPreview(sheetId, worksheetId, importOptions);
  };

  return (
    <Panel.Section>
      <Panel.Title>Import options</Panel.Title>
      <ExcelFileOptions importOptions={importOptions} updateOptions={patchImportOptions} />
      <Panel.Error>{stepData.worksheet.error}</Panel.Error>
      <div className={style.buttonRow}>
        <Button variant='ontime-filled' size='sm' onClick={exportRundown}>
          Export
        </Button>
        <Button variant='ontime-filled' size='sm' onClick={importPreviewRundown}>
          Import preview
        </Button>
      </div>
    </Panel.Section>
  );
}
