import { ChangeEvent, Fragment, useEffect, useRef } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { IoDownloadOutline, IoTrash } from 'react-icons/io5';
import { Button, Input, Textarea } from '@chakra-ui/react';
import { type ProjectData } from 'ontime-types';

import { projectLogoPath } from '../../../../common/api/constants';
import { postProjectData, uploadProjectLogo } from '../../../../common/api/project';
import { maybeAxiosError } from '../../../../common/api/utils';
import useProjectData from '../../../../common/hooks-query/useProjectData';
import { preventEscape } from '../../../../common/utils/keyEvent';
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
    control,
    setValue,
  } = useForm({
    defaultValues: data,
    values: data,
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'custom',
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

  const handleAddCustom = () => {
    append({ title: '', value: '' });
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
    <Panel.Section as='form' onSubmit={handleSubmit(onSubmit)} onKeyDown={(event) => preventEscape(event, onReset)}>
      <Panel.Card>
        <Panel.SubHeader>
          Project data
          <Panel.InlineElements>
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
          </Panel.InlineElements>
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
                      isDisabled={isSubmitting || !watch('projectLogo')}
                      leftIcon={<IoTrash />}
                      onClick={handleDeleteLogo}
                      type='button'
                    >
                      Delete
                    </Button>
                  </>
                ) : (
                  <Button
                    variant='ontime-filled'
                    size='sm'
                    isDisabled={isSubmitting}
                    leftIcon={<IoDownloadOutline />}
                    onClick={handleClickUpload}
                    type='button'
                  >
                    Upload logo
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
          <Panel.ListItem>
            <Panel.Field title='Custom data' description='' />
            <Button variant='ontime-subtle' onClick={handleAddCustom}>
              +
            </Button>
          </Panel.ListItem>
          {fields.length === 0 && <p>Project has no metadata currently</p>}
          {fields.length > 0 &&
            fields.map((field, idx) => (
              <Panel.InlineElements key={field.id}>
                <Panel.Paragraph>{idx + 1}.</Panel.Paragraph>
                <label>
                  Title
                  <Input
                    variant='ontime-filled'
                    size='sm'
                    placeholder={field.title}
                    autoComplete='off'
                    {...register(`custom.${idx}.title`)}
                  />
                </label>
                <label>
                  Value
                  <Input
                    variant='ontime-filled'
                    size='sm'
                    placeholder={field.value}
                    autoComplete='off'
                    {...register(`custom.${idx}.value`)}
                  />
                </label>
                <Button variant='ontime-ghosted' onClick={() => remove(idx)}>
                  X
                </Button>
              </Panel.InlineElements>
            ))}
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
