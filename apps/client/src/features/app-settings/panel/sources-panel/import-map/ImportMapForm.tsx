import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Button, IconButton, Input, Select, Tooltip } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';
import { ImportMap } from 'ontime-utils';

import useCustomFields from '../../../../../common/hooks-query/useCustomFields';
import { isAlphanumeric } from '../../../../../common/utils/regex';
import * as Panel from '../../PanelUtils';
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
    mode: 'onBlur',
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
            <Tooltip label='Revoke the google authentication'>
              <Button variant='ontime-subtle' size='sm' onClick={handleRevoke} isDisabled={isLoading}>
                Revoke
              </Button>
            </Tooltip>
          )}
          <Button variant='ontime-subtle' size='sm' onClick={onCancel} isDisabled={isLoading}>
            Cancel
          </Button>
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
            if (label === 'Worksheet') {
              return (
                <tr key={importName as string}>
                  <td>{label}</td>
                  <td>
                    <Select
                      variant='ontime'
                      id={importName as string}
                      size='sm'
                      {...register(label as keyof NamedImportMap)}
                    >
                      {worksheetNames?.map((name) => {
                        return (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        );
                      })}
                    </Select>
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
                  <IconButton
                    size='sm'
                    variant='ontime-ghosted'
                    color='#FA5656' // $red-500
                    icon={<IoTrash />}
                    aria-label='Delete entry'
                    onClick={() => deleteCustomImport(index)}
                  />
                </td>
              </tr>
            );
          })}
          <tr>
            <td />
            <td className={style.buttonRow} colSpan={99}>
              <Button size='sm' variant='ontime-subtle' rightIcon={<IoAdd />} onClick={addCustomImport}>
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
