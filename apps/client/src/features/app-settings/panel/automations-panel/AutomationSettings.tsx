import { Controller, useForm } from 'react-hook-form';
import { Button, Input, Switch } from '@chakra-ui/react';

import { isOnlyNumbers } from '../../../../common/utils/regex';
import * as Panel from '../../panel-utils/PanelUtils';

interface AutomationSettingsOptions {
  enabledIn: boolean;
  portIn: number;
}

const automationSettingsPlaceholder = {
  enabledIn: false,
  portIn: 8888,
};

const style = {
  flex: 'flex',
};
export default function AutomationSettings() {
  const {
    control,
    handleSubmit,
    reset,
    register,
    setError,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<AutomationSettingsOptions>({
    mode: 'onChange',
    defaultValues: automationSettingsPlaceholder,
    values: automationSettingsPlaceholder,
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  return (
    <Panel.Card>
      <Panel.SubHeader>
        Automation settings
        <div className={style.flex}>
          <Button variant='ontime-ghosted' size='sm' onClick={() => undefined} isDisabled={false}>
            Revert to saved
          </Button>
          <Button variant='ontime-filled' size='sm' type='submit' form='osc-form' isDisabled={false} isLoading={false}>
            Save
          </Button>
        </div>
      </Panel.SubHeader>

      <Panel.Divider />

      <Panel.Section
        as='form'
        id='automation-form'
        onSubmit={() => undefined}
        onKeyDown={() => console.log('prevent escapee')}
      >
        <Panel.Loader isLoading={false} />
        <Panel.Title>Automation</Panel.Title>
        {errors?.root && <Panel.Error>{errors.root.message}</Panel.Error>}
        <Panel.ListGroup>
          <Panel.ListItem>
            <Panel.Field title='Enable automations' description='Allow Ontime to send messages on lifecycle triggers' />
            <Controller
              control={control}
              name='enabledIn'
              render={({ field: { onChange, value, ref } }) => (
                <Switch variant='ontime' size='lg' isChecked={value} onChange={onChange} ref={ref} />
              )}
            />
          </Panel.ListItem>
        </Panel.ListGroup>

        <Panel.Title>OSC Input</Panel.Title>
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
            <Panel.Field title='Listen on port' description='Port for incoming OSC. Default: 8888' error={'asdas'} />
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
      </Panel.Section>
    </Panel.Card>
  );
}
