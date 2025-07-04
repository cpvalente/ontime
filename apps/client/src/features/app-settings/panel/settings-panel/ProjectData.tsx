import { ChangeEvent, useEffect, useRef } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { IoAdd, IoDownloadOutline, IoTrash } from 'react-icons/io5';
import { type ProjectData } from 'ontime-types';

import { projectLogoPath } from '../../../../common/api/constants';
import { postProjectData, uploadProjectLogo } from '../../../../common/api/project';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Input from '../../../../common/components/input/input/Input';
import Textarea from '../../../../common/components/input/textarea/Textarea';
import useProjectData from '../../../../common/hooks-query/useProjectData';
import { preventEscape } from '../../../../common/utils/keyEvent';
import { validateLogo } from '../../../../common/utils/uploadUtils';
import { documentationUrl } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';

import style from './SettingsPanel.module.scss';

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
    mode: 'onChange',
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
            <Button onClick={onReset} disabled={isSubmitting || !isDirty}>
              Revert to saved
            </Button>
            <Button variant='primary' type='submit' disabled={!isDirty || !isValid} loading={isSubmitting}>
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
                {watch('projectLogo') ? (
                  <>
                    <img src={`${projectLogoPath}/${watch('projectLogo')}`} />
                    <Button
                      variant='subtle-destructive'
                      disabled={isSubmitting || !watch('projectLogo')}
                      onClick={handleDeleteLogo}
                    >
                      <IoTrash />
                      Delete
                    </Button>
                  </>
                ) : (
                  <Button disabled={isSubmitting} onClick={handleClickUpload} type='button'>
                    <IoDownloadOutline />
                    Upload logo
                  </Button>
                )}
                {errors?.projectLogo?.message && <Panel.Error>{errors.projectLogo.message}</Panel.Error>}
              </Panel.Card>
            </label>
          </Panel.Section>

          <label>
            Project description
            <Input fluid maxLength={100} placeholder='Euro Love, Malmö 2024' {...register('description')} />
          </label>
          <label>
            Backstage info
            <Textarea
              fluid
              maxLength={150}
              placeholder='Wi-Fi password: 1234'
              resize='vertical'
              {...register('backstageInfo')}
            />
          </label>
          <label>
            Backstage QR code URL
            <Input fluid placeholder={documentationUrl} {...register('backstageUrl')} />
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
                      <label>
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
                        Delete Entry
                      </Button>
                    </div>
                    {rowErrors?.title?.message && <Panel.Error>{rowErrors.title.message}</Panel.Error>}
                    <label>
                      Value
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
                  </div>
                );
              })}
          </Panel.Section>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
