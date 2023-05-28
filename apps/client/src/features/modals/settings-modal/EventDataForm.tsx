import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Input, Textarea } from '@chakra-ui/react';
import { EventData } from 'ontime-types';

import { postEventData } from '../../../common/api/eventDataApi';
import useEventData from '../../../common/hooks-query/useEventData';
import { useEmitLog } from '../../../common/stores/logger';
import ModalLoader from '../modal-loader/ModalLoader';
import { inputProps } from '../modalHelper';
import ModalInput from '../ModalInput';
import OntimeModalFooter from '../OntimeModalFooter';

import style from './SettingsModal.module.scss';

export default function EventDataForm() {
  const { data, status, isFetching, refetch } = useEventData();
  const { emitError } = useEmitLog();
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<EventData>({
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

  const onSubmit = async (formData: EventData) => {
    try {
      await postEventData(formData);
    } catch (error) {
      emitError(`Error saving event settings: ${error}`);
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
    <form onSubmit={handleSubmit(onSubmit)} id='event-data' className={style.sectionContainer}>
      <ModalInput
        field='title'
        title='Event title'
        description='Shown in overview screens'
        error={errors.title?.message}
      >
        <Input
          {...inputProps}
          variant='ontime-filled-on-light'
          maxLength={50}
          placeholder='Eurovision song contest'
          isDisabled={disableInputs}
          {...register('title')}
        />
      </ModalInput>
      <div style={{ height: '16px' }} />
      <ModalInput field='publicInfo' title='Public Info' description='Information shown in public screens'>
        <Textarea
          {...inputProps}
          variant='ontime-filled-on-light'
          maxLength={150}
          placeholder='Shows always start ontime'
          isDisabled={disableInputs}
          {...register('publicInfo')}
        />
      </ModalInput>
      <ModalInput field='publicUrl' title='Public URL' description='QR code to be shown on public screens'>
        <Input
          {...inputProps}
          variant='ontime-filled-on-light'
          placeholder='www.getontime.no'
          isDisabled={disableInputs}
          {...register('publicUrl')}
        />
      </ModalInput>
      <div style={{ height: '16px' }} />
      <ModalInput field='backstageInfo' title='Backstage Info' description='Information shown in public screens'>
        <Textarea
          {...inputProps}
          variant='ontime-filled-on-light'
          maxLength={150}
          placeholder='Wi-Fi password: 1234'
          isDisabled={disableInputs}
          {...register('backstageInfo')}
        />
      </ModalInput>
      <ModalInput field='backstageUrl' title='Backstage URL' description='QR code to be shown on public screens'>
        <Input
          {...inputProps}
          variant='ontime-filled-on-light'
          size='sm'
          placeholder='www.ontime.gitbook.io'
          isDisabled={disableInputs}
          {...register('backstageUrl')}
        />
      </ModalInput>
      <OntimeModalFooter
        formId='event-data'
        handleRevert={onReset}
        isDirty={isDirty}
        isValid={isValid}
        isSubmitting={isSubmitting}
      />
    </form>
  );
}
