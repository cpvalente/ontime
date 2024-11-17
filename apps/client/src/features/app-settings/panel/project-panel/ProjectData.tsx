import { ChangeEvent, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, Textarea } from '@chakra-ui/react';
import { IoDownloadOutline } from '@react-icons/all-files/io5/IoDownloadOutline';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';
import { type ProjectData } from 'ontime-types';

import { projectLogoPath } from '../../../../common/api/constants';
import { postProjectData, uploadProjectLogo } from '../../../../common/api/project';
import { maybeAxiosError } from '../../../../common/api/utils';
import useProjectData from '../../../../common/hooks-query/useProjectData';
import { validateLogo } from '../../../../common/utils/uploadUtils';
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

  const uploadInputRef = useRef<HTMLInputElement>(null);

  const handleClickUpload = () => {
    uploadInputRef.current?.click();
  };

  const handleDeleteLogo = () => {
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
          <Panel.Section style={{ marginTop: 0 }}>
            <label>
              Project logo
              <Panel.Card>
                <div className={style.uploadLogoContainer}>
                  <div>
                    <Input
                      variant='ontime-filled'
                      size='sm'
                      type='file'
                      style={{ display: 'none' }}
                      accept='image/*'
                      onChange={handleUploadProjectLogo}
                      ref={uploadInputRef}
                    />
                    <div>
                      <div className={style.uploadLogoSection}>
                        <Button
                          variant='ontime-filled'
                          size='sm'
                          leftIcon={<IoDownloadOutline />}
                          onClick={handleClickUpload}
                          type='button'
                        >
                          Upload logo
                        </Button>
                        <Button
                          size='sm'
                          variant='ontime-filled'
                          isDisabled={isSubmitting || !watch('projectLogo')}
                          leftIcon={<IoTrash />}
                          onClick={handleDeleteLogo}
                          type='button'
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                  {watch('projectLogo') && <img src={`${projectLogoPath}/${watch('projectLogo')}`} width={100} />}
                </div>
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
