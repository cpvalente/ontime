import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import Button from '../../../../common/components/buttons/Button';
import Input from '../../../../common/components/input/input/Input';
import { preventEscape } from '../../../../common/utils/keyEvent';
import * as Panel from '../../panel-utils/PanelUtils';

import style from './ProjectPanel.module.scss';

export type ProjectFormValues = {
  filename: string;
};

interface ProjectFormProps {
  action: 'duplicate' | 'rename' | 'merge';
  filename: string;
  onCancel: () => void;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
}

export default function ProjectForm({ action, filename, onSubmit, onCancel }: ProjectFormProps) {
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

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(event) => preventEscape(event, onCancel)}
      className={style.form}
    >
      <Input
        className={style.formInput}
        id='filename'
        placeholder='Enter new name'
        {...register('filename', { required: true })}
      />
      <Panel.InlineElements relation='inner'>
        <Button onClick={onCancel} variant='ghosted' disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant='primary'
          disabled={!isDirty || !isValid || isSubmitting}
          type='submit'
          className={style.saveButton}
        >
          {action}
        </Button>
      </Panel.InlineElements>
    </form>
  );
}
