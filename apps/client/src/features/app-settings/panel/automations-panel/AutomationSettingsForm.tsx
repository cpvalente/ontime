import { useForm } from 'react-hook-form';

import { editAutomationSettings } from '../../../../common/api/automation';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Info from '../../../../common/components/info/Info';
import Input from '../../../../common/components/input/input/Input';
import ExternalLink from '../../../../common/components/link/external-link/ExternalLink';
import Switch from '../../../../common/components/switch/Switch';
import Tag from '../../../../common/components/tag/Tag';
import { preventEscape } from '../../../../common/utils/keyEvent';
import { isOnlyNumbers } from '../../../../common/utils/regex';
import { isOntimeCloud } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';

const oscApiDocsUrl = 'https://docs.getontime.no/api/protocols/osc/';

interface AutomationSettingsProps {
  enabledAutomations: boolean;
  enabledOscIn: boolean;
  oscPortIn: number;
  automationState?: boolean;
  oscInputState?: boolean;
}

export default function AutomationSettingsForm({
  enabledAutomations,
  enabledOscIn,
  oscPortIn,
  automationState,
  oscInputState,
}: AutomationSettingsProps) {
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
    resetOptions: {
      keepDirtyValues: false,
    },
  });

  const onSubmit = async (formData: AutomationSettingsProps) => {
    try {
      await editAutomationSettings(formData);
      reset(formData);
    } catch (error) {
      const message = maybeAxiosError(error);
      setError('root', { message });
    }
  };

  const onReset = () => {
    reset({ enabledAutomations, enabledOscIn, oscPortIn });
  };

  const canSubmit = !isSubmitting && isDirty && isValid;
  const automationsEnabled = watch('enabledAutomations');
  const oscInputEnabled = watch('enabledOscIn');

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
          <span>Control Ontime and share its data with external systems in your workflow.</span>
          <span>- Automations allow Ontime to send its data on lifecycle triggers.</span>
          <span>- OSC Input tells Ontime to listen to messages on the specific port.</span>
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
              title={
                <>
                  <span>Enable automations</span>
                  {automationState === false && <Tag variant='warning'>OFF</Tag>}
                </>
              }
              description={
                automationState === false
                  ? 'Automations are OFF. Triggers stay configured, but Ontime will not send messages.'
                  : 'Allow Ontime to send messages on lifecycle triggers'
              }
              descriptionTone={automationState === false ? 'warning' : 'default'}
              error={errors.enabledAutomations?.message}
            />
            <Switch
              size='large'
              checked={automationsEnabled}
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
              title={
                <>
                  <span>OSC input</span>
                  {oscInputState === false && <Tag variant='warning'>OFF</Tag>}
                </>
              }
              description={
                oscInputState === false
                  ? 'OSC input is OFF. Ontime will not listen for incoming OSC control messages.'
                  : 'Allow control of Ontime through OSC'
              }
              descriptionTone={oscInputState === false ? 'warning' : 'default'}
              error={errors.enabledOscIn?.message}
            />
            <Switch
              size='large'
              checked={oscInputEnabled}
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
