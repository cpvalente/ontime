import { useEffect } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Button, IconButton, Input, Select, Switch } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';
import { CompanionSettings } from 'ontime-types';
import { generateId } from 'ontime-utils';

import { maybeAxiosError } from '../../../../common/api/utils';
import useCompanionSettings, {
  useCompanionSettingsMutation,
} from '../../../../common/hooks-query/useCompanionSettings';
import { isKeyEscape } from '../../../../common/utils/keyEvent';
import { isIPAddress, isOnlyNumbers } from '../../../../common/utils/regex';
import * as Panel from '../PanelUtils';

import { cycles } from './integrationUtils';

import style from './IntegrationsPanel.module.css';

export default function CompanionIntegrations() {
  const { data, status } = useCompanionSettings();
  const { mutateAsync } = useCompanionSettingsMutation();

  const {
    control,
    handleSubmit,
    reset,
    register,
    setError,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<CompanionSettings>({
    mode: 'onBlur',
    defaultValues: data,
    values: data,
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  const { fields, prepend, remove } = useFieldArray({
    name: 'subscriptions',
    control,
  });

  // update form if we get new data from server
  useEffect(() => {
    if (data) {
      reset(data);
    }
  }, [data, reset]);

  const onSubmit = async (values: CompanionSettings) => {
    const parsedValues = { ...values, portOut: Number(values.portOut) };
    try {
      await mutateAsync(parsedValues);
    } catch (error) {
      setError('root', { message: maybeAxiosError(error) });
    }
  };

  const preventEscape = (event: React.KeyboardEvent) => {
    if (isKeyEscape(event)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleAddNewSubscription = () => {
    prepend({
      id: generateId(),
      cycle: 'onLoad',
      page: 1,
      row: 0,
      column: 0,
      action: 'press',
      enabled: true,
    });
  };

  const handleDeleteSubscription = (index: number) => {
    remove(index);
  };

  const canSubmit = !isSubmitting && isDirty && isValid;
  const isLoading = status === 'pending';

  return (
    <Panel.Card>
      <Panel.SubHeader>
        Companion settings
        <div className={style.flex}>
          <Button variant='ontime-ghosted' size='sm' onClick={() => reset()} isDisabled={!canSubmit}>
            Revert to saved
          </Button>
          <Button
            variant='ontime-filled'
            size='sm'
            type='submit'
            form='comapnion-form'
            isDisabled={!canSubmit}
            isLoading={isSubmitting}
          >
            Save
          </Button>
        </div>
      </Panel.SubHeader>

      <Panel.Divider />

      <Panel.Section as='form' id='comapnion-form' onSubmit={handleSubmit(onSubmit)} onKeyDown={preventEscape}>
        <Panel.Loader isLoading={isLoading} />
        {errors?.root && <Panel.Error>{errors.root.message}</Panel.Error>}
        <Panel.ListGroup>
          <Panel.ListItem>
            <Panel.Field title='Companion output' description='Control companion from Ontime' />
            <Controller
              control={control}
              name='enabledOut'
              render={({ field: { onChange, value, ref } }) => (
                <Switch variant='ontime' size='lg' isChecked={value} onChange={onChange} ref={ref} />
              )}
            />
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field title='Companion IP' description='IP address of Companion' error={errors.targetIP?.message} />
            <Input
              id='targetIP'
              placeholder='127.0.0.1'
              width='9rem'
              size='sm'
              textAlign='right'
              variant='ontime-filled'
              autoComplete='off'
              {...register('targetIP', {
                required: { value: true, message: 'Required field' },
                pattern: {
                  value: isIPAddress,
                  message: 'Invalid IP address',
                },
              })}
            />
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field
              title='Companion port'
              description='Port number of Companion'
              error={errors.portOut?.message}
            />
            <Input
              id='portOut'
              placeholder='8000'
              width='75px'
              size='sm'
              textAlign='right'
              variant='ontime-filled'
              autoComplete='off'
              {...register('portOut', {
                required: { value: true, message: 'Required field' },
                max: { value: 65535, message: 'Port must be within range 1024 - 65535' },
                min: { value: 1024, message: 'Port must be within range 1024 - 65535' },
                pattern: {
                  value: isOnlyNumbers,
                  message: 'Value should be numeric',
                },
              })}
            />
          </Panel.ListItem>
        </Panel.ListGroup>

        <Panel.Divider />

        <Panel.Title>
          Companion integrations
          <Button variant='ontime-subtle' size='sm' rightIcon={<IoAdd />} onClick={handleAddNewSubscription}>
            Add
          </Button>
        </Panel.Title>

        {fields.length > 0 && (
          <Panel.Table>
            <thead>
              <tr>
                <th>Enabled</th>
                <th className={style.fifthWidth}>Cycle</th>
                <th className={style.fifthWidth}>Page</th>
                <th className={style.fifthWidth}>Row</th>
                <th className={style.fifthWidth}>Col</th>
                <th className={style.fifthWidth}>Action</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => {
                const maybePageError = errors.subscriptions?.[index]?.page?.message;
                const maybeRowError = errors.subscriptions?.[index]?.row?.message;
                const maybeColError = errors.subscriptions?.[index]?.column?.message;
                return (
                  <tr key={field.id}>
                    <td>
                      <Switch variant='ontime' {...register(`subscriptions.${index}.enabled`)} />
                    </td>
                    <td className={style.autoWidth}>
                      <Select
                        size='sm'
                        variant='ontime'
                        className={style.fitContents}
                        {...register(`subscriptions.${index}.cycle`)}
                      >
                        {cycles.map((cycle) => (
                          <option key={cycle.id} value={cycle.value}>
                            {cycle.label}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className={style.fifthWidth}>
                      <Input
                        size='sm'
                        variant='ontime-filled'
                        autoComplete='off'
                        placeholder='1'
                        {...register(`subscriptions.${index}.page`, {
                          required: { value: true, message: 'Required field' },
                          max: { value: 99, message: 'Page must be within range 1 - 99' },
                          min: { value: 1, message: 'Page must be within range 1 - 99' },
                          pattern: {
                            value: isOnlyNumbers,
                            message: 'Value should be numeric',
                          },
                        })}
                      />
                      {maybePageError && <Panel.Error>{maybePageError}</Panel.Error>}
                    </td>
                    <td className={style.fifthWidth}>
                      <Input
                        size='sm'
                        variant='ontime-filled'
                        autoComplete='off'
                        placeholder='1'
                        {...register(`subscriptions.${index}.row`, {
                          required: { value: true, message: 'Required field' },
                          max: { value: 99, message: 'Row must be within range 1 - 99' },
                          min: { value: 0, message: 'Row must be within range 1 - 99' },
                          pattern: {
                            value: isOnlyNumbers,
                            message: 'Value should be numeric',
                          },
                        })}
                      />
                      {maybeRowError && <Panel.Error>{maybeRowError}</Panel.Error>}
                    </td>
                    <td className={style.fifthWidth}>
                      <Input
                        size='sm'
                        variant='ontime-filled'
                        autoComplete='off'
                        placeholder='1'
                        {...register(`subscriptions.${index}.column`, {
                          required: { value: true, message: 'Required field' },
                          max: { value: 99, message: 'Column must be within range 1 - 99' },
                          min: { value: 0, message: 'Column must be within range 1 - 99' },
                          pattern: {
                            value: isOnlyNumbers,
                            message: 'Value should be numeric',
                          },
                        })}
                      />
                      {maybeColError && <Panel.Error>{maybeColError}</Panel.Error>}
                    </td>
                    <td className={style.autoWidth}>
                      <Select
                        size='sm'
                        variant='ontime'
                        className={style.fitContents}
                        {...register(`subscriptions.${index}.action`)}
                      >
                        <option value='press'>PRESS</option>
                        <option value='down'>DOWN</option>
                        <option value='up'>UP</option>
                      </Select>
                    </td>
                    <td>
                      <IconButton
                        size='sm'
                        variant='ontime-ghosted'
                        color='#FA5656' // $red-500
                        icon={<IoTrash />}
                        aria-label='Delete entry'
                        onClick={() => handleDeleteSubscription(index)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Panel.Table>
        )}
      </Panel.Section>
    </Panel.Card>
  );
}
