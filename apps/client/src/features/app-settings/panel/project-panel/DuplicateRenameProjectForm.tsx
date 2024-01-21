import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input } from '@chakra-ui/react';

import style from './ProjectPanel.module.scss';

export type DuplicateRenameProjectFormValues = {
  filename: string;
};

interface DuplicateRenameProjectFormProps {
  action: 'duplicate' | 'rename';
  filename: string;
  onCancel: () => void;
  onSubmit: (values: DuplicateRenameProjectFormValues) => Promise<void>;
  submitError: string | null;
}

export default function DuplicateRenameProjectForm({
  action,
  filename,
  onSubmit,
  onCancel,
  submitError,
}: DuplicateRenameProjectFormProps) {
  const {
    handleSubmit,
    register,
    formState: { isSubmitting, isDirty, isValid },
    setFocus,
  } = useForm<DuplicateRenameProjectFormValues>({
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
            {action === 'duplicate' ? 'Duplicate' : 'Rename'}
          </Button>
        </div>
      </form>
      {submitError && <span className={style.error}>{submitError}</span>}
    </>
  );
}
