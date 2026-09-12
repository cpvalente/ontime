import { Settings } from 'ontime-types';
import { auxTimerNameMaxLength } from 'ontime-utils';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { postSettings } from '../../../../common/api/settings';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Info from '../../../../common/components/info/Info';
import Input from '../../../../common/components/input/input/Input';
import useSettings from '../../../../common/hooks-query/useSettings';
import { preventEscape } from '../../../../common/utils/keyEvent';
import * as Panel from '../../panel-utils/PanelUtils';

export default function AuxTimerSettings() {
  const { data, status, refetch } = useSettings();
  const {
    handleSubmit,
    register,
    reset,
    setError,
    formState: { isSubmitting, isDirty, errors },
  } = useForm<Settings>({
    defaultValues: data,
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  useEffect(() => {
    if (data) {
      reset(data);
    }
  }, [data, reset]);

  const onSubmit = async (formData: Settings) => {
    try {
      await postSettings(formData);
    } catch (error) {
      const message = maybeAxiosError(error);
      setError('root', { message });
    } finally {
      await refetch();
    }
  };

  const onReset = () => {
    reset(data);
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
          <Info>Give the aux timers custom names. Names are shown across the editor controls and views.</Info>
          <Panel.Loader isLoading={isLoading} />
          <Panel.Error>{errors.root?.message}</Panel.Error>
          <Panel.ListGroup>
            <Panel.ListItem>
              <Panel.Field title='Aux timer 1' description='Custom name for aux timer 1' />
              <Input maxLength={auxTimerNameMaxLength} placeholder='Aux 1' {...register('auxTimerNames.0')} />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field title='Aux timer 2' description='Custom name for aux timer 2' />
              <Input maxLength={auxTimerNameMaxLength} placeholder='Aux 2' {...register('auxTimerNames.1')} />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field title='Aux timer 3' description='Custom name for aux timer 3' />
              <Input maxLength={auxTimerNameMaxLength} placeholder='Aux 3' {...register('auxTimerNames.2')} />
            </Panel.ListItem>
          </Panel.ListGroup>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
