import { useEffect } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Button, IconButton, Input, Select, Switch } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';
import { OSCSettings } from 'ontime-types';
import { generateId } from 'ontime-utils';

import { maybeAxiosError } from '../../../../common/api/utils';
import useOscSettings, { useOscSettingsMutation } from '../../../../common/hooks-query/useOscSettings';
import { isKeyEscape } from '../../../../common/utils/keyEvent';
import { isASCII, isASCIIorEmpty, isIPAddress, isOnlyNumbers, startsWithSlash } from '../../../../common/utils/regex';
import * as Panel from '../../panel-utils/PanelUtils';

import { cycles } from './integrationUtils';

import style from './IntegrationsPanel.module.css';

export default function OscIntegrations() {
  const { data, status } = useOscSettings();
  const { mutateAsync } = useOscSettingsMutation();

  const {
    control,
    handleSubmit,
    reset,
    register,
    setError,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<OSCSettings>({
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

  const onSubmit = async (values: OSCSettings) => {
    if (values.portIn === values.portOut) {
      setError('portIn', { message: 'OSC IN and OUT Ports cant be the same' });
      return;
    }

    const parsedValues = { ...values, portIn: Number(values.portIn), portOut: Number(values.portOut) };
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
      address: '',
      payload: '',
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
        OSC settings
        <div className={style.flex}>
          <Button variant='ontime-ghosted' size='sm' onClick={() => reset()} isDisabled={!canSubmit}>
            Revert to saved
          </Button>
          <Button
            variant='ontime-filled'
            size='sm'
            type='submit'
            form='osc-form'
            isDisabled={!canSubmit}
            isLoading={isSubmitting}
          >
            Save
          </Button>
        </div>
      </Panel.SubHeader>

      <Panel.Divider />

      <Panel.Section as='form' id='osc-form' onSubmit={handleSubmit(onSubmit)} onKeyDown={preventEscape}>
        <Panel.Loader isLoading={isLoading} />
        <Panel.Title>General OSC settings</Panel.Title>
        {errors?.root && <Panel.Error>{errors.root.message}</Panel.Error>}
        <Panel.ListGroup>
          <Panel.ListItem>
            <Panel.Field title='OSC input' description='Allow control of Ontime through OSC' />
            <Controller
              control={control}
              name='enabledIn'
              render={({ field: { onChange, value, ref } }) => (
                <Switch variant='ontime' size='lg' isChecked={value} onChange={onChange} ref={ref} />
              )}
            />
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field
              title='Listen on port'
              description='Port for incoming OSC. Default: 8888'
              error={errors.portIn?.message}
            />
            <Input
              id='portIn'
              placeholder='8888'
              width='5rem'
              maxLength={5}
              size='sm'
              textAlign='right'
              variant='ontime-filled'
              type='number'
              autoComplete='off'
              {...register('portIn', {
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
        <Panel.ListGroup>
          <Panel.ListItem>
            <Panel.Field title='OSC output' description='Provide feedback from Ontime with OSC' />
            <Controller
              control={control}
              name='enabledOut'
              render={({ field: { onChange, value, ref } }) => (
                <Switch variant='ontime' size='lg' isChecked={value} onChange={onChange} ref={ref} />
              )}
            />
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field
              title='OSC target IP'
              description='IP address Ontime will send OSC messages to'
              error={errors.targetIP?.message}
            />
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
              title='OSC target port'
              description='Port number Ontime will send OSC messages to'
              error={errors.portOut?.message}
            />
            <Input
              id='portOut'
              placeholder='8888'
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
          OSC integrations
          <Button variant='ontime-subtle' size='sm' rightIcon={<IoAdd />} onClick={handleAddNewSubscription}>
            Add
          </Button>
        </Panel.Title>

        {fields.length > 0 && (
          <Panel.Table>
            <thead>
              <tr>
                <th>Enabled</th>
                <th>Cycle</th>
                <th className={style.halfWidth}>Address</th>
                <th className={style.halfWidth}>Arguments</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => {
                const maybeAddressError = errors.subscriptions?.[index]?.address?.message;
                const maybePayloadError = errors.subscriptions?.[index]?.payload?.message;
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
                    <td className={style.halfWidth}>
                      <Input
                        key={field.id}
                        size='sm'
                        variant='ontime-filled'
                        autoComplete='off'
                        placeholder='/from-ontime/'
                        {...register(`subscriptions.${index}.address`, {
                          required: { value: true, message: 'Required field' },
                          validate: {
                            oscStartsWithSlash: (value) =>
                              startsWithSlash.test(value) || 'OSC address should start with a forward slash',
                            oscStringIsAscii: (value) =>
                              isASCII.test(value) || 'OSC address only allow ASCII characters',
                          },
                        })}
                      />
                      {maybeAddressError && <Panel.Error>{maybeAddressError}</Panel.Error>}
                    </td>
                    <td className={style.halfWidth}>
                      <Input
                        key={field.id}
                        size='sm'
                        variant='ontime-filled'
                        autoComplete='off'
                        placeholder='{{timer.current}}'
                        {...register(`subscriptions.${index}.payload`, {
                          validate: {
                            oscStringIsAscii: (value) =>
                              isASCIIorEmpty.test(value) || 'OSC arguments only allow ASCII characters',
                          },
                        })}
                      />
                      {maybePayloadError && <Panel.Error>{maybePayloadError}</Panel.Error>}
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
