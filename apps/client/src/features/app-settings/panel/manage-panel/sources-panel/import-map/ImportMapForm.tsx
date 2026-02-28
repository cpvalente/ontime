import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { IoAdd, IoTrash } from 'react-icons/io5';
import { ImportMap, checkRegex } from 'ontime-utils';

import Button from '../../../../../../common/components/buttons/Button';
import IconButton from '../../../../../../common/components/buttons/IconButton';
import Info from '../../../../../../common/components/info/Info';
import Input from '../../../../../../common/components/input/input/Input';
import Select from '../../../../../../common/components/select/Select';
import Tooltip from '../../../../../../common/components/tooltip/Tooltip';
import * as Panel from '../../../../panel-utils/PanelUtils';
import useGoogleSheet from '../useGoogleSheet';
import { useSheetStore } from '../useSheetStore';

import { NamedImportMap, convertToImportMap, getPersistedOptions, persistImportMap } from './importMapUtils';

import style from '../SourcesPanel.module.scss';

interface ImportMapFormProps {
  hasErrors: boolean;
  isSpreadsheet: boolean;
  onCancel: () => void;
  onSubmitExport: (importMap: ImportMap) => Promise<void>;
  onSubmitImport: (importMap: ImportMap) => Promise<void>;
}

export default function ImportMapForm({
  hasErrors,
  isSpreadsheet,
  onCancel,
  onSubmitExport,
  onSubmitImport,
}: ImportMapFormProps) {
  const namedImportMap = getPersistedOptions();
  const { revoke } = useGoogleSheet();
  const {
    control,
    handleSubmit,
    register,
    setValue,
    watch,
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

  // Set first sheet as default worksheet when 'event schedule' sheet is not there
  useEffect(() => {
    if (!worksheetNames || worksheetNames.length === 0) return;
    if (!worksheetNames.includes(namedImportMap.Worksheet)) {
      setValue('Worksheet', worksheetNames[0], { shouldValidate: true, shouldDirty: true });
    }
  }, [worksheetNames, setValue, namedImportMap.Worksheet]);

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
        <Panel.InlineElements>
          {!isSpreadsheet && (
            <Tooltip
              text='Revoke the google authentication'
              render={<Button />}
              onClick={handleRevoke}
              disabled={isLoading}
            >
              Revoke
            </Tooltip>
          )}
          <Button onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          {!isSpreadsheet && (
            <Button
              variant='primary'
              onClick={handleSubmit(handleExport)}
              disabled={!canSubmitGSheet}
              loading={loading === 'export'}
            >
              Export
            </Button>
          )}
          <Button
            variant='primary'
            onClick={handleSubmit(handleImportPreview)}
            disabled={!canSubmit}
            loading={loading === 'import'}
          >
            Import preview
          </Button>
        </Panel.InlineElements>
      </Panel.Title>
      <Info>
        Match your spreadsheet columns to Ontime fields. <br />
        You can also add Custom Fields by providing a name for Ontime and the spreadsheet column name.
      </Info>
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
                    <Select
                      id={importName as string}
                      value={watch(label as keyof NamedImportMap) as string}
                      onValueChange={(value: string | null) => {
                        if (value === null) return;
                        setValue(label as keyof NamedImportMap, value, { shouldDirty: true });
                      }}
                      options={worksheetNames?.map((name) => ({ value: name, label: name })) || []}
                    />
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
                    fluid
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
                    maxLength={25}
                    fluid
                    defaultValue={ontimeName}
                    placeholder='Name of the field as shown in Ontime'
                    {...register(`custom.${index}.ontimeName`, {
                      validate: (value) => {
                        if (!checkRegex.isAlphanumericWithSpace(value))
                          return 'Only alphanumeric characters and space are allowed';
                        return true;
                      },
                    })}
                  />
                  {maybeOntimeError && <Panel.Error>{maybeOntimeError}</Panel.Error>}
                </td>
                <td>
                  <Input
                    maxLength={25}
                    fluid
                    defaultValue={importName}
                    placeholder='Name of the column in the spreadsheet'
                    {...register(`custom.${index}.importName`)}
                  />
                </td>
                <td className={style.singleActionCell}>
                  <IconButton
                    variant='ghosted-destructive'
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
            <Panel.InlineElements as='td' align='end'>
              <Button onClick={addCustomImport}>
                Add custom field <IoAdd />
              </Button>
            </Panel.InlineElements>
            <td />
          </tr>
        </tbody>
      </Panel.Table>
      <Panel.Error>{stepData.worksheet.error}</Panel.Error>
    </Panel.Section>
  );
}
