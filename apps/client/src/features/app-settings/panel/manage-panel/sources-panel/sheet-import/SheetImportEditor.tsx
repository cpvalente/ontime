import type {
  ImportedFields,
  RundownImportMode,
  SpreadsheetPreviewResponse,
  SpreadsheetWorksheetMetadata,
} from 'ontime-types';
import type { ImportMap } from 'ontime-utils';
import { useMemo } from 'react';
import { IoArrowUpOutline, IoCheckmark, IoChevronDown, IoEye, IoWarningOutline } from 'react-icons/io5';

import Button from '../../../../../../common/components/buttons/Button';
import { DropdownMenu, DropdownMenuOption } from '../../../../../../common/components/dropdown-menu/DropdownMenu';
import Input from '../../../../../../common/components/input/input/Input';
import Select from '../../../../../../common/components/select/Select';
import * as Panel from '../../../../panel-utils/PanelUtils';
import ApplyImportButton from './ApplyImportButton';
import { isIdColumnMapped } from './importMapUtils';
import PreviewTable from './preview/PreviewTable';
import SheetImportMappingPane from './SheetImportMappingPane';
import { useSheetImportForm } from './useSheetImportForm';

import style from './SheetImportEditor.module.scss';

interface SheetImportEditorProps {
  sourceKey: string;
  defaultRundownName: string;
  worksheetNames: string[];
  initialMetadata: SpreadsheetWorksheetMetadata | null;
  loadMetadata: (worksheet: string) => Promise<SpreadsheetWorksheetMetadata>;
  previewImport: (importMap: ImportMap) => Promise<SpreadsheetPreviewResponse>;
  onApply: (
    preview: SpreadsheetPreviewResponse,
    mode: RundownImportMode,
    newRundownTitle: string,
    providedFields: ImportedFields,
  ) => Promise<void>;
  onCancel: () => void;
  onExport?: (importMap: ImportMap) => Promise<void>;
}

const importModeOptions: Array<{
  value: RundownImportMode;
  label: string;
  description: string;
}> = [
  {
    value: 'override',
    label: 'Replace current rundown',
    description: 'Spreadsheet data completely replaces current rundown',
  },
  {
    value: 'merge',
    label: 'Merge with current rundown',
    description: 'Merge entries referencing their IDs, entries not present in spreadsheet rundown are deleted',
  },
  {
    value: 'new',
    label: 'New rundown',
    description: 'Create a new rundown to import the data into. Loads the new rundown',
  },
];

export default function SheetImportEditor({
  sourceKey,
  defaultRundownName,
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
    importMode,
    setImportMode,
    newRundownTitle,
    setNewRundownTitle,
    handlePreviewSubmit,
    handleExportSubmit,
    handleApply,
  } = useSheetImportForm({
    sourceKey,
    defaultRundownName,
    worksheetNames,
    initialMetadata,
    loadMetadata,
    previewImport,
    onApply,
    onExport,
  });

  const selectedImportMode = importModeOptions.find((option) => option.value === importMode) ?? importModeOptions[0];
  const importModeItems = useMemo<DropdownMenuOption[]>(
    () =>
      importModeOptions.map((option) => ({
        type: 'item',
        label: option.label,
        description: option.description,
        icon: importMode === option.value ? IoCheckmark : undefined,
        onClick: () => setImportMode(option.value),
      })),
    [importMode, setImportMode],
  );

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
      {importMode === 'merge' && !isIdColumnMapped(values) && (
        <Panel.Description tone='warning'>
          <IoWarningOutline /> No ID column mapped — merge matches entries by ID, so it will behave like Replace. Export
          your rundown to a spreadsheet first to keep its IDs.
        </Panel.Description>
      )}
      <Panel.InlineElements align='apart' wrap='wrap' className={style.editorFooter}>
        <Panel.InlineElements wrap='wrap'>
          <label className={style.worksheetControl}>
            <span className={style.worksheetLabel}>Import mode</span>
            <DropdownMenu
              render={<Button className={style.importModeTrigger} variant='subtle-white' />}
              items={importModeItems}
            >
              {selectedImportMode.label}
              <IoChevronDown />
            </DropdownMenu>
          </label>
          {importMode === 'new' && (
            <label className={style.worksheetControl}>
              <span className={style.worksheetLabel}>New rundown name</span>
              <Input
                value={newRundownTitle}
                onChange={(event) => setNewRundownTitle(event.target.value)}
                placeholder={state.preview?.rundown.title || 'Imported rundown'}
                aria-label='New rundown name'
              />
            </label>
          )}
        </Panel.InlineElements>
        <Panel.InlineElements wrap='wrap'>
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
          <ApplyImportButton
            preview={state.preview}
            mode={importMode}
            disabled={!state.preview || isBusy}
            loading={state.loading === 'apply'}
            onApply={handleApply}
          />
        </Panel.InlineElements>
      </Panel.InlineElements>
    </Panel.Section>
  );
}
