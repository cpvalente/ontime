import { useDisclosure } from '@mantine/hooks';
import { Settings } from 'ontime-types';
import { lazy, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import ExternalLink from '../../../../common/components/link/external-link/ExternalLink';
import Select from '../../../../common/components/select/Select';
import Switch from '../../../../common/components/switch/Switch';
import Tag from '../../../../common/components/tag/Tag';
import useSettings, { useUpdateSettings } from '../../../../common/hooks-query/useSettings';
import useViewSettings, { useUpdateViewSettings } from '../../../../common/hooks-query/useViewSettings';
import { preventEscape } from '../../../../common/utils/keyEvent';
import * as Panel from '../../panel-utils/PanelUtils';
import CodeEditorModal from './composite/StyleEditorModal';

const TranslationModal = lazy(() => import('./composite/CustomTranslationModal'));

const cssOverrideDocsUrl = 'https://docs.getontime.no/features/custom-styling/';

type ViewFields = Pick<Settings, 'timeFormat' | 'language'> & { overrideStyles: boolean };

export default function ViewSettings() {
  const { data: settings, status: settingsStatus } = useSettings();
  const { data: viewSettings, status: viewStatus } = useViewSettings();
  const { updateSettings } = useUpdateSettings();
  const { updateViewSettings } = useUpdateViewSettings();
  const [isTranslationOpen, translationHandler] = useDisclosure();
  const [isCodeEditorOpen, codeEditorHandler] = useDisclosure();

  const toFields = (): ViewFields => ({
    timeFormat: settings.timeFormat,
    language: settings.language,
    overrideStyles: viewSettings.overrideStyles,
  });

  const {
    handleSubmit,
    reset,
    setError,
    watch,
    setValue,
    formState: { isSubmitting, isDirty, isValid, errors, dirtyFields },
  } = useForm<ViewFields>({
    mode: 'onChange',
    defaultValues: toFields(),
    resetOptions: { keepDirtyValues: true },
  });

  useEffect(() => {
    reset(toFields());
  }, [settings, viewSettings, reset]);

  const onSubmit = async ({ timeFormat, language, overrideStyles }: ViewFields) => {
    try {
      if (dirtyFields.timeFormat || dirtyFields.language) {
        await updateSettings({ timeFormat, language });
      }
      if (dirtyFields.overrideStyles) {
        await updateViewSettings({ ...viewSettings, overrideStyles });
      }
    } catch (error) {
      setError('root', { message: maybeAxiosError(error) });
    }
  };

  const onReset = () => reset(toFields());

  const isLoading = settingsStatus === 'pending' || viewStatus === 'pending';
  const overrideStylesEnabled = watch('overrideStyles');

  return (
    <>
      <TranslationModal isOpen={isTranslationOpen} onClose={translationHandler.close} />
      <CodeEditorModal isOpen={isCodeEditorOpen} onClose={codeEditorHandler.close} />
      <Panel.Section
        as='form'
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={(event) => preventEscape(event, onReset)}
        id='view-settings'
      >
        <Panel.Card>
          <Panel.SubHeader>
            View settings
            <Panel.InlineElements>
              <Button disabled={!isDirty || isSubmitting} variant='ghosted' onClick={onReset}>
                Revert to saved
              </Button>
              <Button
                type='submit'
                form='view-settings'
                loading={isSubmitting}
                disabled={isSubmitting || !isDirty || !isValid}
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
                  title={
                    <>
                      <span>Override CSS styles</span>
                      {overrideStylesEnabled && <Tag variant='warning'>ON</Tag>}
                    </>
                  }
                  description={
                    overrideStylesEnabled ? (
                      'Views use the custom stylesheet'
                    ) : (
                      <ExternalLink href={cssOverrideDocsUrl}>See the docs</ExternalLink>
                    )
                  }
                  descriptionTone={overrideStylesEnabled ? 'warning' : 'default'}
                />
                <Switch
                  size='large'
                  className={Panel.pendingClass(dirtyFields.overrideStyles)}
                  checked={overrideStylesEnabled}
                  onCheckedChange={(value: boolean) => setValue('overrideStyles', value, { shouldDirty: true })}
                />
                <Button onClick={codeEditorHandler.open} disabled={isLoading || isSubmitting}>
                  Edit CSS override
                </Button>
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Time format' error={errors.timeFormat?.message} />
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
                <Panel.Field title='Views language' error={errors.language?.message} />
                <Select
                  triggerClassName={Panel.pendingClass(dirtyFields.language)}
                  value={watch('language')}
                  onValueChange={(value: string | null) => {
                    if (value === null) return;
                    setValue('language', value, { shouldDirty: true });
                  }}
                  disabled={isLoading}
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
                <Button onClick={translationHandler.open}>Edit custom translation</Button>
              </Panel.ListItem>
            </Panel.ListGroup>
          </Panel.Section>
        </Panel.Card>
      </Panel.Section>
    </>
  );
}
