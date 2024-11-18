import { Controller, useForm } from 'react-hook-form';
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Switch,
} from '@chakra-ui/react';
import { QuickStartData } from 'ontime-types';
import { parseUserTime } from 'ontime-utils';

import { quickProject } from '../../../common/api/db';
import { invalidateAllCaches, maybeAxiosError } from '../../../common/api/utils';
import TimeInput from '../../../common/components/input/time-input/TimeInput';
import { editorSettingsDefaults, useEditorSettings } from '../../../common/stores/editorSettings';
import * as Panel from '../panel-utils/PanelUtils';

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false} variant='ontime'>
      <ModalOverlay />
      <ModalCloseButton />
      <ModalContent maxWidth='max(640px, 40vw)'>
        <form onSubmit={handleSubmit(onSubmit)} id='quick-start'>
          <ModalHeader>Create new project...</ModalHeader>
          <ModalBody className={style.scrollContainer}>
            <ModalCloseButton />
            <Panel.ListGroup>
              <Panel.ListItem>
                <Panel.Field title='Project title' description='Shown as the title in some views' />
                <Input
                  variant='ontime-filled'
                  size='sm'
                  maxLength={150}
                  placeholder='Project title'
                  autoComplete='off'
                  width='20rem'
                  {...register('project.title')}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field
                  title='Time format'
                  description='Default time format to show in views 12 /24 hours'
                  error={errors.settings?.timeFormat?.message}
                />
                <Select variant='ontime' size='sm' width='auto' isDisabled={false} {...register('settings.timeFormat')}>
                  <option value='12'>12 hours 11:00:10 PM</option>
                  <option value='24'>24 hours 23:00:10</option>
                </Select>
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field
                  title='Views language'
                  description='Language to be displayed in views'
                  error={errors.settings?.language?.message}
                />
                <Select variant='ontime' size='sm' width='auto' isDisabled={false} {...register('settings.language')}>
                  <option value='en'>English</option>
                  <option value='fr'>French</option>
                  <option value='de'>German</option>
                  <option value='hu'>Hungarian</option>
                  <option value='it'>Italian</option>
                  <option value='no'>Norwegian</option>
                  <option value='pt'>Portuguese</option>
                  <option value='es'>Spanish</option>
                  <option value='sv'>Swedish</option>
                  <option value='pl'>Polish</option>
                  <option value='zh'>Chinese (Simplified)</option>
                </Select>
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
                    <Switch variant='ontime' size='lg' isChecked={value} onChange={onChange} ref={ref} />
                  )}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field
                  title='End message'
                  description='Message for negative timers; applies only if the timer isn`t frozen on End. If no message is provided, it continues into negative time'
                />
                <Input
                  size='sm'
                  autoComplete='off'
                  variant='ontime-filled'
                  maxLength={150}
                  width='20rem'
                  placeholder='Shown when timer reaches end'
                  {...register('viewSettings.endMessage')}
                />
              </Panel.ListItem>
            </Panel.ListGroup>
          </ModalBody>
          <ModalFooter>
            {errors?.root && <Panel.Error>{errors.root.message}</Panel.Error>}
            <Button variant='ontime-ghosted' size='md' onClick={onClose} isDisabled={false}>
              Cancel
            </Button>
            <Button variant='ontime-filled' size='md' type='submit' isDisabled={!isValid} isLoading={isSubmitting}>
              Create project
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
