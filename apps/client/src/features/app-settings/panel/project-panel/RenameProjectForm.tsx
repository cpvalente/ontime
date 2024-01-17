import { FormControl, Input, Button } from '@chakra-ui/react';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import style from './ProjectPanel.module.scss';

export type RenameProjectFormValues = {
  filename: string;
};

interface RenameProjectFormProps {
  filename: string;
  onSubmit: (values: RenameProjectFormValues) => Promise<void>;
  onCancel: () => void;
}

export default function RenameProjectForm({ filename, onSubmit, onCancel }: RenameProjectFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    handleSubmit,
    register,
    formState: { isSubmitting, isDirty, isValid },
  } = useForm<RenameProjectFormValues>({
    defaultValues: { filename },
    values: { filename },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const { ref, ...filenameInput } = register('filename');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={style.form}>
      <FormControl className={style.formControl}>
        <Input
          defaultValue={filename}
          size='sm'
          type='text'
          variant='ontime-filled'
          {...filenameInput}
          ref={inputRef}
        />
      </FormControl>
      <div className={style.actionButtons}>
        <Button
          disabled={!isDirty || !isValid || isSubmitting}
          aria-label='Save duplicate project name'
          children='Save'
          onClick={handleSubmit(onSubmit)}
          size='sm'
          variant='ontime-filled'
        />
        <Button
          disabled={!isDirty || !isValid || isSubmitting}
          aria-label='Cancel duplicate project name'
          children='Cancel'
          onClick={onCancel}
          size='sm'
          variant='ontime-ghosted'
          className={style.cancelButton}
        />
      </div>
    </form>
  );
}
