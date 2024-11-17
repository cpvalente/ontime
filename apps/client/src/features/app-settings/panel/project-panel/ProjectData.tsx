import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, Textarea } from '@chakra-ui/react';
import { type ProjectData } from 'ontime-types';

import { postProjectData } from '../../../../common/api/project';
import { maybeAxiosError } from '../../../../common/api/utils';
import useProjectData from '../../../../common/hooks-query/useProjectData';
import * as Panel from '../../panel-utils/PanelUtils';

import style from './ProjectPanel.module.scss';

export default function ProjectData() {
  const { data, status, refetch } = useProjectData();
  const [imageBase64, setImageBase64] = useState<string | null>(null);

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (formData: ProjectData) => {
    try {
      if (imageBase64) {
        formData.projectImage = imageBase64;
      }

      await postProjectData(formData);
    } catch (error) {
      const message = maybeAxiosError(error);
      setError('root', { message });
    } finally {
      await refetch();
    }
  };

  // populate with new data if we get an update
  const onReset = () => {
    reset(data);
  };

  const isLoading = status === 'pending';

  return (
    <Panel.Section as='form' onSubmit={handleSubmit(onSubmit)}>
      <Panel.Card>
        <Panel.SubHeader>
          Project data
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
          <Panel.Loader isLoading={isLoading} />
          <label>
            Project title
            <Input
              variant='ontime-filled'
              size='sm'
              maxLength={50}
              placeholder='Project title is shown in production views'
              autoComplete='off'
              {...register('title')}
            />
          </label>
          <label>
            Image
            <Input variant='ontime-filled' size='sm' type='file' accept='image/*' onChange={handleFileChange} />
          </label>
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
          <label>
            Backstage QR code URL
            <Input
              variant='ontime-filled'
              size='sm'
              placeholder='http://docs.getontime.no'
              autoComplete='off'
              {...register('backstageUrl')}
            />
          </label>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
