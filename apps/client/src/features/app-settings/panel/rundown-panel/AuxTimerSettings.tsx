import { Settings } from 'ontime-types';
import { auxTimerNameMaxLength } from 'ontime-utils';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Input from '../../../../common/components/input/input/Input';
import useSettings, { useUpdateSettings } from '../../../../common/hooks-query/useSettings';
import { preventEscape } from '../../../../common/utils/keyEvent';
import * as Panel from '../../panel-utils/PanelUtils';

type AuxTimerFields = Pick<Settings, 'auxTimerNames'>;

function toAuxTimerFields(settings: Settings): AuxTimerFields {
  return { auxTimerNames: settings.auxTimerNames };
}

export default function AuxTimerSettings() {
  const { data, status } = useSettings();
  const { updateSettings } = useUpdateSettings();
  const {
    handleSubmit,
    register,
    reset,
    setError,
    formState: { isSubmitting, isDirty, errors, dirtyFields },
  } = useForm<AuxTimerFields>({
    defaultValues: toAuxTimerFields(data),
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  useEffect(() => {
    reset(toAuxTimerFields(data));
  }, [data, reset]);

  const onSubmit = async (formData: AuxTimerFields) => {
    try {
      await updateSettings(formData);
    } catch (error) {
      const message = maybeAxiosError(error);
      setError('root', { message });
    }
  };

  const onReset = () => {
    reset(toAuxTimerFields(data));
  };

  const isLoading = status === 'pending';

  return (
    <Panel.Section
      as='form'
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(event) => preventEscape(event, onReset)}
      id='aux-timer-settings'
    >
      <Panel.Card>
        <Panel.SubHeader>
          Aux timers
          <Panel.InlineElements>
            <Button disabled={!isDirty || isSubmitting} variant='ghosted' onClick={onReset}>
              Revert to saved
            </Button>
            <Button type='submit' loading={isSubmitting} disabled={!isDirty} variant='primary'>
              Save
            </Button>
          </Panel.InlineElements>
        </Panel.SubHeader>
        <Panel.Divider />
        <Panel.Section>
          <Panel.Loader isLoading={isLoading} />
          <Panel.Error>{errors.root?.message}</Panel.Error>
          <Panel.ListGroup>
            <Panel.ListItem>
              <Panel.Field title='Aux timer 1' />
              <Input
                className={Panel.pendingClass(dirtyFields.auxTimerNames?.[0])}
                maxLength={auxTimerNameMaxLength}
                placeholder='Aux 1'
                {...register('auxTimerNames.0')}
              />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field title='Aux timer 2' />
              <Input
                className={Panel.pendingClass(dirtyFields.auxTimerNames?.[1])}
                maxLength={auxTimerNameMaxLength}
                placeholder='Aux 2'
                {...register('auxTimerNames.1')}
              />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field title='Aux timer 3' />
              <Input
                className={Panel.pendingClass(dirtyFields.auxTimerNames?.[2])}
                maxLength={auxTimerNameMaxLength}
                placeholder='Aux 3'
                {...register('auxTimerNames.2')}
              />
            </Panel.ListItem>
          </Panel.ListGroup>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
