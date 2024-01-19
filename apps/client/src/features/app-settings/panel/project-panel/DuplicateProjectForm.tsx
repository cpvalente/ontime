import { Input, Button } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import style from './ProjectPanel.module.scss';

export type DuplicateProjectFormValues = {
  newFilename: string;
};

interface DuplicateProjectFormProps {
  filename: string;
  onCancel: () => void;
  onSubmit: (values: DuplicateProjectFormValues) => Promise<void>;
  submitError: string | null;
}

export default function DuplicateProjectForm({ filename, onSubmit, onCancel, submitError }: DuplicateProjectFormProps) {
  const {
    handleSubmit,
    register,
    formState: { isSubmitting, isDirty, isValid },
    setFocus,
  } = useForm<DuplicateProjectFormValues>({
    defaultValues: { newFilename: filename },
    values: { newFilename: filename },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  useEffect(() => {
    setFocus('newFilename');
  }, []);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className={style.form}>
        <Input
          className={style.formInput}
          id='newFilename'
          size='sm'
          type='text'
          variant='ontime-filled'
          placeholder='Enter new name'
          {...register('newFilename')}
        />
        <div className={style.actionButtons}>
          <Button onClick={onCancel} size='sm' variant='ontime-ghosted' children='Cancel' disabled={isSubmitting} />
          <Button
            size='sm'
            variant='ontime-filled'
            isDisabled={!isDirty || !isValid || isSubmitting}
            type='submit'
            children='Duplicate'
            className={style.saveButton}
          />
        </div>
      </form>
      {submitError && <span className={style.error}>{submitError}</span>}
    </>
  );
}
