import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, Textarea } from '@chakra-ui/react';
import { type ProjectData } from 'ontime-types';

import { postProjectData } from '../../../../common/api/project';
import { maybeAxiosError } from '../../../../common/api/utils';
import useProjectData from '../../../../common/hooks-query/useProjectData';
import * as Panel from '../PanelUtils';

import style from './ProjectPanel.module.scss';

export default function ProjectData() {
  const { data, refetch } = useProjectData();

  const {
    handleSubmit,
    register,
    reset,
    formState: { isSubmitting, isValid, isDirty },
    setError,
  } = useForm({
    defaultValues: data,
    values: data,
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  // reset form values if data changes
  useEffect(() => {
    if (data) {
      reset(data);
    }
  }, [data, reset]);

  const onSubmit = async (formData: ProjectData) => {
    try {
      await postProjectData(formData);
    } catch (error) {
      const message = maybeAxiosError(error);
      setError('root', { message });
    } finally {
      await refetch();
    }
  };

  const onReset = () => {
    reset(data);
  };
  return (
    <Panel.Section as='form' onSubmit={handleSubmit(onSubmit)}>
      <Panel.Card>
        <Panel.SubHeader>
          Project Data
          <div className={style.headerButtons}>
            <Button variant='ontime-ghosted' size='sm' onClick={onReset} isDisabled={isSubmitting || !isDirty}>
              Revert to saved
            </Button>
            <Button
              variant='ontime-filled'
              size='sm'
              type='submit'
              isDisabled={!isDirty || !isValid}
              isLoading={isSubmitting}
            >
              Save
            </Button>
          </div>
        </Panel.SubHeader>
        <Panel.Divider />
        <Panel.Section>
          <div className={style.createFormInputField}>
            <label>
              Project title
              <Input
                variant='ontime-filled'
                size='sm'
                maxLength={50}
                placeholder='Your project name'
                autoComplete='off'
                {...register('title')}
              />
            </label>
          </div>
          <div className={style.createFormInputField}>
            <label>
              Project description
              <Input
                variant='ontime-filled'
                size='sm'
                maxLength={100}
                placeholder='Euro Love, Malmö 2024'
                autoComplete='off'
                {...register('description')}
              />
            </label>
          </div>
          <div className={style.createFormInputField}>
            <label>
              Public info
              <Textarea
                variant='ontime-filled'
                size='sm'
                maxLength={150}
                placeholder='Shows always start ontime'
                autoComplete='off'
                resize='none'
                {...register('publicInfo')}
              />
            </label>
          </div>
          <div className={style.createFormInputField}>
            <label>
              Public QR code URL
              <Input
                variant='ontime-filled'
                size='sm'
                placeholder='www.getontime.no'
                autoComplete='off'
                {...register('publicUrl')}
              />
            </label>
          </div>
          <div className={style.createFormInputField}>
            <label>
              Backstage info
              <Textarea
                variant='ontime-filled'
                size='sm'
                maxLength={150}
                placeholder='Wi-Fi password: 1234'
                autoComplete='off'
                resize='none'
                {...register('backstageInfo')}
              />
            </label>
          </div>
          <div className={style.createFormInputField}>
            <label>
              Backstage QR code URL
              <Input
                variant='ontime-filled'
                size='sm'
                placeholder='www.ontime.gitbook.io'
                autoComplete='off'
                {...register('backstageUrl')}
              />
            </label>
          </div>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
