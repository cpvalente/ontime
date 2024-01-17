import { FormControl, Input, IconButton } from '@chakra-ui/react';
import { IoClose } from '@react-icons/all-files/io5/IoClose';
import { IoSaveOutline } from '@react-icons/all-files/io5/IoSaveOutline';
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
    formState: { errors, isSubmitting, isDirty, isValid },
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
          ref={(e) => {
            ref(e);
            // Fix that TS error
            inputRef.current = e;
          }}
        />
      </FormControl>
      <IconButton
        disabled={!isDirty || !isValid || isSubmitting}
        aria-label='Cancel duplicate project name'
        icon={<IoClose />}
        onClick={onCancel}
        size='sm'
        variant='ontime-ghosted'
        style={{
          marginRight: '0.5rem',
          color: 'red',
        }}
      />
      <IconButton
        disabled={!isDirty || !isValid || isSubmitting}
        aria-label='Save duplicate project name'
        icon={<IoSaveOutline />}
        onClick={handleSubmit(onSubmit)}
        size='sm'
        variant='ontime-filled'
      />
    </form>
  );
}
