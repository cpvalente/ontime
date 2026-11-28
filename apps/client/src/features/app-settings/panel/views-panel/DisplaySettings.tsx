import { useDisclosure } from '@mantine/hooks';
import { Settings } from 'ontime-types';
import { lazy, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Info from '../../../../common/components/info/Info';
import Select from '../../../../common/components/select/Select';
import useSettings, { useUpdateSettings } from '../../../../common/hooks-query/useSettings';
import { preventEscape } from '../../../../common/utils/keyEvent';
import * as Panel from '../../panel-utils/PanelUtils';

const TranslationModal = lazy(() => import('./composite/CustomTranslationModal'));

type DisplayFields = Pick<Settings, 'timeFormat' | 'language'>;

function toDisplayFields(settings: Settings): DisplayFields {
  return { timeFormat: settings.timeFormat, language: settings.language };
}

export default function DisplaySettings() {
  const { data, status } = useSettings();
  const { updateSettings } = useUpdateSettings();
  const {
    handleSubmit,
    reset,
    setError,
    watch,
    setValue,
    formState: { isSubmitting, isDirty, isValid, errors, dirtyFields },
  } = useForm<DisplayFields>({
    mode: 'onChange',
    defaultValues: toDisplayFields(data),
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  const [isOpen, handler] = useDisclosure();

  // update form if we get new data from server
  useEffect(() => {
    if (data) {
      reset(toDisplayFields(data));
    }
  }, [data, reset]);

  const onSubmit = async (formData: DisplayFields) => {
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
    reset(toDisplayFields(data));
  };

  const isLoading = status === 'pending';

  return (
    <>
      <TranslationModal isOpen={isOpen} onClose={handler.close} />
      <Panel.Section
        as='form'
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={(event) => preventEscape(event, onReset)}
        id='display-settings'
      >
        <Panel.Card>
          <Panel.SubHeader>
            Display
            <Panel.InlineElements>
              <Button disabled={!isDirty || isSubmitting} variant='ghosted' onClick={onReset}>
                Revert to saved
              </Button>
              <Button
                type='submit'
                form='display-settings'
                name='display-settings-submit'
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
            <Info>Changes to the views language does not affect the editor view</Info>
            <Panel.Loader isLoading={isLoading} />
            <Panel.ListGroup>
              <Panel.ListItem>
                <Panel.Field
                  title='Time format'

                  error={errors.timeFormat?.message}
                />
                <Select
                  triggerClassName={Panel.pendingClass(dirtyFields.timeFormat)}
                  value={watch('timeFormat')}
                  onValueChange={(value: '12' | '24' | null) => {
                    if (value === null) return;
                    setValue('timeFormat', value, { shouldDirty: true });
                  }}
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

                  error={errors.language?.message}
                />
                <Select
                  triggerClassName={Panel.pendingClass(dirtyFields.language)}
                  value={watch('language')}
                  onValueChange={(value: string | null) => {
                    if (value === null) return;
                    setValue('language', value, { shouldDirty: true });
                  }}
                  disabled={disableInputs}
                  defaultValue='en'
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'fr', label: 'French' },
                    { value: 'de', label: 'German' },
                    { value: 'it', label: 'Italian' },
                    { value: 'pt', label: 'Portuguese' },
                    { value: 'es', label: 'Spanish' },
                    { value: 'custom', label: 'Custom' },
                  ]}
                />
                <Button onClick={handler.open}>Edit custom translation</Button>
              </Panel.ListItem>
            </Panel.ListGroup>
          </Panel.Section>
        </Panel.Card>
      </Panel.Section>
    </>
  );
}
