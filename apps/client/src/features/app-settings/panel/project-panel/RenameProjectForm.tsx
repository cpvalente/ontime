import { FormControl, Input, Button } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

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
  }, []);

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className={style.form}>
        <FormControl className={style.formControl}>
          <Input defaultValue={filename} size='sm' type='text' variant='ontime-filled' {...register('filename')} />
        </FormControl>
        <div className={style.actionButtons}>
          <Button
            disabled={!isDirty || !isValid || isSubmitting}
            aria-label='Cancel duplicate project name'
            children='Cancel'
            onClick={onCancel}
            size='sm'
            variant='ontime-ghosted'
            className={style.cancelRenameButton}
          />
          <Button
            disabled={!isDirty || !isValid || isSubmitting}
            aria-label='Save duplicate project name'
            children='Save'
            onClick={handleSubmit(onSubmit)}
            size='sm'
            variant='ontime-filled'
          />
        </div>
      </form>
      {submitError ? <span className={style.error}>{submitError}</span> : null}
    </div>
  );
}
