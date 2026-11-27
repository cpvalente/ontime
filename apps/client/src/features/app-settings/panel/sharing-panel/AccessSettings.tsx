import { Settings } from 'ontime-types';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import useSettings, { useUpdateSettings } from '../../../../common/hooks-query/useSettings';
import { preventEscape } from '../../../../common/utils/keyEvent';
import * as Panel from '../../panel-utils/PanelUtils';
import GeneralPinInput from './composite/GeneralPinInput';

export default function AccessSettings() {
  const { data, status } = useSettings();
  const { updateSettings } = useUpdateSettings();
  const {
    handleSubmit,
    register,
    reset,
    setError,
    formState: { isSubmitting, isDirty, isValid, errors },
  } = useForm<Settings>({
    mode: 'onChange',
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
      await updateSettings(formData);
    } catch (error) {
      const message = maybeAxiosError(error);
      setError('root', { message });
    }
  };

  const disableInputs = status === 'pending';
  const disableSubmit = isSubmitting || !isDirty || !isValid;

  const onReset = () => {
    reset(data);
  };

  const isLoading = status === 'pending';

  return (
    <Panel.Section
      as='form'
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(event) => preventEscape(event, onReset)}
      id='access-settings'
    >
      <Panel.Card>
        <Panel.SubHeader>
          Access
          <Panel.InlineElements>
            <Button disabled={!isDirty || isSubmitting} variant='ghosted' onClick={onReset}>
              Revert to saved
            </Button>
            <Button
              type='submit'
              form='access-settings'
              name='access-settings-submit'
              loading={isSubmitting}
              disabled={disableSubmit}
              variant='primary'
            >
              Save
            </Button>
          </Panel.InlineElements>
        </Panel.SubHeader>
        {errors.root && <Panel.Error>{errors.root.message}</Panel.Error>}
        <Panel.Divider />
        <Panel.Section>
          <Panel.Loader isLoading={isLoading} />
          <Panel.ListGroup>
            <Panel.ListItem>
              <Panel.Field
                title='Editor pin code'
                description='Protect the editor view with a pin code'
                error={errors.editorKey?.message}
              />
              <GeneralPinInput register={register} formName='editorKey' disabled={disableInputs} />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field
                title='Operator pin code'
                description='Protect the operator and cuesheet views with a pin code'
                error={errors.operatorKey?.message}
              />
              <GeneralPinInput register={register} formName='operatorKey' disabled={disableInputs} />
            </Panel.ListItem>
          </Panel.ListGroup>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
