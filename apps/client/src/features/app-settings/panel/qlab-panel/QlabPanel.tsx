import { Controller, useForm } from 'react-hook-form';
import { Button, Input, Switch } from '@chakra-ui/react';
import type { QlabSettings } from 'ontime-types';

import { maybeAxiosError } from '../../../../common/api/utils';
import useQlabSettings, { useQlabSettingsMutation } from '../../../../common/hooks-query/useQlabSettings';
import { useRuntimeStore } from '../../../../common/stores/runtime';
import { preventEscape } from '../../../../common/utils/keyEvent';
import * as Panel from '../../panel-utils/PanelUtils';

export default function QlabPanel() {
  const { data } = useQlabSettings();
  const { mutateAsync } = useQlabSettingsMutation();
  const qlabState = useRuntimeStore((state) => state.qlab);

  const {
    control,
    handleSubmit,
    reset,
    register,
    setError,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<QlabSettings>({
    mode: 'onChange',
    defaultValues: data,
    values: data,
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  const onSubmit = async (formData: QlabSettings) => {
    try {
      await mutateAsync(formData);
    } catch (error) {
      const message = maybeAxiosError(error);
      setError('root', { message });
    }
  };

  const onReset = () => {
    reset(data);
  };

  const canSubmit = !isSubmitting && isDirty && isValid;

  return (
    <Panel.Card>
      <Panel.SubHeader>
        QLab Integration
        <Panel.InlineElements>
          <Button variant='ontime-ghosted' size='sm' onClick={onReset} isDisabled={!canSubmit}>
            Revert to saved
          </Button>
          <Button
            variant='ontime-filled'
            size='sm'
            type='submit'
            form='qlab-settings-form'
            isDisabled={!canSubmit}
            isLoading={isSubmitting}
          >
            Save
          </Button>
        </Panel.InlineElements>
      </Panel.SubHeader>
      {errors?.root && <Panel.Error>{errors.root.message}</Panel.Error>}

      <Panel.Divider />

      <Panel.Section
        as='form'
        id='qlab-settings-form'
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={(event) => preventEscape(event, onReset)}
      >
        <Panel.Loader isLoading={false} />

        <Panel.Title>Connection</Panel.Title>
        <Panel.ListGroup>
          <Panel.ListItem>
            <Panel.Field
              title='Enable QLab integration'
              description='Poll QLab for running cue countdown data'
              error={errors.enabled?.message}
            />
            <Controller
              control={control}
              name='enabled'
              render={({ field: { onChange, value, ref } }) => (
                <Switch variant='ontime' size='lg' isChecked={value} onChange={onChange} ref={ref} />
              )}
            />
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field
              title='Status'
              description={qlabState.connected ? 'Connected to QLab' : 'Not connected'}
            />
            <span style={{ color: qlabState.connected ? '#4caf50' : '#999' }}>
              {qlabState.connected ? 'Connected' : 'Disconnected'}
            </span>
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field
              title='QLab host IP'
              description='IP address of the QLab machine'
              error={errors.host?.message}
            />
            <Input
              id='host'
              placeholder='127.0.0.1'
              width='10rem'
              size='sm'
              textAlign='right'
              variant='ontime-filled'
              autoComplete='off'
              {...register('host', {
                required: { value: true, message: 'Required field' },
              })}
            />
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field
              title='QLab port'
              description='QLab OSC port. Default: 53000'
              error={errors.port?.message}
            />
            <Input
              id='port'
              placeholder='53000'
              width='5rem'
              maxLength={5}
              size='sm'
              textAlign='right'
              variant='ontime-filled'
              type='number'
              autoComplete='off'
              {...register('port', {
                required: { value: true, message: 'Required field' },
                valueAsNumber: true,
                max: { value: 65535, message: 'Port must be within range 1 - 65535' },
                min: { value: 1, message: 'Port must be within range 1 - 65535' },
              })}
            />
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field
              title='Listen port'
              description='Port to receive QLab responses. Default: 53001'
              error={errors.listenPort?.message}
            />
            <Input
              id='listenPort'
              placeholder='53001'
              width='5rem'
              maxLength={5}
              size='sm'
              textAlign='right'
              variant='ontime-filled'
              type='number'
              autoComplete='off'
              {...register('listenPort', {
                required: { value: true, message: 'Required field' },
                valueAsNumber: true,
                max: { value: 65535, message: 'Port must be within range 1 - 65535' },
                min: { value: 1, message: 'Port must be within range 1 - 65535' },
              })}
            />
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field
              title='Connection timeout'
              description='Timeout in milliseconds. Default: 3000'
              error={errors.timeout?.message}
            />
            <Input
              id='timeout'
              placeholder='3000'
              width='5rem'
              size='sm'
              textAlign='right'
              variant='ontime-filled'
              type='number'
              autoComplete='off'
              {...register('timeout', {
                required: { value: true, message: 'Required field' },
                valueAsNumber: true,
                min: { value: 1000, message: 'Minimum 1000ms' },
              })}
            />
          </Panel.ListItem>
        </Panel.ListGroup>

        <Panel.Title>Filters</Panel.Title>
        <Panel.ListGroup>
          <Panel.ListItem>
            <Panel.Field
              title='Filter by color'
              description='Only track cues with this color name (e.g. "red")'
            />
            <Input
              id='filterByColor'
              placeholder='Leave empty for all'
              width='10rem'
              size='sm'
              textAlign='right'
              variant='ontime-filled'
              autoComplete='off'
              {...register('filterByColor')}
            />
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field
              title='Filter by type'
              description='Only track cues of this type (e.g. "Video")'
            />
            <Input
              id='filterByType'
              placeholder='Leave empty for all'
              width='10rem'
              size='sm'
              textAlign='right'
              variant='ontime-filled'
              autoComplete='off'
              {...register('filterByType')}
            />
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field
              title='Filter by cue number'
              description='Only track a specific cue number'
            />
            <Input
              id='filterByCueNumber'
              placeholder='Leave empty for all'
              width='10rem'
              size='sm'
              textAlign='right'
              variant='ontime-filled'
              autoComplete='off'
              {...register('filterByCueNumber')}
            />
          </Panel.ListItem>
        </Panel.ListGroup>

        <Panel.Title>Phase Thresholds</Panel.Title>
        <Panel.ListGroup>
          <Panel.ListItem>
            <Panel.Field
              title='Warning threshold'
              description='Time remaining (ms) to enter warning phase. Default: 30000'
              error={errors.warningThreshold?.message}
            />
            <Input
              id='warningThreshold'
              placeholder='30000'
              width='5rem'
              size='sm'
              textAlign='right'
              variant='ontime-filled'
              type='number'
              autoComplete='off'
              {...register('warningThreshold', {
                required: { value: true, message: 'Required field' },
                valueAsNumber: true,
                min: { value: 0, message: 'Must be 0 or greater' },
              })}
            />
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field
              title='Danger threshold'
              description='Time remaining (ms) to enter danger phase. Default: 10000'
              error={errors.dangerThreshold?.message}
            />
            <Input
              id='dangerThreshold'
              placeholder='10000'
              width='5rem'
              size='sm'
              textAlign='right'
              variant='ontime-filled'
              type='number'
              autoComplete='off'
              {...register('dangerThreshold', {
                required: { value: true, message: 'Required field' },
                valueAsNumber: true,
                min: { value: 0, message: 'Must be 0 or greater' },
              })}
            />
          </Panel.ListItem>
        </Panel.ListGroup>
      </Panel.Section>
    </Panel.Card>
  );
}
