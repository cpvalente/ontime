import { lazy, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Settings } from 'ontime-types';

import { postSettings } from '../../../../common/api/settings';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Input from '../../../../common/components/input/input/Input';
import Select from '../../../../common/components/select/Select';
import useSettings from '../../../../common/hooks-query/useSettings';
import { preventEscape } from '../../../../common/utils/keyEvent';
import { isOnlyNumbers } from '../../../../common/utils/regex';
import { isOntimeCloud } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';

import GeneralPinInput from './composite/GeneralPinInput';

const TranslationModal = lazy(() => import('./composite/CustomTranslationModal'));

export default function GeneralSettings() {
  'use no memo'; // RHF and react-compiler don't seem to get along
  const { data, status, refetch } = useSettings();
  const {
    handleSubmit,
    register,
    reset,
    setError,
    watch,
    setValue,
    formState: { isSubmitting, isDirty, isValid, errors },
  } = useForm<Settings>({
    mode: 'onChange',
    defaultValues: data,
    values: data,
    resetOptions: {
      keepDirtyValues: true,
    },
  });
  const [isCustomTranslationModalOpen, setIsCustomTranslationModalOpen] = useState(false);

  const language = watch('language');

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
    <>
      <TranslationModal isOpen={isCustomTranslationModalOpen} onClose={() => setIsCustomTranslationModalOpen(false)} />
      <Panel.Section
        as='form'
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={(event) => preventEscape(event, onReset)}
        id='app-settings'
      >
        <Panel.Card>
          <Panel.SubHeader>
            General settings
            <Panel.InlineElements>
              <Button disabled={!isDirty || isSubmitting} variant='ghosted' onClick={onReset}>
                Revert to saved
              </Button>
              <Button
                type='submit'
                form='app-settings'
                name='general-settings-submit'
                loading={isSubmitting}
                disabled={disableSubmit}
                variant='primary'
              >
                Save
              </Button>
            </Panel.InlineElements>
          </Panel.SubHeader>
          {submitError && <Panel.Error>{submitError}</Panel.Error>}
          <Panel.Divider />
          <Panel.Section>
            <Panel.Loader isLoading={isLoading} />
            <Panel.ListGroup>
              <Panel.ListItem>
                <Panel.Field
                  title='Ontime server port'
                  description={
                    isOntimeCloud
                      ? 'Server port disabled for Ontime Cloud'
                      : 'Port ontime server listens in. Defaults to 4001 (needs app restart)'
                  }
                  error={errors.serverPort?.message}
                />
                <Input
                  id='serverPort'
                  type='number'
                  maxLength={5}
                  style={{ width: '75px' }}
                  disabled={isOntimeCloud}
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
              <Panel.ListItem>
                <Panel.Field
                  title='Time format'
                  description='Default time format to show in views 12 /24 hours'
                  error={errors.timeFormat?.message}
                />
              <Select
                value={watch('timeFormat')}
                onValueChange={(value) => setValue('timeFormat', value as '12' | '24', { shouldDirty: true })}
                defaultValue='24'
                options={[
                  { value: '12', label: '12 hours 11:00:10 PM' },
                  { value: '24', label: '24 hours 23:00:10' },
                ]}
              />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field
                  title='Views language'
                  description='Language to be displayed in views'
                  error={errors.language?.message}
                />
              <Select
                value={watch('language')}
                onValueChange={(value) => setValue('language', value, { shouldDirty: true })}
                disabled={disableInputs}
                defaultValue='en'
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'fr', label: 'French' },
                  { value: 'de', label: 'German' },
                  { value: 'it', label: 'Italian' },
                  { value: 'pt', label: 'Portuguese' },
                  { value: 'es', label: 'Spanish' },
                  { value: 'custom', label: 'Custom' }
                ]}
              />
                {language === 'custom' && (
                  <Button onClick={() => setIsCustomTranslationModalOpen(true)}>Add translation</Button>
                )}
              </Panel.ListItem>
            </Panel.ListGroup>
          </Panel.Section>
        </Panel.Card>
      </Panel.Section>
    </>
  );
}
