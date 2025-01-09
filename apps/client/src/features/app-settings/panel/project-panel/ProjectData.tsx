import { ChangeEvent, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { IoDownloadOutline } from 'react-icons/io5';
import { IoTrash } from 'react-icons/io5';
import { Input, Textarea } from '@chakra-ui/react';
import { type ProjectData } from 'ontime-types';

import { projectLogoPath } from '../../../../common/api/constants';
import { postProjectData, uploadProjectLogo } from '../../../../common/api/project';
import { maybeAxiosError } from '../../../../common/api/utils';
import { Button } from '../../../../common/components/ui/button';
import useProjectData from '../../../../common/hooks-query/useProjectData';
import { validateLogo } from '../../../../common/utils/uploadUtils';
import { documentationUrl, websiteUrl } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';

import style from './ProjectPanel.module.scss';

export default function ProjectData() {
  const { data, status, refetch } = useProjectData();

  const {
    handleSubmit,
    register,
    reset,
    formState: { isSubmitting, isValid, isDirty, errors },
    setError,
    watch,
    setValue,
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

  const handleUploadProjectLogo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      validateLogo(file);
      const response = await uploadProjectLogo(file);

      setValue('projectLogo', response.data.logoFilename, {
        shouldDirty: true,
      });
    } catch (error) {
      const message = maybeAxiosError(error);
      setError('projectLogo', { message });
    }
  };

  const { ref, ...projectLogoRest } = register('projectLogo');

  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const handleClickUpload = () => {
    uploadInputRef.current?.click();
  };

  const handleDeleteLogo = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setValue('projectLogo', null, {
      shouldDirty: true,
    });
  };

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
            <Button variant='ontime-ghosted' size='sm' onClick={onReset} disabled={isSubmitting || !isDirty}>
              Revert to saved
            </Button>
            <Button
              variant='ontime-filled'
              size='sm'
              type='submit'
              disabled={!isDirty || !isValid}
              loading={isSubmitting}
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
          <Panel.Section style={{ marginTop: 0 }}>
            <label>
              Project logo
              <Input
                variant='ontime-filled'
                size='sm'
                type='file'
                style={{ display: 'none' }}
                accept='image/*'
                {...projectLogoRest}
                ref={(e) => {
                  ref(e);
                  uploadInputRef.current = e;
                }}
                onChange={handleUploadProjectLogo}
              />
              <Panel.Card className={style.uploadLogoCard}>
                {watch('projectLogo') ? (
                  <>
                    <img src={`${projectLogoPath}/${watch('projectLogo')}`} />
                    <Button
                      size='sm'
                      variant='ontime-filled'
                      disabled={isSubmitting || !watch('projectLogo')}
                      onClick={handleDeleteLogo}
                      type='button'
                    >
                      <IoTrash /> Delete
                    </Button>
                  </>
                ) : (
                  <Button
                    variant='ontime-filled'
                    size='sm'
                    disabled={isSubmitting}
                    onClick={handleClickUpload}
                    type='button'
                  >
                    <IoDownloadOutline /> Upload logo
                  </Button>
                )}
                {errors?.projectLogo?.message && <Panel.Error>{errors.projectLogo.message}</Panel.Error>}
              </Panel.Card>
            </label>
          </Panel.Section>
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
              placeholder={websiteUrl}
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
              placeholder={documentationUrl}
              autoComplete='off'
              {...register('backstageUrl')}
            />
          </label>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
