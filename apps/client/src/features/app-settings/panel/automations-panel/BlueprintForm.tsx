import { useEffect, useMemo } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Button, IconButton, Input, Radio, RadioGroup, Select } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';
import {
  AutomationBlueprint,
  AutomationBlueprintDTO,
  CustomFields,
  HTTPOutput,
  isHTTPOutput,
  isOSCOutput,
  OntimeEvent,
  OSCOutput,
} from 'ontime-types';

import { addBlueprint, editBlueprint, testOutput } from '../../../../common/api/automation';
import { maybeAxiosError } from '../../../../common/api/utils';
import Tag from '../../../../common/components/tag/Tag';
import useAutomationSettings from '../../../../common/hooks-query/useAutomationSettings';
import useCustomFields from '../../../../common/hooks-query/useCustomFields';
import { preventEscape } from '../../../../common/utils/keyEvent';
import { isIPAddress, startsWithHttp } from '../../../../common/utils/regex';
import * as Panel from '../../panel-utils/PanelUtils';

import style from './BlueprintForm.module.scss';

interface BlueprintFormProps {
  blueprint: AutomationBlueprintDTO | AutomationBlueprint;
  onClose: () => void;
}

export default function BlueprintForm(props: BlueprintFormProps) {
  const { blueprint, onClose } = props;
  const isEdit = isBlueprint(blueprint);
  const { data } = useCustomFields();
  const { refetch } = useAutomationSettings();
  const fieldList = useMemo(() => makeFieldList(data), [data]);

  const {
    control,
    handleSubmit,
    getValues,
    register,
    setError,
    setFocus,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<AutomationBlueprintDTO>({
    mode: 'onChange',
    defaultValues: {
      title: blueprint?.title ?? '',
      filterRule: blueprint?.filterRule ?? 'all',
      filters: blueprint?.filters ?? [],
      outputs: blueprint?.outputs ?? [],
    },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  const {
    fields: fieldFilters,
    append: appendFilter,
    remove: removeFilter,
  } = useFieldArray({
    name: 'filters',
    control,
  });

  const {
    fields: fieldOutputs,
    append: appendOutput,
    remove: removeOutput,
  } = useFieldArray({
    name: 'outputs',
    control,
  });

  // give initial focus to the title field
  useEffect(() => {
    setFocus('title');
  }, [setFocus]);

  const handleAddNewFilter = () => {
    appendFilter({ field: '', operator: 'equals', value: '' });
  };

  const handleAddNewOSCOutput = () => {
    // @ts-expect-error -- we dont want to pass a port to the new object
    appendOutput({ type: 'osc', targetIP: '', targetPort: undefined, address: '', args: '' });
  };

  const handleAddNewHTTPOutput = () => {
    appendOutput({ type: 'http', url: '' });
  };

  const handleTestOSCOutput = async (index: number) => {
    try {
      const values = getValues(`outputs.${index}`) as OSCOutput;
      if (!values.targetIP || !values.targetPort || !values.address || !values.args) {
        return;
      }
      await testOutput({
        type: 'osc',
        targetIP: values.targetIP,
        targetPort: values.targetPort,
        address: values.address,
        args: values.args,
      });
    } catch (_error) {
      /** we dont handle errors here, users should use the network tab */
    }
  };

  const handleTestHTTPOutput = async (index: number) => {
    try {
      const values = getValues(`outputs.${index}`) as HTTPOutput;
      if (!values.url) {
        return;
      }
      await testOutput({
        type: 'http',
        url: values.url,
      });
    } catch (_error) {
      /** we dont handle errors here, users should use the network tab */
    }
  };

  const onSubmit = async (values: AutomationBlueprintDTO) => {
    if (isBlueprint(blueprint)) {
      await handleEdit(blueprint.id, { id: blueprint.id, ...values });
    } else {
      await handleCreate(values);
    }
    refetch();

    async function handleEdit(id: string, values: AutomationBlueprint) {
      try {
        await editBlueprint(id, values);
        onClose();
      } catch (error) {
        setError('root', { message: maybeAxiosError(error) });
      }
    }

    async function handleCreate(values: AutomationBlueprintDTO) {
      try {
        await addBlueprint(values);
        onClose();
      } catch (error) {
        setError('root', { message: maybeAxiosError(error) });
      }
    }
  };

  const canSubmit = !isSubmitting && isDirty && isValid;

  return (
    <Panel.Indent
      as='form'
      name='blueprint-form'
      onSubmit={handleSubmit(onSubmit)}
      className={style.outerColumn}
      onKeyDown={(event) => preventEscape(event, onClose)}
    >
      <Panel.SubHeader>{isEdit ? 'Edit blueprint' : 'Create blueprint'}</Panel.SubHeader>
      <div className={style.innerSection}>
        <h3>Blueprint options</h3>
        <div className={style.titleSection}>
          <label>
            Title
            <Input
              {...register('title', { required: { value: true, message: 'Required field' } })}
              variant='ontime-filled'
              size='sm'
              placeholder='Load preset'
              autoComplete='off'
            />
          </label>
        </div>
      </div>

      <div className={style.innerSection}>
        <h3>Filters</h3>
        <div className={style.ruleSection}>
          <label>
            Trigger outputs if
            <Controller
              name='filterRule'
              control={control}
              render={({ field }) => (
                <RadioGroup {...field} size='sm' className={style.matchRadio} variant='ontime'>
                  <Radio value='all'>All filters pass</Radio>
                  <Radio value='any'>Any filter passes</Radio>
                </RadioGroup>
              )}
            />
          </label>
          {fieldFilters.map((field, index) => (
            <div key={field.id} className={style.filterSection}>
              <label>
                Runtime data source
                <Select
                  {...register(`filters.${index}.field`, { required: { value: true, message: 'Required field' } })}
                  size='sm'
                  variant='ontime'
                  placeholder='Select a field'
                >
                  {fieldList.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                <Panel.Error>{errors.filters?.[index]?.field?.message}</Panel.Error>
              </label>
              <label>
                Matching condition
                <Select
                  {...register(`filters.${index}.operator`, { required: { value: true, message: 'Required field' } })}
                  size='sm'
                  variant='ontime'
                  placeholder='Select an operator'
                >
                  <option value='equals'>equals</option>
                  <option value='not_equals'>not equals</option>
                  <option value='contains'>contains</option>
                  <option value='greater_than'>greater than</option>
                  <option value='less_than'>less than</option>
                </Select>
                <Panel.Error>{errors.filters?.[index]?.operator?.message}</Panel.Error>
              </label>
              <label>
                Value to match
                <Input
                  {...register(`filters.${index}.value`)}
                  variant='ontime-filled'
                  size='sm'
                  placeholder='<no value>'
                  autoComplete='off'
                />
              </label>
              <IconButton
                aria-label='Delete'
                icon={<IoTrash />}
                variant='ontime-ghosted'
                size='sm'
                color='#FA5656' // $red-500
                onClick={() => removeFilter(index)}
                isDisabled={false}
                isLoading={false}
              />
            </div>
          ))}
          <div>
            <Button
              variant='ontime-subtle'
              size='sm'
              type='submit'
              rightIcon={<IoAdd />}
              onClick={handleAddNewFilter}
              isDisabled={false}
              isLoading={false}
            >
              Add filter
            </Button>
          </div>
        </div>
      </div>

      <div className={style.innerColumn}>
        <h3>Outputs</h3>
        {fieldOutputs.map((output, index) => {
          if (isOSCOutput(output)) {
            const rowErrors = errors.outputs?.[index] as
              | {
                  targetIP?: { message?: string };
                  targetPort?: { message?: string };
                  address?: { message?: string };
                  args?: { message?: string };
                }
              | undefined;

            return (
              <div key={output.id} className={style.outputCard}>
                <div className={style.outputTag}>
                  <Tag>OSC</Tag>
                </div>
                <div className={style.oscSection}>
                  <label>
                    Target IP
                    <Input
                      {...register(`outputs.${index}.targetIP`, {
                        required: { value: true, message: 'Required field' },
                        pattern: {
                          value: isIPAddress,
                          message: 'Invalid IP address',
                        },
                      })}
                      variant='ontime-filled'
                      size='sm'
                      placeholder='127.0.0.1'
                      autoComplete='off'
                    />
                    <Panel.Error>{rowErrors?.targetIP?.message}</Panel.Error>
                  </label>
                  <label>
                    Target Port
                    <Input
                      {...register(`outputs.${index}.targetPort`, {
                        required: { value: true, message: 'Required field' },
                        setValueAs: (value) => (value === '' ? 0 : Number(value)),
                        max: { value: 65535, message: 'Port must be within range 1024 - 65535' },
                        min: { value: 1024, message: 'Port must be within range 1024 - 65535' },
                      })}
                      variant='ontime-filled'
                      size='sm'
                      type='number'
                      maxLength={5}
                      placeholder='8000'
                      autoComplete='off'
                    />
                    <Panel.Error>{rowErrors?.targetPort?.message}</Panel.Error>
                  </label>
                  <label>
                    Address
                    <Input
                      {...register(`outputs.${index}.address`)}
                      variant='ontime-filled'
                      size='sm'
                      placeholder='/cue/start'
                      autoComplete='off'
                    />
                    <Panel.Error>{rowErrors?.address?.message}</Panel.Error>
                  </label>
                  <label>
                    Parameters
                    <Input
                      {...register(`outputs.${index}.args`)}
                      variant='ontime-filled'
                      size='sm'
                      placeholder='1'
                      autoComplete='off'
                    />
                    <Panel.Error>{rowErrors?.args?.message}</Panel.Error>
                  </label>
                  <Panel.InlineElements relation='inner'>
                    <Button size='sm' variant='ontime-ghosted' onClick={() => handleTestOSCOutput(index)}>
                      Test
                    </Button>
                    <IconButton
                      aria-label='Delete'
                      icon={<IoTrash />}
                      variant='ontime-ghosted'
                      size='sm'
                      onClick={() => removeOutput(index)}
                      color='#FA5656' // $red-500
                      isDisabled={false}
                      isLoading={false}
                    />
                  </Panel.InlineElements>
                </div>
              </div>
            );
          }
          if (isHTTPOutput(output)) {
            const rowErrors = errors.outputs?.[index] as
              | {
                  url?: { message?: string };
                }
              | undefined;
            return (
              <div key={output.id} className={style.outputCard}>
                <div className={style.outputTag}>
                  <Tag>HTTP</Tag>
                </div>
                <div className={style.httpSection}>
                  <label>
                    Target URL
                    <Input
                      {...register(`outputs.${index}.url`, {
                        required: { value: true, message: 'Required field' },
                        pattern: {
                          value: startsWithHttp,
                          message: 'HTTP messages should target http:// or https://',
                        },
                      })}
                      variant='ontime-filled'
                      size='sm'
                      placeholder='http://127.0.0.1/start/1'
                      autoComplete='off'
                    />
                    <Panel.Error>{rowErrors?.url?.message}</Panel.Error>
                  </label>
                  <Panel.InlineElements relation='inner'>
                    <Button size='sm' variant='ontime-ghosted' onClick={() => handleTestHTTPOutput(index)}>
                      Test
                    </Button>
                    <IconButton
                      aria-label='Delete'
                      icon={<IoTrash />}
                      variant='ontime-ghosted'
                      size='sm'
                      onClick={() => removeOutput(index)}
                      color='#FA5656' // $red-500
                      isDisabled={false}
                      isLoading={false}
                    />
                  </Panel.InlineElements>
                </div>
              </div>
            );
          }
          // there should be no other output types
          return null;
        })}
        <Panel.InlineElements relation='inner'>
          <Button
            variant='ontime-subtle'
            rightIcon={<IoAdd />}
            size='sm'
            onClick={handleAddNewOSCOutput}
            isDisabled={false}
            isLoading={false}
          >
            OSC
          </Button>
          <Button
            variant='ontime-subtle'
            rightIcon={<IoAdd />}
            size='sm'
            onClick={handleAddNewHTTPOutput}
            isDisabled={false}
            isLoading={false}
          >
            HTTP
          </Button>
        </Panel.InlineElements>
      </div>

      <Panel.InlineElements align='end'>
        {errors?.root && <Panel.Error>{errors.root.message}</Panel.Error>}
        <Button variant='ontime-subtle' size='sm' onClick={onClose}>
          Cancel
        </Button>
        <Button variant='ontime-filled' size='sm' type='submit' isDisabled={!canSubmit} isLoading={isSubmitting}>
          Save
        </Button>
      </Panel.InlineElements>
    </Panel.Indent>
  );
}

/**
 * We use this guard to find out if the form is receiving an existing blueprint or creating a DTO
 * We do this by checking whether an ID has been generated
 */
function isBlueprint(blueprint: AutomationBlueprintDTO | AutomationBlueprint): blueprint is AutomationBlueprint {
  return Object.hasOwn(blueprint, 'id');
}

export const staticSelectProperties = [
  { value: 'id', label: 'ID' },
  { value: 'title', label: 'Title' },
  { value: 'cue', label: 'Cue' },
  { value: 'countToEnd', label: 'Count to end' },
  { value: 'isPublic', label: 'Is public' },
  { value: 'skip', label: 'Skip' },
  { value: 'note', label: 'Note' },
  { value: 'colour', label: 'Colour' },
  { value: 'endAction', label: 'End action' },
  { value: 'timerType', label: 'Timer type' },
  { value: 'timeWarning', label: 'Time warning' },
  { value: 'timeDanger', label: 'Time danger' },
];

type SelectableField = {
  value: keyof OntimeEvent | string; // string for custom fields
  label: string;
};

function makeFieldList(customFields: CustomFields): SelectableField[] {
  return [
    ...staticSelectProperties,
    ...Object.entries(customFields).map(([key, { label }]) => ({ value: key, label: `Custom: ${label}` })),
  ];
}
