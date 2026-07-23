import { Settings } from 'ontime-types';
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

const auxTimerIndexes = [1, 2, 3];

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

  // update form if we get new data from server
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
            {auxTimerIndexes.map((index) => (
              <Panel.ListItem key={index}>
                <Panel.Field title={`Aux timer ${index}`} description={`Custom name for aux timer ${index}`} />
                <Input maxLength={30} placeholder={`Aux ${index}`} {...register(`auxTimerNames.${index - 1}`)} />
              </Panel.ListItem>
            ))}
          </Panel.ListGroup>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
