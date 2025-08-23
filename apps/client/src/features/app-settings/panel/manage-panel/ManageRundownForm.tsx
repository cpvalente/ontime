import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import Button from '../../../../common/components/buttons/Button';
import Input from '../../../../common/components/input/input/Input';
import { useMutateProjectRundowns } from '../../../../common/hooks-query/useProjectRundowns';
import * as Panel from '../../panel-utils/PanelUtils';

type NewRundownFormState = {
  title: string;
};

interface ManageRundownForm {
  onClose: () => void;
}

export function ManageRundownForm({ onClose }: ManageRundownForm) {
  const { create } = useMutateProjectRundowns();

  const {
    handleSubmit,
    register,
    setFocus,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NewRundownFormState>({
    defaultValues: { title: '' },
  });

  const createRundown = async (values: NewRundownFormState) => {
    try {
      await create(values.title || 'untitled');
      onClose();
    } catch (error) {
      setError('root', { message: `Failed to create rundown. ${error}` });
    }
  };

  // give initial focus to the title field
  useEffect(() => {
    setFocus('title');
  }, [setFocus]);

  return (
    <Panel.Indent as='form' onSubmit={handleSubmit(createRundown)}>
      <Panel.Section>
        <label>
          <Panel.Description>Rundown title</Panel.Description>
          <Input {...register('title')} fluid placeholder='Your rundown name' />
        </label>
      </Panel.Section>
      <Panel.InlineElements relation='inner' align='end'>
        <Button variant='ghosted' disabled={isSubmitting} onClick={onClose}>
          Cancel
        </Button>
        <Button type='submit' variant='primary' disabled={isSubmitting}>
          Create rundown
        </Button>
      </Panel.InlineElements>
      {errors.root && <Panel.Error>{errors.root.message}</Panel.Error>}
    </Panel.Indent>
  );
}
