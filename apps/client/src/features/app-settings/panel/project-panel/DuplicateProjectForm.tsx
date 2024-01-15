import { FormControl, Input, IconButton } from '@chakra-ui/react';
import { IoClose } from '@react-icons/all-files/io5/IoClose';
import { IoSaveOutline } from '@react-icons/all-files/io5/IoSaveOutline';
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
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<DuplicateProjectFormValues>({
    defaultValues: { newFilename: filename },
    values: { newFilename: filename },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormControl>
        <label htmlFor='filename'>
          <span>Current name</span>
        </label>
        <Input value={filename} id='filename' size='md' type='text' variant='ontime-filled' disabled />
      </FormControl>
      <FormControl>
        <label htmlFor='newFilename'>
          <span>New name</span>
        </label>
        <Input
          defaultValue={filename}
          id='newFilename'
          size='md'
          type='text'
          variant='ontime-filled'
          {...register('newFilename')}
        />
      </FormControl>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
        }}
      >
        <IconButton
          aria-label='Save duplicate project name'
          icon={<IoSaveOutline />}
          size='sm'
          variant='ontime-filled'
          disabled={!isDirty || !isValid || isSubmitting}
          type='submit'
        />
        <IconButton
          aria-label='Cancel duplicate project name'
          icon={<IoClose />}
          onClick={onCancel}
          size='sm'
          variant='ontime-filled'
          disabled={!isDirty || !isValid || isSubmitting}
        />
      </div>
    </form>
  );
}
