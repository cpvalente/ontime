import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Button, ActionIcon, Input } from '@mantine/core';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';
import { ImportMap } from 'ontime-utils';

import { isAlphanumeric } from '../../../../../common/utils/regex';
import * as Panel from '../../PanelUtils';
import { useSheetStore } from '../useSheetStore';

import { convertToImportMap, getPersistedOptions, NamedImportMap, persistImportMap } from './importMapUtils';

import style from '../SourcesPanel.module.scss';

interface ImportMapFormProps {
  isSpreadsheet?: boolean;
  onCancel: () => void;
  onSubmitExport: (importMap: ImportMap) => Promise<void>;
  onSubmitImport: (importMap: ImportMap) => Promise<void>;
}

export default function ImportMapForm(props: ImportMapFormProps) {
  const { isSpreadsheet, onCancel, onSubmitExport, onSubmitImport } = props;
  const namedImportMap = getPersistedOptions();

  const {
    control,
    handleSubmit,
    register,
    formState: { errors, isValid },
  } = useForm<NamedImportMap>({
    mode: 'onBlur',
    defaultValues: namedImportMap,
    values: namedImportMap,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'custom',
  });

  const stepData = useSheetStore((state) => state.stepData);

  const [loading, setLoading] = useState<'' | 'export' | 'import'>('');

  const handleExport = async (values: NamedImportMap) => {
    setLoading('export');
    const importMap = convertToImportMap(values);

    await onSubmitExport(importMap);
    setLoading('');
  };

  const handleImportPreview = async (values: NamedImportMap) => {
    setLoading('import');
    const importMap = convertToImportMap(values);
    persistImportMap(values);
    await onSubmitImport(importMap);
    setLoading('');
  };

  const deleteCustomImport = (index: number) => {
    remove(index);
  };

  const addCustomImport = () => {
    append({});
  };

  const isLoading = Boolean(loading);
  const canSubmitSpreadsheet = isSpreadsheet && !isLoading;
  const canSubmitGSheet = !isLoading;
  const canSubmit = isValid && (canSubmitSpreadsheet || canSubmitGSheet);

  return (
    <Panel.Section as='form' id='import-map'>
      <Panel.Title>
        Import options
        <div className={style.buttonRow}>
          <Button variant='ontime-subtle' size='sm' onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          {!isSpreadsheet && (
            <Button
              variant='ontime-filled'
              size='sm'
              onClick={handleSubmit(handleExport)}
              disabled={!canSubmitGSheet}
              loading={loading === 'export'}
            >
              Export
            </Button>
          )}
          <Button
            variant='ontime-filled'
            size='sm'
            onClick={handleSubmit(handleImportPreview)}
            disabled={!canSubmit}
            loading={loading === 'import'}
          >
            Import preview
          </Button>
        </div>
      </Panel.Title>
      <Panel.Table>
        <thead>
          <tr>
            <th>Ontime field</th>
            <th>From spreadsheet name</th>
            <th className={style.singleActionCell} />
          </tr>
        </thead>
        <tbody>
          {Object.entries(namedImportMap).map(([label, importName]) => {
            if (label === 'custom') {
              return null;
            }
            return (
              <tr key={importName as string}>
                <td>{label}</td>
                <td>
                  <Input
                    id={importName as string}
                    size='sm'
                    variant='ontime-filled'
                    autoComplete='off'
                    maxLength={25}
                    defaultValue={importName as string}
                    placeholder='Use default column name'
                    {...register(label as keyof NamedImportMap)}
                  />
                </td>
                <td className={style.singleActionCell} />
              </tr>
            );
          })}
          {fields.map((field, index) => {
            const ontimeName = field.ontimeName;
            const importName = field.importName;
            const maybeOntimeError = errors.custom?.[index]?.ontimeName?.message;
            const key = `custom.${index}.ontimeName`;
            return (
              <tr key={key}>
                <td>
                  <Input
                    size='sm'
                    variant='ontime-filled'
                    autoComplete='off'
                    maxLength={25}
                    defaultValue={ontimeName}
                    placeholder='Name of the field as shown in Ontime'
                    {...register(`custom.${index}.ontimeName`, {
                      pattern: {
                        value: isAlphanumeric,
                        message: 'Custom field name must be alphanumeric',
                      },
                    })}
                  />
                  {maybeOntimeError && <Panel.Error>{maybeOntimeError}</Panel.Error>}
                </td>
                <td>
                  <Input
                    size='sm'
                    variant='ontime-filled'
                    autoComplete='off'
                    maxLength={25}
                    defaultValue={importName}
                    placeholder='Name of the column in the spreadsheet'
                    {...register(`custom.${index}.importName`)}
                  />
                </td>
                <td className={style.singleActionCell}>
                  <ActionIcon
                    size='sm'
                    variant='ontime-ghosted'
                    color='#FA5656' // $red-500
                    aria-label='Delete entry'
                    onClick={() => deleteCustomImport(index)}
                  ><IoTrash /></ActionIcon>
                </td>
              </tr>
            );
          })}
          <tr>
            <td />
            <td className={style.buttonRow} colSpan={99}>
              <Button size='sm' variant='ontime-subtle' rightSection={<IoAdd />} onClick={addCustomImport}>
                Add custom field
              </Button>
            </td>
            <td />
          </tr>
        </tbody>
      </Panel.Table>
      <Panel.Error>{stepData.worksheet.error}</Panel.Error>
    </Panel.Section>
  );
}
