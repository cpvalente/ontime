import { Controller, useForm } from 'react-hook-form';
import { QuickStartData } from 'ontime-types';
import { parseUserTime } from 'ontime-utils';

import { quickProject } from '../../../common/api/db';
import { invalidateAllCaches, maybeAxiosError } from '../../../common/api/utils';
import TimeInput from '../../../common/components/input/time-input/TimeInput';
import { editorSettingsDefaults, useEditorSettings } from '../../../common/stores/editorSettings';
import * as Panel from '../panel-utils/PanelUtils';
import Modal from '../../../common/components/modal/Modal';
import Input from '../../../common/components/input/input/Input';
import Select from '../../../common/components/select/Select';
import Button from '../../../common/components/buttons/Button';
import Switch from '../../../common/components/switch/Switch';


import { quickStartDefaults } from './quickStart.utils';

import style from './QuickStart.module.scss';

interface QuickStartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickStart(props: QuickStartProps) {
  const { isOpen, onClose } = props;
  const { defaultWarnTime, defaultDangerTime, setDangerTime, setWarnTime } = useEditorSettings();

  const {
    control,
    handleSubmit,
    register,
    formState: { errors, isSubmitting, isValid },
    setError,
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

  const bodyElements = (
    <form onSubmit={handleSubmit(onSubmit)} id='quick-start' className={style.scrollContainer}>
      <Panel.ListGroup>
        <Panel.ListItem>
          <Panel.Field title='Project title' description='Shown as the title in some views' />
          <Input
            variant='subtle' // Assuming 'ontime-filled' -> 'subtle'
            height='medium' // Assuming 'sm' -> 'medium'
            maxLength={150}
            placeholder='Project title'
            autoComplete='off'
            style={{ width: '20rem' }} // Chakra 'width' prop
            {...register('project.title')}
          />
        </Panel.ListItem>
        <Panel.ListItem>
          <Panel.Field
            title='Time format'
            description='Default time format to show in views 12 /24 hours'
            error={errors.settings?.timeFormat?.message}
          />
          <Select
            options={[
              { value: '12', label: '12 hours 11:00:10 PM' },
              { value: '24', label: '24 hours 23:00:10' },
            ]}
            // Assuming 'ontime' variant is default, size 'sm' is default
            // isDisabled={false} // Select options can be disabled individually
            {...register('settings.timeFormat')}
          />
        </Panel.ListItem>
        <Panel.ListItem>
          <Panel.Field
            title='Views language'
            description='Language to be displayed in views'
            error={errors.settings?.language?.message}
          />
          <Select
            options={[
              { value: 'en', label: 'English' },
              { value: 'fr', label: 'French' },
              { value: 'de', label: 'German' },
              { value: 'hu', label: 'Hungarian' },
              { value: 'it', label: 'Italian' },
              { value: 'no', label: 'Norwegian' },
              { value: 'pt', label: 'Portuguese' },
              { value: 'es', label: 'Spanish' },
              { value: 'sv', label: 'Swedish' },
              { value: 'pl', label: 'Polish' },
              { value: 'zh', label: 'Chinese (Simplified)' },
            ]}
            // isDisabled={false}
            {...register('settings.language')}
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

      <Panel.ListGroup>
        <Panel.ListItem>
          <Panel.Field
            title='Freeze timer on end'
            description='When a timer hits 00:00:00, it freezes instead of going negative. It invalidates the End Message.'
          />
          <Controller
            control={control}
            name='viewSettings.freezeEnd'
            render={({ field: { onChange, value, ref } }) => (
              <Switch
                // variant='ontime' // No direct variant prop, styling via className or wrapper
                size='large' // Assuming 'lg' -> 'large'
                checked={value}
                onCheckedChange={onChange} // BaseSwitch uses onCheckedChange
                ref={ref}
              />
            )}
          />
        </Panel.ListItem>
        <Panel.ListItem>
          <Panel.Field
            title='End message'
            description='Message for negative timers; applies only if the timer isn`t frozen on End. If no message is provided, it continues into negative time'
          />
          <Input
            height='medium' // Assuming 'sm' -> 'medium'
            autoComplete='off'
            variant='subtle' // Assuming 'ontime-filled' -> 'subtle'
            maxLength={150}
            style={{ width: '20rem' }}
            placeholder='Shown when timer reaches end'
            {...register('viewSettings.endMessage')}
          />
        </Panel.ListItem>
      </Panel.ListGroup>
    </form>
  );

  const footerElements = (
    <>
      {errors?.root && <Panel.Error>{errors.root.message}</Panel.Error>}
      <Button
        variant='ghosted' // Assuming 'ontime-ghosted' -> 'ghosted'
        size='medium' // Assuming 'md' -> 'medium'
        onClick={onClose}
        disabled={false} // isDisabled prop
      >
        Cancel
      </Button>
      <Button
        variant='primary' // Assuming 'ontime-filled' -> 'primary'
        size='medium' // Assuming 'md' -> 'medium'
        type='submit'
        form='quick-start' // Link button to the form
        disabled={!isValid || isSubmitting} // isDisabled and isLoading props
        // isLoading={isSubmitting} // Button doesn't have isLoading, disable instead
      >
        Create project
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      title='Create new project...'
      onClose={onClose}
      bodyElements={bodyElements}
      footerElements={footerElements}
      showCloseButton
      // closeOnOverlayClick={false} // Modal prop 'dismissible' is false by default
      // maxWidth='max(640px, 40vw)' // Handle with Modal styling or wrapper
    />
  );
}
