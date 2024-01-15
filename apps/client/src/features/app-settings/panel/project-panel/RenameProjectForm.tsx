import { FormControl, Input, IconButton } from '@chakra-ui/react';
import { IoSaveOutline } from '@react-icons/all-files/io5/IoSaveOutline';
import { useForm } from 'react-hook-form';

export type RenameProjectFormValues = {
  filename: string;
};

interface RenameProjectFormProps {
  filename: string;
  onSubmit: (values: RenameProjectFormValues) => Promise<void>;
}

export default function RenameProjectForm({ filename, onSubmit }: RenameProjectFormProps) {
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

  return (
    <form>
      <FormControl>
        <Input defaultValue={filename} size='md' type='text' variant='ontime-filled' {...register('filename')} />
      </FormControl>
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
