import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Input, Textarea } from '@chakra-ui/react';
import { ProjectData } from 'ontime-types';

import { logAxiosError } from '../../../common/api/apiUtils';
import { postProjectData } from '../../../common/api/projectDataApi';
import useProjectData from '../../../common/hooks-query/useProjectData';
import ModalLoader from '../modal-loader/ModalLoader';
import { inputProps } from '../modalHelper';
import ModalInput from '../ModalInput';
import OntimeModalFooter from '../OntimeModalFooter';

import style from './SettingsModal.module.scss';

export default function ProjectDataForm() {
  const { data, status, isFetching, refetch } = useProjectData();
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<ProjectData>({
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

  const onSubmit = async (formData: ProjectData) => {
    try {
      await postProjectData(formData);
    } catch (error) {
      logAxiosError('Error saving project data', error);
    } finally {
      await refetch();
    }
  };

  const onReset = () => {
    reset(data);
  };

  const disableInputs = status === 'pending';

  if (isFetching) {
    return <ModalLoader />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} id='project-data' className={style.sectionContainer}>
      <ModalInput
        field='title'
        title='Project title'
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
      <ModalInput
        field='description'
        title='Project description'
        description='Free field, shown in editor'
        error={errors.description?.message}
      >
        <Input
          {...inputProps}
          variant='ontime-filled-on-light'
          maxLength={100}
          placeholder='Euro Love, Malmö 2024'
          isDisabled={disableInputs}
          {...register('description')}
        />
      </ModalInput>
      <div style={{ height: '16px' }} />
      <ModalInput field='publicInfo' title='Public info' description='Information shown in public screens'>
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
      <ModalInput field='backstageInfo' title='Backstage info' description='Information shown in public screens'>
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
        formId='project-data'
        handleRevert={onReset}
        isDirty={isDirty}
        isValid={isValid}
        isSubmitting={isSubmitting}
      />
    </form>
  );
}
