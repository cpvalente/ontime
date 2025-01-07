import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { IoAdd } from 'react-icons/io5';
import { IoTrash } from 'react-icons/io5';
import { Input } from '@chakra-ui/react';
import { ImportMap, isAlphanumericWithSpace } from 'ontime-utils';

import { Button } from '../../../../../common/components/ui/button';
import { IconButton } from '../../../../../common/components/ui/icon-button';
import { NativeSelectField, NativeSelectRoot } from '../../../../../common/components/ui/native-select';
import { Tooltip } from '../../../../../common/components/ui/tooltip';
import * as Panel from '../../../panel-utils/PanelUtils';
import useGoogleSheet from '../useGoogleSheet';
import { useSheetStore } from '../useSheetStore';

import { convertToImportMap, getPersistedOptions, NamedImportMap, persistImportMap } from './importMapUtils';

import style from '../SourcesPanel.module.scss';

interface ImportMapFormProps {
  hasErrors: boolean;
  isSpreadsheet: boolean;
  onCancel: () => void;
  onSubmitExport: (importMap: ImportMap) => Promise<void>;
  onSubmitImport: (importMap: ImportMap) => Promise<void>;
}

export default function ImportMapForm(props: ImportMapFormProps) {
  const { hasErrors, isSpreadsheet, onCancel, onSubmitExport, onSubmitImport } = props;
  const namedImportMap = getPersistedOptions();
  const { revoke } = useGoogleSheet();
  const {
    control,
    handleSubmit,
    register,
    formState: { errors, isValid },
  } = useForm<NamedImportMap>({
    mode: 'onChange',
    defaultValues: namedImportMap,
    values: namedImportMap,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'custom',
  });

  const stepData = useSheetStore((state) => state.stepData);
  const worksheetNames = useSheetStore((state) => state.worksheetNames);

  const [loading, setLoading] = useState<'' | 'export' | 'import'>('');

  const handleExport = async (values: NamedImportMap) => {
    setLoading('export');
    const importMap = convertToImportMap(values);

    await onSubmitExport(importMap);
    setLoading('');
  };

  const handleRevoke = async () => {
    await revoke();
    onCancel();
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
  const canSubmitGSheet = !isLoading && !stepData.worksheet.error;
  const canSubmit = !hasErrors && isValid && (canSubmitSpreadsheet || canSubmitGSheet);

  return (
    <Panel.Section as='form' id='import-map'>
      <Panel.Title>
        Import options
        <div className={style.buttonRow}>
          {!isSpreadsheet && (
            <Tooltip content='Revoke the google authentication'>
              <Button variant='ontime-subtle' size='sm' onClick={handleRevoke} disabled={isLoading}>
                Revoke
              </Button>
            </Tooltip>
          )}
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
            <th>Column name in spreadsheet</th>
            <th className={style.singleActionCell} />
          </tr>
        </thead>
        <tbody>
          {Object.entries(namedImportMap).map(([label, importName]) => {
            if (label === 'custom') {
              return null;
            }
            if (label === 'Worksheet') {
              return (
                <tr key={importName as string}>
                  <td>{label}</td>
                  <td>
                    <NativeSelectRoot size='sm'>
                      <NativeSelectField id={importName as string} {...register(label as keyof NamedImportMap)}>
                        {worksheetNames?.map((name) => {
                          return (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          );
                        })}
                      </NativeSelectField>
                    </NativeSelectRoot>
                  </td>
                  <td className={style.singleActionCell} />
                </tr>
              );
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
                      validate: (value) => {
                        if (!isAlphanumericWithSpace(value))
                          return 'Only alphanumeric characters and space are allowed';
                        return true;
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
                  <IconButton
                    size='sm'
                    variant='ontime-ghosted'
                    color='#FA5656' // $red-500
                    aria-label='Delete entry'
                    onClick={() => deleteCustomImport(index)}
                  >
                    <IoTrash />
                  </IconButton>
                </td>
              </tr>
            );
          })}
          <tr>
            <td />
            <td className={style.buttonRow} colSpan={99}>
              <Button size='sm' variant='ontime-subtle' onClick={addCustomImport}>
                Add custom field <IoAdd />
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
