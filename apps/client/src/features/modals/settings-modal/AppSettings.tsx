import { useForm } from 'react-hook-form';
import { Input, Select } from '@chakra-ui/react';
import type { Settings } from 'ontime-types';

import { postSettings } from '../../../common/api/ontimeApi';
import useSettings from '../../../common/hooks-query/useSettings';
import { useEmitLog } from '../../../common/stores/logger';
import { isOnlyNumbers } from '../../../common/utils/regex';
import ModalSplitInput from '../ModalSplitInput';
import OntimeModalFooter from '../OntimeModalFooter';

import ModalPinInput from './ModalPinInput';

import style from './SettingsModal.module.scss';

export default function AppSettingsModal() {
  const { data, status, refetch } = useSettings();
  const { emitError } = useEmitLog();
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<Settings>({
    defaultValues: data,
    values: data,
  });

  const onSubmit = async (formData: Settings) => {
    try {
      await postSettings(formData);
    } catch (error) {
      emitError(`Error saving settings: ${error}`);
    } finally {
      await refetch();
    }
  };

  const onReset = () => {
    reset(data);
  };

  const disableInputs = status === 'loading';

  return (
    <form onSubmit={handleSubmit(onSubmit)} id='app-settings' className={style.sectionContainer}>
      <ModalSplitInput
        field='serverPort'
        title='Ontime is available on port'
        description='Default 4001'
        error={errors.serverPort?.message}
      >
        <Input
          width='75px'
          size='sm'
          textAlign='right'
          maxLength={5}
          disabled
          variant='ontime-filled-on-light'
          {...register('serverPort', {
            required: { value: true, message: 'Required field' },
            max: { value: 65535, message: 'Port in incorrect range (1024 - 65535)' },
            min: { value: 1024, message: 'Port in incorrect range (1024 - 65535)' },
            pattern: {
              value: isOnlyNumbers,
              message: 'Value should be numeric',
            },
          })}
        />
      </ModalSplitInput>
      <ModalSplitInput
        field='editorKey'
        title='Editor pin code'
        description='Protect the editor with a pin code'
        error={errors.editorKey?.message}
      >
        <ModalPinInput register={register} formName='editorKey' isDisabled={disableInputs} />
      </ModalSplitInput>
      <ModalSplitInput
        field='operatorKey'
        title='Operator pin code'
        description='Protect the cuesheet with a pin code'
        error={errors.operatorKey?.message}
      >
        <ModalPinInput register={register} formName='operatorKey' isDisabled={disableInputs} />
      </ModalSplitInput>
      <div style={{ height: '16px' }} />
      <ModalSplitInput
        field='timeFormat'
        title='Time Format'
        description='Views 12 / 24 hours'
        error={errors.timeFormat?.message}
      >
        <Select backgroundColor='white' size='sm' width='auto' isDisabled={disableInputs} {...register('timeFormat')}>
          <option value='12'>12 hours eg. 11:00:10 PM</option>
          <option value='24'>24 hours eg. 23:00:10</option>
        </Select>
      </ModalSplitInput>
      <ModalSplitInput
        field='language'
        title='Views Language'
        description='Language for static fields in views'
        error={errors.language?.message}
      >
        <Select backgroundColor='white' size='sm' width='auto' isDisabled={disableInputs} {...register('language')}>
          <option value='en'>English</option>
          <option value='de'>German</option>
          <option value='no'>Norwegian</option>
        </Select>
      </ModalSplitInput>
      <OntimeModalFooter
        formId='app-settings'
        handleRevert={onReset}
        isDirty={isDirty}
        isValid={isValid}
        isSubmitting={isSubmitting}
      />
    </form>
  );
}
