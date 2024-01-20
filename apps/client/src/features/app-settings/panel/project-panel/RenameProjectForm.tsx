import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input } from '@chakra-ui/react';

import style from './ProjectPanel.module.scss';

export type RenameProjectFormValues = {
  filename: string;
};

interface RenameProjectFormProps {
  filename: string;
  onSubmit: (values: RenameProjectFormValues) => Promise<void>;
  onCancel: () => void;
  submitError: string | null;
}

export default function RenameProjectForm({ filename, onSubmit, onCancel, submitError }: RenameProjectFormProps) {
  const {
    handleSubmit,
    register,
    formState: { isSubmitting, isDirty, isValid },
    setFocus,
  } = useForm<RenameProjectFormValues>({
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
          defaultValue={filename}
          size='sm'
          type='text'
          placeholder='Enter new name'
          variant='ontime-filled'
          {...register('filename')}
        />
        <div className={style.actionButtons}>
          <Button
            isDisabled={isSubmitting}
            onClick={onCancel}
            size='sm'
            variant='ontime-ghosted'
            className={style.cancelRenameButton}
          >
            Cancel
          </Button>
          <Button
            isDisabled={!isDirty || !isValid || isSubmitting}
            onClick={handleSubmit(onSubmit)}
            size='sm'
            variant='ontime-filled'
          >
            Rename
          </Button>
        </div>
      </form>
      {submitError && <span className={style.error}>{submitError}</span>}
    </>
  );
}
