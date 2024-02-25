import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';

import * as Panel from '../../PanelUtils';
import useGoogleSheet from '../useGoogleSheet';
import { useSheetStore } from '../useSheetStore';

import ImportMapCustomRow from './ImportMapCustomRow';
import ImportMapRow from './ImportMapRow';
import { makeImportPreview } from './importMapUtils';

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
export default function ImportMapForm() {
  const { importRundownPreview, exportRundown } = useGoogleSheet();
  //const importMap = useSheetStore((state) => state.spreadsheetImportMap);
  const { ontimeFields, customFields } = makeImportPreview(importMap);

  const { handleSubmit, register, formState } = useForm({
    mode: 'onBlur',
    defaultValues: [...ontimeFields, customFields],
    values: [...ontimeFields, customFields],
  });

  const patchImportOptions = useSheetStore((state) => state.patchSpreadsheetImportMap);
  const stepData = useSheetStore((state) => state.stepData);

  const sheetId = useSheetStore((state) => state.sheetId);
  const [loading, setLoading] = useState<'' | 'export' | 'import'>('');

  const handleExport = async () => {
    if (!sheetId) return;
    setLoading('export');
    //await exportRundown(sheetId, importMap);
    console.log('handleImportPreview', sheetId, importMap);

    setLoading('');
  };

  const handleImportPreview = async () => {
    if (!sheetId) return;
    setLoading('import');
    console.log('handleImportPreview', sheetId, importMap);
    //await importRundownPreview(sheetId, importMap);
    setLoading('');
  };

  const isLoading = Boolean(loading);

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
