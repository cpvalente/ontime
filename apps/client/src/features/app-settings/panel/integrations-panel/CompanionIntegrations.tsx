import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button, Input, Switch } from '@chakra-ui/react';
import { OSCSettings } from 'ontime-types';

import { maybeAxiosError } from '../../../../common/api/utils';
import useOscSettings, { useOscSettingsMutation } from '../../../../common/hooks-query/useOscSettings';
import { isKeyEscape } from '../../../../common/utils/keyEvent';
import { isIPAddress, isOnlyNumbers } from '../../../../common/utils/regex';
import * as Panel from '../PanelUtils';

import style from './IntegrationsPanel.module.css';

export default function CompanionIntegrations() {
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
      </Panel.Section>
    </Panel.Card>
  );
}
