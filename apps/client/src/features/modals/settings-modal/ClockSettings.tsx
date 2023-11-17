import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Input, Select } from '@chakra-ui/react';
import { ClockSource, type Settings } from 'ontime-types';

import { logAxiosError } from '../../../common/api/apiUtils';
import { postSettings } from '../../../common/api/ontimeApi';
import useSettings from '../../../common/hooks-query/useSettings';
import ModalLoader from '../modal-loader/ModalLoader';
import ModalSplitInput from '../ModalSplitInput';
import OntimeModalFooter from '../OntimeModalFooter';

import style from './SettingsModal.module.scss';

export default function ClockSettingsModal() {
  const { data, status, isFetching, refetch } = useSettings();
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<Settings>({
    defaultValues: data,
    values: data,
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  useEffect(() => {
    if (data) {
      reset(data);
    }
  }, [data, reset]);

  const onSubmit = async (formData: Settings) => {
    try {
      await postSettings(formData);
    } catch (error) {
      logAxiosError('Error saving settings', error);
    } finally {
      await refetch();
    }
  };

  const onReset = () => {
    reset(data);
  };

  const disableInputs = status === 'loading';

  if (isFetching) {
    return <ModalLoader />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} id='app-settings' className={style.sectionContainer}>
      <ModalSplitInput
        field='clockSettings.source'
        title='Clock Source'
        description='Language for static fields in views'
        error={errors.clockSettings?.message}
      >
        <Select
          backgroundColor='white'
          size='sm'
          width='auto'
          isDisabled={disableInputs}
          defaultValue={data?.clockSettings.source}
          {...register('clockSettings.source')}
        >
          <option value={ClockSource.System}>System</option>
          <option value={ClockSource.MIDI}>MIDI</option>
          <option value={ClockSource.NTP}>NTP</option>
        </Select>
      </ModalSplitInput>
      <div>

      {data?.clockSettings.source}
      </div>
      <ModalSplitInput
        field='clockSettings.settings'
        title='Clock input settings'
        description='Midi port/NTP source'
        error={errors.clockSettings?.message}
      >
        <Input
          size='sm'
          width='auto'
          variant='ontime-filled-on-light'
          placeholder={data?.clockSettings.settings}
          isDisabled={disableInputs}
          {...register('clockSettings.settings')}
        />
      </ModalSplitInput>
      <ModalSplitInput
        field='clockSettings.offset'
        title='Clock offset'
        description='Clock offset'
        error={errors.clockSettings?.message}
      >
        <Input
          size='sm'
          width='auto'
          type='number'
          variant='ontime-filled-on-light'
          isDisabled={disableInputs}
          {...register('clockSettings.offset')}
        />
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
