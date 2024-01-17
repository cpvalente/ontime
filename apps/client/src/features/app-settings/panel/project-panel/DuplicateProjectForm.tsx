import { FormControl, Input, Button } from '@chakra-ui/react';
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
}

export default function DuplicateProjectForm({ filename, onSubmit, onCancel }: DuplicateProjectFormProps) {
  const {
    handleSubmit,
    register,
    formState: { isSubmitting, isDirty, isValid },
    setFocus,
  } = useForm<DuplicateProjectFormValues>({
    defaultValues: { newFilename: '' },
    values: { newFilename: '' },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  useEffect(() => {
    setFocus('newFilename');
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={style.form}>
      <div>
        <FormControl>
          <Input value={filename} id='filename' size='sm' type='text' variant='ontime-filled' disabled />
        </FormControl>
        <FormControl className={style.duplicateFormControl}>
          <Input
            id='newFilename'
            size='sm'
            type='text'
            variant='ontime-filled'
            placeholder='Duplicate file name'
            {...register('newFilename')}
          />
        </FormControl>
      </div>
      <div className={style.duplicateActionButtons}>
        <Button
          aria-label='Save duplicate project name'
          size='sm'
          variant='ontime-filled'
          disabled={!isDirty || !isValid || isSubmitting}
          type='submit'
          children='Save'
          className={style.saveButton}
        />
        <Button
          aria-label='Cancel duplicate project name'
          onClick={onCancel}
          size='sm'
          variant='ontime-ghosted'
          children='Cancel'
          disabled={!isDirty || !isValid || isSubmitting}
        />
      </div>
    </form>
  );
}
