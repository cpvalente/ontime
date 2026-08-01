import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import Button from '../../../../common/components/buttons/Button';
import Input from '../../../../common/components/input/input/Input';
import Modal from '../../../../common/components/modal/Modal';
import { useMutateProjectRundowns } from '../../../../common/hooks-query/useProjectRundowns';
import * as Panel from '../../panel-utils/PanelUtils';

const formId = 'new-rundown-form';

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
    <Modal
      isOpen
      onClose={onClose}
      showBackdrop
      showCloseButton
      size='small'
      title='Create rundown'
      bodyElements={
        <form id={formId} onSubmit={handleSubmit(createRundown)}>
          <label>
            <Panel.Description>Rundown title</Panel.Description>
            <Input {...register('title')} fluid placeholder='Your rundown name' maxLength={64} />
          </label>
        </form>
      }
      footerElements={
        <>
          {errors.root && <Panel.Error>{errors.root.message}</Panel.Error>}
          <Button variant='ghosted' disabled={isSubmitting} onClick={onClose}>
            Cancel
          </Button>
          <Button type='submit' form={formId} variant='primary' disabled={isSubmitting}>
            Create rundown
          </Button>
        </>
      }
    />
  );
}
