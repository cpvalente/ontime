import { QuickStartData } from 'ontime-types';
import { useForm } from 'react-hook-form';

import { quickProject } from '../../../common/api/db';
import { invalidateAllCaches, maybeAxiosError } from '../../../common/api/utils';
import Button from '../../../common/components/buttons/Button';
import Input from '../../../common/components/input/input/Input';
import PhaseThresholdInput from '../../../common/components/input/phase-threshold-input/PhaseThresholdInput';
import Modal from '../../../common/components/modal/Modal';
import Select from '../../../common/components/select/Select';
import * as Panel from '../panel-utils/PanelUtils';
import { phaseDescription } from '../panel/manage-panel/PhaseThresholdSettings';
import { quickStartDefaults } from './quickStart.utils';

interface QuickStartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickStart({ isOpen, onClose }: QuickStartProps) {
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
                description='Default time format to show in views 12 / 24 hours'
                error={errors.settings?.timeFormat?.message}
              />
              <Select
                value={watch('settings.timeFormat')}
                onValueChange={(value: '12' | '24' | null) => {
                  if (value === null) return;
                  setValue('settings.timeFormat', value, { shouldDirty: true });
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
                description='Language to be displayed in views'
                error={errors.settings?.language?.message}
              />
              <Select
                value={watch('settings.language')}
                onValueChange={(value: string | null) => {
                  if (value === null) return;
                  setValue('settings.language', value, { shouldDirty: true });
                }}
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
              <Panel.Field title='Warning' description={phaseDescription.warning} />
              <PhaseThresholdInput
                name='warnTime'
                label='Warning'
                phase='warning'
                value={watch('settings.phaseThresholds.warning')}
                onChange={(threshold) => setValue('settings.phaseThresholds.warning', threshold, { shouldDirty: true })}
              />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field title='Danger' description={phaseDescription.danger} />
              <PhaseThresholdInput
                name='dangerTime'
                label='Danger'
                phase='danger'
                value={watch('settings.phaseThresholds.danger')}
                onChange={(threshold) => setValue('settings.phaseThresholds.danger', threshold, { shouldDirty: true })}
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
