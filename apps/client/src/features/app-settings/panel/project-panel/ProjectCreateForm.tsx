import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, Textarea } from '@chakra-ui/react';

import style from './ProjectPanel.module.scss';

export type ProjectCreateFormValues = {
  title: string;
  description?: string;
  publicInfo?: string;
  publicUrl?: string;
  backstageInfo?: string;
  backstageUrl?: string;
};

interface ProjectCreateFormProps {
  onCancel: () => void;
  onSubmit: (values: ProjectCreateFormValues) => Promise<void>;
  submitError: string | null;
}

export default function ProjectCreateForm({ onSubmit, onCancel, submitError }: ProjectCreateFormProps) {
  const {
    handleSubmit,
    register,
    formState: { isSubmitting, isDirty, isValid },
    setFocus,
  } = useForm<ProjectCreateFormValues>({
    defaultValues: { title: '' },
    values: { title: '' },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  useEffect(() => {
    setFocus('title');
  }, [setFocus]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className={style.createFormInputField}>
        <label>
          Project title
          <Input
            variant='ontime-filled'
            size='sm'
            maxLength={50}
            placeholder='Your project name'
            required
            minLength={1}
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
            {...register('publicInfo')}
          />
        </label>
      </div>
      <div className={style.createFormInputField}>
        <label>
          Public QR code Url
          <Input variant='ontime-filled' size='sm' placeholder='www.getontime.no' {...register('publicUrl')} />
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
            {...register('backstageInfo')}
          />
        </label>
      </div>
      <div className={style.createFormInputField}>
        <label>
          Backstage QR code Url
          <Input variant='ontime-filled' size='sm' placeholder='www.ontime.gitbook.io' {...register('backstageUrl')} />
        </label>
      </div>
      <div className={style.createActionButtons}>
        <Button onClick={onCancel} variant='ontime-ghosted' size='sm'>
          Cancel
        </Button>
        <Button
          isDisabled={!isDirty || !isValid}
          type='submit'
          isLoading={isSubmitting}
          variant='ontime-filled'
          padding='0 2em'
          size='sm'
        >
          Create
        </Button>
      </div>
      {submitError && <span className={style.error}>{submitError}</span>}
    </form>
  );
}
