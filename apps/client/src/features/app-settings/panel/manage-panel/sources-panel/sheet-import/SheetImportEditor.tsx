import type { SpreadsheetPreviewResponse, SpreadsheetWorksheetMetadata } from 'ontime-types';
import type { ImportMap } from 'ontime-utils';
import { IoArrowUpOutline, IoEye } from 'react-icons/io5';

import Button from '../../../../../../common/components/buttons/Button';
import Select from '../../../../../../common/components/select/Select';
import * as Panel from '../../../../panel-utils/PanelUtils';
import PreviewTable from './preview/PreviewTable';
import SheetImportMappingPane from './SheetImportMappingPane';
import { useSheetImportForm } from './useSheetImportForm';

import style from './SheetImportEditor.module.scss';

interface SheetImportEditorProps {
  sourceKey: string;
  worksheetNames: string[];
  initialMetadata: SpreadsheetWorksheetMetadata | null;
  loadMetadata: (worksheet: string) => Promise<SpreadsheetWorksheetMetadata>;
  previewImport: (importMap: ImportMap) => Promise<SpreadsheetPreviewResponse>;
  onApply: (preview: SpreadsheetPreviewResponse) => Promise<void>;
  onCancel: () => void;
  onExport?: (importMap: ImportMap) => Promise<void>;
}

export default function SheetImportEditor({
  sourceKey,
  worksheetNames,
  initialMetadata,
  loadMetadata,
  previewImport,
  onApply,
  onCancel,
  onExport,
}: SheetImportEditorProps) {
  const {
    values,
    setValue,
    fields,
    addCustomField,
    removeCustomField,
    sampleHeaders,
    assignedHeaders,
    warnings,
    columnLabels,
    worksheetHeaders,
    state,
    toolbarStatus,
    isLoadingMetadata,
    isBusy,
    canPreview,
    displayError,
    handlePreviewSubmit,
    handleExportSubmit,
    handleApply,
  } = useSheetImportForm({
    sourceKey,
    worksheetNames,
    initialMetadata,
    loadMetadata,
    previewImport,
    onApply,
    onExport,
  });

  return (
    <Panel.Section as='form' id='spreadsheet-import-workspace' className={style.editor} onSubmit={handlePreviewSubmit}>
      <Panel.InlineElements align='apart' wrap='wrap' className={style.editorToolbar}>
        <label className={style.worksheetControl}>
          <span className={style.worksheetLabel}>Worksheet</span>
          <Select
            options={worksheetNames.map((name) => ({ value: name, label: name }))}
            value={values.worksheet}
            onValueChange={(nextValue) =>
              setValue('worksheet', nextValue ?? '', { shouldDirty: true, shouldValidate: true })
            }
          />
        </label>
        {toolbarStatus && <Panel.Description>{toolbarStatus}</Panel.Description>}
      </Panel.InlineElements>

      <div className={style.editorBody}>
        <SheetImportMappingPane
          values={values}
          setValue={setValue}
          warnings={warnings}
          sampleHeaders={sampleHeaders}
          assignedHeaders={assignedHeaders}
          fields={fields}
          addCustomField={addCustomField}
          removeCustomField={removeCustomField}
          isBusy={isBusy}
        />

        <section className={style.previewPane}>
          <div className={style.previewPaneHeader}>
            <span className={style.previewPaneTitle}>Import preview</span>
          </div>
          <div className={style.tableShell}>
            <PreviewTable
              preview={state.preview}
              columnLabels={columnLabels}
              isLoadingMetadata={isLoadingMetadata}
              worksheetHeaders={worksheetHeaders}
            />
          </div>
        </section>
      </div>

      {displayError && <Panel.Error>{displayError}</Panel.Error>}
      <Panel.InlineElements align='end' wrap='wrap' className={style.editorFooter}>
        <Button onClick={onCancel} disabled={isBusy}>
          Cancel
        </Button>
        {onExport && (
          <Button onClick={handleExportSubmit} disabled={!canPreview} loading={state.loading === 'export'}>
            <IoArrowUpOutline />
            Export
          </Button>
        )}
        <Button
          variant={state.preview ? undefined : 'primary'}
          onClick={handlePreviewSubmit}
          disabled={!canPreview}
          loading={state.loading === 'preview'}
        >
          <IoEye />
          Preview import
        </Button>
        <Button
          variant='primary'
          onClick={handleApply}
          disabled={!state.preview || isBusy}
          loading={state.loading === 'apply'}
        >
          Apply import
        </Button>
      </Panel.InlineElements>
    </Panel.Section>
  );
}
