import { FormControl, Input, IconButton, Button } from '@chakra-ui/react';
import { IoClose } from '@react-icons/all-files/io5/IoClose';
import { IoSaveOutline } from '@react-icons/all-files/io5/IoSaveOutline';
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
    formState: { errors, isSubmitting, isDirty, isValid },
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
          {/* <label htmlFor='filename'>
            <span>Current name</span>
          </label> */}
          <Input value={filename} id='filename' size='sm' type='text' variant='ontime-filled' disabled />
        </FormControl>
        <FormControl
          style={{
            marginTop: '0.5rem',
          }}
        >
          {/* <label htmlFor='newFilename'>
            <span>New name</span>
          </label> */}
          <Input
            id='newFilename'
            size='sm'
            type='text'
            variant='ontime-filled'
            placeholder='Duplicate file name'
            {...newFilenameInput}
            ref={(e) => {
              ref(e);
              // Fix that TS error
              inputRef.current = e;
            }}
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
