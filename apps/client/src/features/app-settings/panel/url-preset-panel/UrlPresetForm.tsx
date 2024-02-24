import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input } from '@chakra-ui/react';

import style from './UrlPresetPanel.module.scss';

export type UrlPresetFormValues = {
  alias?: string;
  pathAndParams?: string;
  enabled?: boolean;
};

interface UrlPresetFormProps {
  alias?: string;
  enabled?: boolean;
  pathAndParams?: string;
  onCancel: () => void;
  onSubmit: (values: UrlPresetFormValues) => Promise<void>;
  submitError: string | null;
}

export default function UrlPresetForm({
  onSubmit,
  onCancel,
  submitError,
  alias,
  enabled,
  pathAndParams,
}: UrlPresetFormProps) {
  const {
    handleSubmit,
    register,
    formState: { isSubmitting, isValid },
    setFocus,
  } = useForm<UrlPresetFormValues>({
    defaultValues: { alias, pathAndParams, enabled },
    values: { alias, pathAndParams, enabled },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  useEffect(() => {
    setFocus('alias');
  }, [setFocus]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={style.form}>
      <div className={style.formInput}>
        <Input
          variant='ontime-filled'
          size='sm'
          maxLength={50}
          placeholder='Alias'
          autoComplete='off'
          {...register('alias')}
        />
      </div>
      <div className={style.formInput}>
        <Input
          variant='ontime-filled'
          size='sm'
          maxLength={100}
          placeholder='Path and params'
          autoComplete='off'
          {...register('pathAndParams')}
        />
      </div>
      <div className={style.actionButtons}>
        <Button onClick={onCancel} variant='ontime-ghosted' size='sm'>
          Cancel
        </Button>
        <Button
          isDisabled={!isValid}
          type='submit'
          isLoading={isSubmitting}
          variant='ontime-filled'
          padding='0 2em'
          size='sm'
        >
          Update
        </Button>
      </div>
      {submitError && <span className={style.error}>{submitError}</span>}
    </form>
  );
}
