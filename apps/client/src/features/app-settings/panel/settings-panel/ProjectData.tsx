import { type ProjectData } from 'ontime-types';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { IoAdd, IoDownloadOutline, IoTrash } from 'react-icons/io5';

import { projectLogoPath } from '../../../../common/api/constants';
import { uploadProjectLogo } from '../../../../common/api/project';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Input from '../../../../common/components/input/input/Input';
import Textarea from '../../../../common/components/input/textarea/Textarea';
import useProjectData, { useUpdateProjectData } from '../../../../common/hooks-query/useProjectData';
import { preventEscape } from '../../../../common/utils/keyEvent';
import { validateLogo } from '../../../../common/utils/uploadUtils';
import { documentationUrl } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';

import style from './SettingsPanel.module.scss';

type PendingLogo = {
  file: File;
  previewUrl: string;
  uploadedFilename?: string;
};

export default function ProjectData() {
  const { data, status } = useProjectData();
  const { updateProjectData } = useUpdateProjectData();
  const [pendingLogo, setPendingLogo] = useState<PendingLogo | null>(null);

  const {
    handleSubmit,
    register,
    reset,
    formState: { isSubmitting, isValid, isDirty, errors },
    setError,
    clearErrors,
    watch,
    control,
    setValue,
  } = useForm({
    defaultValues: data,
    resetOptions: {
      keepDirtyValues: true,
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'custom',
  });

  // reset form values if data changes
  // Release the browser-managed preview URL when the selection changes or this form unmounts.
  useEffect(() => {
    if (data) {
      reset(data);
    }
  }, [data, reset]);

  useEffect(() => {
    return () => {
      if (pendingLogo) {
        URL.revokeObjectURL(pendingLogo.previewUrl);
      }
    };
  }, [pendingLogo]);

  const handleUploadProjectLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    clearErrors('logo');

    if (!file) {
      return;
    }

    try {
      validateLogo(file);
      setPendingLogo({
        file,
        previewUrl: URL.createObjectURL(file),
      });
    } catch (error) {
      const message = maybeAxiosError(error);
      setError('logo', { message });
    } finally {
      // Allow selecting the same local file again after an upload attempt.
      event.target.value = '';
    }
  };

  const { ref, ...projectLogoRest } = register('logo');

  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const handleClickUpload = () => {
    uploadInputRef.current?.click();
  };

  const handleDeleteLogo = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingLogo(null);
    setValue('logo', null, {
      shouldDirty: true,
    });
  };

  const handleAddCustom = () => {
    append({ title: '', value: '', url: '' });
  };

  const uploadPendingLogo = async () => {
    if (!pendingLogo) {
      return null;
    }

    if (pendingLogo.uploadedFilename) {
      return pendingLogo.uploadedFilename;
    }

    const response = await uploadProjectLogo(pendingLogo.file);
    const uploadedFilename = response.data.logoFilename;
    setPendingLogo((currentPendingLogo) =>
      currentPendingLogo?.file === pendingLogo.file ? { ...currentPendingLogo, uploadedFilename } : currentPendingLogo,
    );
    return uploadedFilename;
  };

  const onSubmit = async (formData: ProjectData) => {
    try {
      clearErrors();
      const logo = (await uploadPendingLogo()) ?? formData.logo;
      await updateProjectData({ ...formData, logo });
      setPendingLogo(null);
    } catch (error) {
      const message = maybeAxiosError(error);
      setError('root', { message });
    }
  };

  // reset data to the initial state
  const onReset = () => {
    setPendingLogo(null);
    reset(data);
  };

  const isLoading = status === 'pending';
  const logo = watch('logo');

  return (
    <Panel.Section as='form' onSubmit={handleSubmit(onSubmit)} onKeyDown={(event) => preventEscape(event, onReset)}>
      <Panel.Card>
        <Panel.SubHeader>
          Project data
          <Panel.InlineElements>
            <Button onClick={onReset} disabled={isSubmitting || !isDirty}>
              Revert to saved
            </Button>
            <Button
              variant='primary'
              type='submit'
              disabled={(!isDirty && !pendingLogo) || !isValid}
              loading={isSubmitting}
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
              fluid
              maxLength={50}
              placeholder='Project title is shown in production views'
              {...register('title')}
            />
          </label>
          <Panel.Section style={{ marginTop: 0 }}>
            <label>
              Project logo
              <input
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
                {logo || pendingLogo ? (
                  <>
                    <img src={pendingLogo ? pendingLogo.previewUrl : `${projectLogoPath}/${logo}`} />
                    <div className={style.logoActions}>
                      <Button disabled={isSubmitting} onClick={handleClickUpload} type='button'>
                        <IoDownloadOutline />
                        Replace logo
                      </Button>
                      <Button
                        variant='subtle-destructive'
                        disabled={isSubmitting || (!logo && !pendingLogo)}
                        onClick={handleDeleteLogo}
                        type='button'
                      >
                        <IoTrash />
                        Delete
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button disabled={isSubmitting} onClick={handleClickUpload} type='button'>
                    <IoDownloadOutline />
                    Upload logo
                  </Button>
                )}
                {errors?.logo?.message && <Panel.Error>{errors.logo.message}</Panel.Error>}
              </Panel.Card>
            </label>
          </Panel.Section>

          <label>
            Project description
            <Input fluid maxLength={100} placeholder='Euro Love, Malmö 2024' {...register('description')} />
          </label>
          <label>
            Project info
            <Textarea
              fluid
              maxLength={150}
              placeholder='Wi-Fi password: 1234'
              resize='vertical'
              {...register('info')}
            />
          </label>
          <label>
            Project QR code URL
            <Input fluid placeholder={documentationUrl} {...register('url')} />
          </label>
          <Panel.Section style={{ marginTop: 0 }}>
            <Panel.ListItem>
              <Panel.Field title='Custom data' description='' />
              <Button onClick={handleAddCustom}>
                Add <IoAdd />
              </Button>
            </Panel.ListItem>
            {fields.length > 0 &&
              fields.map((field, idx) => {
                const rowErrors = errors.custom?.[idx] as
                  | {
                      title?: { message?: string };
                      value?: { message?: string };
                    }
                  | undefined;
                return (
                  <div key={field.id} className={style.customDataItem}>
                    <div className={style.titleRow}>
                      <label className={style.title}>
                        Title
                        <Input
                          fluid
                          defaultValue={field.title}
                          placeholder='Title of your custom data'
                          {...register(`custom.${idx}.title`, {
                            required: { value: true, message: 'Field cannot be empty' },
                          })}
                        />
                      </label>
                      <Button variant='subtle-destructive' onClick={() => remove(idx)}>
                        <IoTrash />
                        Delete
                      </Button>
                    </div>
                    {rowErrors?.title?.message && <Panel.Error>{rowErrors.title.message}</Panel.Error>}
                    <label>
                      Text
                      <Textarea
                        fluid
                        rows={3}
                        resize='vertical'
                        defaultValue={field.value}
                        placeholder='Text of your custom data'
                        {...register(`custom.${idx}.value`, {
                          required: { value: true, message: 'Field cannot be empty' },
                        })}
                      />
                      {rowErrors?.value?.message && <Panel.Error>{rowErrors.value.message}</Panel.Error>}
                    </label>
                    <label>
                      Image URL (optional)
                      <div className={style.customImage}>
                        <Input
                          fluid
                          defaultValue={field.url}
                          placeholder='Paste image URL (optional)'
                          {...register(`custom.${idx}.url`)}
                        />
                        <div className={style.imageContainer}>
                          {watch(`custom.${idx}.url`) && (
                            <img src={watch(`custom.${idx}.url`)} alt='' loading='lazy' className='info__image' />
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                );
              })}
          </Panel.Section>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
