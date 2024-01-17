import { FormControl, Input, Button } from '@chakra-ui/react';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

export type DuplicateProjectFormValues = {
  newFilename: string;
};

interface DuplicateProjectFormProps {
  filename: string;
  onCancel: () => void;
  onSubmit: (values: DuplicateProjectFormValues) => Promise<void>;
}

export default function DuplicateProjectForm({ filename, onSubmit, onCancel }: DuplicateProjectFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    handleSubmit,
    register,
    formState: { isSubmitting, isDirty, isValid },
  } = useForm<DuplicateProjectFormValues>({
    defaultValues: { newFilename: '' },
    values: { newFilename: '' },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const { ref, ...newFilenameInput } = register('newFilename');

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <div>
        <FormControl>
          <Input value={filename} id='filename' size='sm' type='text' variant='ontime-filled' disabled />
        </FormControl>
        <FormControl
          style={{
            marginTop: '0.5rem',
          }}
        >
          <Input
            id='newFilename'
            size='sm'
            type='text'
            variant='ontime-filled'
            placeholder='Duplicate file name'
            {...newFilenameInput}
            ref={inputRef}
          />
        </FormControl>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          marginLeft: '0.5rem',
        }}
      >
        <Button
          aria-label='Save duplicate project name'
          size='sm'
          variant='ontime-filled'
          disabled={!isDirty || !isValid || isSubmitting}
          type='submit'
          children='Save'
          style={{
            marginBottom: '0.5rem',
          }}
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
