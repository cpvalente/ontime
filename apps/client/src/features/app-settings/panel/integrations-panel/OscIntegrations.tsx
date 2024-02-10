import { useFieldArray, useForm } from 'react-hook-form';
import { Button, IconButton, Input, Select, Switch } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';
import { OSCSettings } from 'ontime-types';
import { generateId } from 'ontime-utils';

import { maybeAxiosError } from '../../../../common/api/apiUtils';
import useOscSettings, { useOscSettingsMutation } from '../../../../common/hooks-query/useOscSettings';
import { isKeyEscape } from '../../../../common/utils/keyEvent';
import { isIPAddress, isOnlyNumbers, startsWithSlash } from '../../../../common/utils/regex';
import * as Panel from '../PanelUtils';

import { cycles } from './IntegrationsPanel';

import style from './IntegrationsPanel.module.css';

export default function OscIntegrations() {
  const { data } = useOscSettings();
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

  const { fields, append, remove } = useFieldArray({
    name: 'subscriptions',
    control,
  });

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
    append({
      id: generateId(),
      cycle: 'onLoad',
      message: '',
      enabled: false,
    });
  };

  const handleDeleteSubscription = (index: number) => {
    remove(index);
  };

  const canSubmit = !isSubmitting && isDirty && isValid;

  return (
    <Panel.Section onKeyDown={preventEscape}>
      <Panel.Section as='form' onSubmit={handleSubmit(onSubmit)}>
        <Panel.SubHeader>
          Open Sound Control integrations
          <div className={style.flex}>
            <Button variant='ontime-ghosted' size='sm' onClick={() => reset()} isDisabled={!canSubmit}>
              Reset
            </Button>
            <Button variant='ontime-filled' size='sm' type='submit' isDisabled={!canSubmit} isLoading={isSubmitting}>
              Save changes
            </Button>
          </div>
        </Panel.SubHeader>
        <Panel.Error>{errors.root?.message}</Panel.Error>
        <Panel.ListGroup>
          <Panel.ListItem>
            <Panel.Field title='OSC input' description='Allow control of Ontime through OSC' />
            <Switch variant='ontime' size='lg' {...register('enabledIn')} />
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
            <Switch variant='ontime' size='lg' {...register('enabledOut')} />
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
      </Panel.Section>

      <Panel.Card>
        <Panel.SubHeader>
          OSC Integration
          <Button variant='ontime-subtle' size='sm' rightIcon={<IoAdd />} onClick={handleAddNewSubscription}>
            New
          </Button>
        </Panel.SubHeader>
        <Panel.Table>
          <thead>
            <tr>
              <th>Enabled</th>
              <th>Cycle</th>
              <th className={style.fullWidth}>Message</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => {
              // @ts-expect-error -- not sure why it is not finding the type, it is ok
              const maybeError = errors.subscriptions?.[index]?.message?.message;
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
                  <td className={style.fullWidth}>
                    <Input
                      key={field.id}
                      size='sm'
                      variant='ontime-filled'
                      placeholder='/from-ontime/{{timer.current}}'
                      autoComplete='off'
                      {...register(`subscriptions.${index}.message`, {
                        required: { value: true, message: 'Required field' },
                        pattern: {
                          value: startsWithSlash,
                          message: 'OSC messages should start with a forward slash',
                        },
                      })}
                    />
                    {maybeError && <Panel.Error>{maybeError}</Panel.Error>}
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
      </Panel.Card>
    </Panel.Section>
  );
}
