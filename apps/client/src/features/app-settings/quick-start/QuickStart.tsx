import { useForm } from 'react-hook-form';
import { QuickStartData } from 'ontime-types';
import { parseUserTime } from 'ontime-utils';

import { quickProject } from '../../../common/api/db';
import { invalidateAllCaches, maybeAxiosError } from '../../../common/api/utils';
import Button from '../../../common/components/buttons/Button';
import Input from '../../../common/components/input/input/Input';
import TimeInput from '../../../common/components/input/time-input/TimeInput';
import Modal from '../../../common/components/modal/Modal';
import Select from '../../../common/components/select/Select';
import { editorSettingsDefaults, useEditorSettings } from '../../../common/stores/editorSettings';
import * as Panel from '../panel-utils/PanelUtils';

import { quickStartDefaults } from './quickStart.utils';

interface QuickStartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickStart({ isOpen, onClose }: QuickStartProps) {
  'use no memo'; // RHF and react-compiler don't seem to get along
  const { defaultWarnTime, defaultDangerTime, setDangerTime, setWarnTime } = useEditorSettings();

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting, isValid },
    watch,
    setError,
    setValue,
  } = useForm<QuickStartData>({
    defaultValues: quickStartDefaults,
    values: quickStartDefaults,
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  const onSubmit = async (formData: QuickStartData) => {
    try {
      if (formData.project.title === '') {
        formData.project.title = 'untitled';
      }
      await quickProject(formData);
      await invalidateAllCaches();
      onClose();
    } catch (error) {
      setError('root', { message: maybeAxiosError(error) });
    }
  };

  const warnTimeInMs = parseUserTime(defaultWarnTime);
  const dangerTimeInMs = parseUserTime(defaultDangerTime);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showBackdrop
      showCloseButton
      title='Create new project...'
      bodyElements={
        <form onSubmit={handleSubmit(onSubmit)} id='quick-start'>
          <Panel.ListGroup>
            <Panel.ListItem>
              <Panel.Field title='Project title' description='Shown as the title in some views' />
              <Input maxLength={150} placeholder='Project title' fluid {...register('project.title')} />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field
                title='Time format'
                description='Default time format to show in views 12 /24 hours'
                error={errors.settings?.timeFormat?.message}
              />
              <Select
                value={watch('settings.timeFormat')}
                onValueChange={(value: '12' | '24') => setValue('settings.timeFormat', value, { shouldDirty: true })}
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
                error={errors.settings?.language?.message}
              />
              <Select
                value={watch('settings.language')}
                onValueChange={(value: string) => setValue('settings.language', value, { shouldDirty: true })}
                defaultValue='en'
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'fr', label: 'French' },
                  { value: 'de', label: 'German' },
                  { value: 'it', label: 'Italian' },
                  { value: 'pt', label: 'Portuguese' },
                  { value: 'es', label: 'Spanish' },
                ]}
              />
            </Panel.ListItem>
          </Panel.ListGroup>

          <Panel.ListGroup>
            <Panel.ListItem>
              <Panel.Field title='Warning time' description='Default threshold for warning time in an event' />
              <TimeInput<'warnTime'>
                name='warnTime'
                submitHandler={(_field, value) => setWarnTime(value)}
                time={warnTimeInMs}
                placeholder={editorSettingsDefaults.warnTime}
              />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field title='Danger time' description='Default threshold for danger time in an event' />
              <TimeInput<'dangerTime'>
                name='dangerTime'
                submitHandler={(_field, value) => setDangerTime(value)}
                time={dangerTimeInMs}
                placeholder={editorSettingsDefaults.dangerTime}
              />
            </Panel.ListItem>
          </Panel.ListGroup>
        </form>
      }
      footerElements={
        <>
          {errors?.root && <Panel.Error>{errors.root.message}</Panel.Error>}
          <Button variant='ghosted' onClick={onClose} disabled={false}>
            Cancel
          </Button>
          <Button variant='primary' type='submit' form='quick-start' disabled={!isValid} loading={isSubmitting}>
            Create project
          </Button>
        </>
      }
    />
  );
}
