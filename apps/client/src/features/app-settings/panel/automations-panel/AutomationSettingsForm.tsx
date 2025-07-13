import { useForm } from 'react-hook-form';

import { editAutomationSettings } from '../../../../common/api/automation';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Info from '../../../../common/components/info/Info';
import Input from '../../../../common/components/input/input/Input';
import ExternalLink from '../../../../common/components/link/external-link/ExternalLink';
import Switch from '../../../../common/components/switch/Switch';
import { preventEscape } from '../../../../common/utils/keyEvent';
import { isOnlyNumbers } from '../../../../common/utils/regex';
import { isOntimeCloud } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';

const oscApiDocsUrl = 'https://docs.getontime.no/api/protocols/osc/';

interface AutomationSettingsProps {
  enabledAutomations: boolean;
  enabledOscIn: boolean;
  oscPortIn: number;
}

export default function AutomationSettingsForm({
  enabledAutomations,
  enabledOscIn,
  oscPortIn,
}: AutomationSettingsProps) {
  'no memo'; // RHF and react-compiler dont seem to get along

  const {
    handleSubmit,
    reset,
    register,
    setError,
    watch,
    setValue,
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
          <Button variant='ghosted' onClick={onReset} disabled={!canSubmit}>
            Revert to saved
          </Button>
          <Button
            variant='primary'
            type='submit'
            form='automation-settings-form'
            disabled={!canSubmit}
            loading={isSubmitting}
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
            <Switch
              size='large'
              checked={watch('enabledAutomations')}
              onCheckedChange={(value: boolean) =>
                setValue('enabledAutomations', value, { shouldDirty: true, shouldValidate: true })
              }
            />
          </Panel.ListItem>
        </Panel.ListGroup>

        <Panel.Title>OSC Input</Panel.Title>

        <Panel.ListGroup>
          {isOntimeCloud && <Info>For security reasons OSC integrations are not available in the cloud service.</Info>}
          <Panel.ListItem>
            <Panel.Field
              title='OSC input'
              description='Allow control of Ontime through OSC'
              error={errors.enabledOscIn?.message}
            />
            <Switch
              size='large'
              checked={watch('enabledOscIn')}
              onCheckedChange={(value: boolean) =>
                setValue('enabledOscIn', value, { shouldDirty: true, shouldValidate: true })
              }
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
              maxLength={5}
              style={{ textAlign: 'right', width: '5rem' }}
              type='number'
              fluid
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
