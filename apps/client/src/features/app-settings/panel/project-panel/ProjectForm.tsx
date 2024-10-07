import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input } from '@chakra-ui/react';

import style from './ProjectPanel.module.scss';

export type ProjectFormValues = {
  filename: string;
  fileBase64?: string;
};

interface ProjectFormProps {
  action: 'duplicate' | 'rename' | 'merge';
  filename: string;
  onCancel: () => void;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
}

export default function ProjectForm({ action, filename, onSubmit, onCancel }: ProjectFormProps) {
  const [fileBase64, setFileBase64] = useState<string | null>(null);

  const {
    handleSubmit,
    register,
    formState: { isSubmitting, isDirty, isValid },
    setFocus,
  } = useForm<ProjectFormValues>({
    defaultValues: { filename },
    values: { filename },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  useEffect(() => {
    setFocus('filename');
  }, [setFocus]);

  // Convert image to base64
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (formData: ProjectFormValues) => {
    // Add fileBase64 to formData if it exists
    if (fileBase64) {
      formData.fileBase64 = fileBase64;
    }
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={style.form}>
      <Input
        className={style.formInput}
        id='filename'
        size='sm'
        type='text'
        variant='ontime-filled'
        placeholder='Enter new name'
        autoComplete='off'
        {...register('filename', { required: true })}
      />

      {/* Add file input */}
      <Input
        className={style.formInput}
        id='fileInput'
        size='sm'
        type='file'
        accept='image/*'
        onChange={handleFileChange}
      />

      <div className={style.actionButtons}>
        <Button onClick={onCancel} size='sm' variant='ontime-ghosted' disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          size='sm'
          variant='ontime-filled'
          isDisabled={!isDirty || !isValid || isSubmitting}
          type='submit'
          className={style.saveButton}
        >
          {action}
        </Button>
      </div>
    </form>
  );
}
