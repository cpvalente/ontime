import { FormControl, Input, Button } from '@chakra-ui/react';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

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
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      <FormControl
        style={{
          paddingRight: '0.5rem',
        }}
      >
        <Input
          defaultValue={filename}
          size='sm'
          type='text'
          variant='ontime-filled'
          {...filenameInput}
          ref={inputRef}
        />
      </FormControl>
      <div>
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
          style={{
            marginRight: '0.5rem',
            color: 'red',
          }}
        />
      </div>
    </form>
  );
}
