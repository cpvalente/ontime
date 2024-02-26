import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { ImportMap } from 'ontime-utils';

import * as Panel from '../../PanelUtils';
import { useSheetStore } from '../useSheetStore';

import ImportMapCustomRow from './ImportMapCustomRow';
import ImportMapRow from './ImportMapRow';
import { makeImportMap, makeImportPreview, TableEntry } from './importMapUtils';

import style from '../SourcesPanel.module.scss';

const importMap = {
  worksheet: 'event schedule',
  timeStart: 'time start',
  timeEnd: 'time end',
  duration: 'duration',
  cue: 'cue',
  title: 'title',
  presenter: 'presenter',
  subtitle: 'subtitle',
  isPublic: 'public',
  skip: 'skip',
  note: 'notes',
  colour: 'colour',
  endAction: 'end action',
  timerType: 'timer type',
  timeWarning: 'warning time',
  timeDanger: 'danger time',
  custom: {
    lighting: 'lx',
    sound: 'sound',
    video: 'av',
  },
};

interface ImportMapFormProps {
  isSpreadsheet?: boolean;
  onSubmitExport: (importMap: ImportMap) => Promise<void>;
  onSubmitImport: (importMap: ImportMap) => Promise<void>;
}

export default function ImportMapForm(props: ImportMapFormProps) {
  const { isSpreadsheet, onSubmitExport, onSubmitImport } = props;

  //const importMap = useSheetStore((state) => state.spreadsheetImportMap);
  const { ontimeFields, customFields } = makeImportPreview(importMap);

  const { handleSubmit } = useForm({
    mode: 'onBlur',
    defaultValues: [...ontimeFields, customFields],
    values: [...ontimeFields, customFields],
  });

  const stepData = useSheetStore((state) => state.stepData);

  const [loading, setLoading] = useState<'' | 'export' | 'import'>('');

  const handleExport = async (values: TableEntry[]) => {
    setLoading('export');
    const importMap = makeImportMap(values);
    await onSubmitExport(importMap);
    setLoading('');
  };

  const handleImportPreview = async (values: TableEntry[]) => {
    setLoading('import');
    const importMap = makeImportMap(values);
    await onSubmitImport(importMap);
    setLoading('');
  };

  const isLoading = Boolean(loading);
  const canSubmitSpreadsheet = isSpreadsheet && !isLoading;
  const canSubmitGSheet = !isLoading;
  const canSubmit = canSubmitSpreadsheet || canSubmitGSheet;

  return (
    <Panel.Section as='form' id='import-map'>
      <Panel.Title>Import options</Panel.Title>
      <Panel.Table>
        <thead>
          <tr>
            <th>Ontime field</th>
            <th>From spreadsheet name</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {ontimeFields.map((field) => {
            return (
              <ImportMapRow
                key={field.ontimeName}
                label={field.label}
                ontimeName={field.ontimeName}
                importName={field.importName}
                onChange={() => undefined}
              />
            );
          })}
          {customFields.map((field) => {
            return (
              <ImportMapCustomRow
                key={field.ontimeName}
                ontimeName={field.ontimeName}
                importName={field.importName}
                onChange={() => undefined}
                onDelete={() => undefined}
              />
            );
          })}
          <tr>
            <td colSpan={99}>
              <Button size='sm' variant='ontime-subtle' leftIcon={<IoAdd />} onClick={() => undefined}>
                Add custom field
              </Button>
            </td>
          </tr>
        </tbody>
      </Panel.Table>
      <Panel.Error>{stepData.worksheet.error}</Panel.Error>
      <div className={style.buttonRow}>
        {!isSpreadsheet && (
          <Button
            variant='ontime-filled'
            size='sm'
            onClick={handleSubmit(handleExport)}
            isDisabled={!canSubmitGSheet}
            isLoading={loading === 'export'}
          >
            Export
          </Button>
        )}
        <Button
          variant='ontime-filled'
          size='sm'
          onClick={handleSubmit(handleImportPreview)}
          isDisabled={!canSubmit}
          isLoading={loading === 'import'}
        >
          Import preview
        </Button>
      </div>
    </Panel.Section>
  );
}
