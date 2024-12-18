import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input } from '@chakra-ui/react';
import { Settings } from 'ontime-types';

import { postSettings } from '../../../../common/api/settings';
import { maybeAxiosError } from '../../../../common/api/utils';
import useSettings from '../../../../common/hooks-query/useSettings';
import { isOnlyNumbers } from '../../../../common/utils/regex';
import { NativeSelectField, NativeSelectRoot } from '../../../../components/ui/native-select';
import * as Panel from '../../panel-utils/PanelUtils';

import GeneralPinInput from './GeneralPinInput';

import style from './GeneralPanel.module.scss';

export type GeneralPanelFormValues = {
  filename: string;
};

export default function GeneralPanelForm() {
  const { data, status, refetch } = useSettings();
  const {
    handleSubmit,
    register,
    reset,
    setError,
    formState: { isSubmitting, isDirty, isValid, errors },
  } = useForm<Settings>({
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

  const disableInputs = status === 'pending';
  const disableSubmit = isSubmitting || !isDirty || !isValid;
  const submitError = '';

  const onReset = () => {
    reset(data);
  };

  const isLoading = status === 'pending';

  return (
    <Panel.Section as='form' onSubmit={handleSubmit(onSubmit)} id='app-settings'>
      <Panel.Card>
        <Panel.SubHeader>
          General settings
          <div className={style.actionButtons}>
            <Button isDisabled={!isDirty || isSubmitting} variant='ontime-ghosted' size='sm' onClick={onReset}>
              Revert to saved
            </Button>
            <Button
              type='submit'
              form='app-settings'
              isLoading={isSubmitting}
              isDisabled={disableSubmit}
              variant='ontime-filled'
              size='sm'
            >
              Save
            </Button>
          </div>
        </Panel.SubHeader>
        {submitError && <Panel.Error>{submitError}</Panel.Error>}
        <Panel.Divider />
        <Panel.Section>
          <Panel.Loader isLoading={isLoading} />
          <Panel.ListGroup>
            <Panel.ListItem>
              <Panel.Field
                title='Ontime server port'
                description='Port ontime server listens in. Defaults to 4001 (needs app restart)'
                error={errors.serverPort?.message}
              />
              <Input
                id='serverPort'
                size='sm'
                type='number'
                variant='ontime-filled'
                maxLength={5}
                width='75px'
                {...register('serverPort', {
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
            <Panel.ListItem>
              <Panel.Field
                title='Editor pin code'
                description='Protect the editor view with a pin code'
                error={errors.editorKey?.message}
              />
              <GeneralPinInput register={register} formName='editorKey' isDisabled={disableInputs} />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field
                title='Operator pin code'
                description='Protect the operator and cuesheet views with a pin code'
                error={errors.operatorKey?.message}
              />
              <GeneralPinInput register={register} formName='operatorKey' isDisabled={disableInputs} />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field
                title='Time format'
                description='Default time format to show in views 12 /24 hours'
                error={errors.timeFormat?.message}
              />
              <NativeSelectRoot
                variant='ontime'
                size='sm'
                width='auto'
                isDisabled={disableInputs}
                {...register('timeFormat')}
              >
                <NativeSelectField value='12'>12 hours 11:00:10 PM</NativeSelectField>
                <NativeSelectField value='24'>24 hours 23:00:10</NativeSelectField>
              </NativeSelectRoot>
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field
                title='Views language'
                description='Language to be displayed in views'
                error={errors.language?.message}
              />
              <NativeSelectRoot
                variant='ontime'
                size='sm'
                width='auto'
                isDisabled={disableInputs}
                {...register('language')}
              >
                <NativeSelectField value='en'>English</NativeSelectField>
                <NativeSelectField value='fr'>French</NativeSelectField>
                <NativeSelectField value='de'>German</NativeSelectField>
                <NativeSelectField value='hu'>Hungarian</NativeSelectField>
                <NativeSelectField value='it'>Italian</NativeSelectField>
                <NativeSelectField value='no'>Norwegian</NativeSelectField>
                <NativeSelectField value='pt'>Portuguese</NativeSelectField>
                <NativeSelectField value='es'>Spanish</NativeSelectField>
                <NativeSelectField value='sv'>Swedish</NativeSelectField>
                <NativeSelectField value='pl'>Polish</NativeSelectField>
                <NativeSelectField value='zh'>Chinese (Simplified)</NativeSelectField>
              </NativeSelectRoot>
            </Panel.ListItem>
          </Panel.ListGroup>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
