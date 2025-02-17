import { Controller, useForm } from 'react-hook-form';
import { Button, Input, Switch } from '@chakra-ui/react';

import { editAutomationSettings } from '../../../../common/api/automation';
import { maybeAxiosError } from '../../../../common/api/utils';
import ExternalLink from '../../../../common/components/external-link/ExternalLink';
import Info from '../../../../common/components/info/Info';
import { preventEscape } from '../../../../common/utils/keyEvent';
import { isOnlyNumbers } from '../../../../common/utils/regex';
import * as Panel from '../../panel-utils/PanelUtils';

const oscApiDocsUrl = 'https://docs.getontime.no/api/protocols/osc/';

interface AutomationSettingsProps {
  enabledAutomations: boolean;
  enabledOscIn: boolean;
  oscPortIn: number;
}

export default function AutomationSettingsForm(props: AutomationSettingsProps) {
  const { enabledAutomations, enabledOscIn, oscPortIn } = props;

  const {
    control,
    handleSubmit,
    reset,
    register,
    setError,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<AutomationSettingsProps>({
    mode: 'onChange',
    defaultValues: { enabledAutomations, enabledOscIn, oscPortIn },
    values: { enabledAutomations, enabledOscIn, oscPortIn },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  const onSubmit = async (formData: AutomationSettingsProps) => {
    try {
      await editAutomationSettings(formData);
    } catch (error) {
      const message = maybeAxiosError(error);
      setError('root', { message });
    }
  };

  const onReset = () => {
    reset({ enabledAutomations, enabledOscIn, oscPortIn });
  };

  const canSubmit = !isSubmitting && isDirty && isValid;

  return (
    <Panel.Card>
      <Panel.SubHeader>
        Automation settings
        <Panel.InlineElements>
          <Button variant='ontime-ghosted' size='sm' onClick={onReset} isDisabled={!canSubmit}>
            Revert to saved
          </Button>
          <Button
            variant='ontime-filled'
            size='sm'
            type='submit'
            form='automation-settings-form'
            isDisabled={!canSubmit}
            isLoading={isSubmitting}
          >
            Save
          </Button>
        </Panel.InlineElements>
      </Panel.SubHeader>
      {errors?.root && <Panel.Error>{errors.root.message}</Panel.Error>}

      <Panel.Divider />

      <Panel.Section>
        <Info>
          <p>Control Ontime and share its data with external systems in your workflow.</p>
          <p>- Automations allow Ontime to send its data on lifecycle triggers.</p>
          <p>- OSC Input tells Ontime to listen to messages on the specific port.</p>
          <br />
          <ExternalLink href={oscApiDocsUrl}>See the docs</ExternalLink>
        </Info>
      </Panel.Section>

      <Panel.Section
        as='form'
        id='automation-settings-form'
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={(event) => preventEscape(event, onReset)}
      >
        <Panel.Loader isLoading={false} />

        <Panel.Title>Automation</Panel.Title>
        <Panel.ListGroup>
          <Panel.ListItem>
            <Panel.Field
              title='Enable automations'
              description='Allow Ontime to send messages on lifecycle triggers'
              error={errors.enabledAutomations?.message}
            />
            <Controller
              control={control}
              name='enabledAutomations'
              render={({ field: { onChange, value, ref } }) => (
                <Switch variant='ontime' size='lg' isChecked={value} onChange={onChange} ref={ref} />
              )}
            />
          </Panel.ListItem>
        </Panel.ListGroup>

        <Panel.Title>OSC Input</Panel.Title>
        <Panel.ListGroup>
          <Panel.ListItem>
            <Panel.Field
              title='OSC input'
              description='Allow control of Ontime through OSC'
              error={errors.enabledOscIn?.message}
            />
            <Controller
              control={control}
              name='enabledOscIn'
              render={({ field: { onChange, value, ref } }) => (
                <Switch variant='ontime' size='lg' isChecked={value} onChange={onChange} ref={ref} />
              )}
            />
          </Panel.ListItem>
          <Panel.ListItem>
            <Panel.Field
              title='Listen on port'
              description='Port for incoming OSC. Default: 8888'
              error={errors.oscPortIn?.message}
            />
            <Input
              id='oscPortIn'
              placeholder='8888'
              width='5rem'
              maxLength={5}
              size='sm'
              textAlign='right'
              variant='ontime-filled'
              type='number'
              autoComplete='off'
              {...register('oscPortIn', {
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
