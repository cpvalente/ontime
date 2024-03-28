import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input } from '@chakra-ui/react';

import * as Panel from '../PanelUtils';

import style from './ProjectPanel.module.scss';

export type ProjectFormValues = {
  filename: string;
};

interface ProjectFormProps {
  action: 'duplicate' | 'rename';
  filename: string;
  onCancel: () => void;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
  submitError: string | null;
}

export default function ProjectForm({ action, filename, onSubmit, onCancel, submitError }: ProjectFormProps) {
  const {
    handleSubmit,
    register,
    formState: { isSubmitting, isDirty, isValid },
    setFocus,
  } = useForm<ProjectFormValues>({
    defaultValues: { filename },
    values: { filename },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  useEffect(() => {
    setFocus('filename');
  }, [setFocus]);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className={style.form}>
        <Input
          className={style.formInput}
          id='filename'
          size='sm'
          type='text'
          variant='ontime-filled'
          placeholder='Enter new name'
          autoComplete='off'
          {...register('filename')}
        />
        <div className={style.actionButtons}>
          <Button onClick={onCancel} size='sm' variant='ontime-ghosted' disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            size='sm'
            variant='ontime-filled'
            isDisabled={!isDirty || !isValid || isSubmitting}
            type='submit'
            className={style.saveButton}
          >
            {action}
          </Button>
        </div>
      </form>
      {submitError && <Panel.Error>{submitError}</Panel.Error>}
    </>
  );
}
