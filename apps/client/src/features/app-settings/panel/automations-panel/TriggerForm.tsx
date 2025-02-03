import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, Select } from '@chakra-ui/react';
import { NormalisedAutomation, TimerLifeCycle, TriggerDTO } from 'ontime-types';

import { addTrigger, editTrigger } from '../../../../common/api/automation';
import { maybeAxiosError } from '../../../../common/api/utils';
import { preventEscape } from '../../../../common/utils/keyEvent';
import * as Panel from '../../panel-utils/PanelUtils';

import { cycles } from './automationUtils';

interface TriggerFormProps {
  automations: NormalisedAutomation;
  initialId?: string;
  initialTitle?: string;
  initialAutomationId?: string;
  initialTrigger?: TimerLifeCycle;
  onCancel: () => void;
  postSubmit: () => void;
}

export default function TriggerForm(props: TriggerFormProps) {
  const { automations, initialId, initialTitle, initialAutomationId, initialTrigger, onCancel, postSubmit } = props;
  const {
    handleSubmit,
    register,
    setFocus,
    setError,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<TriggerDTO>({
    defaultValues: {
      title: initialTitle,
      trigger: initialTrigger,
      automationId: initialAutomationId,
    },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  // give initial focus to the title field
  useEffect(() => {
    setFocus('title');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- focus on mount
  }, []);

  const onSubmit = async (values: TriggerDTO) => {
    // if we were passed an ID we are editing a Trigger
    if (initialId) {
      try {
        await editTrigger(initialId, { id: initialId, ...values });
        postSubmit();
      } catch (error) {
        setError('root', { message: `Failed to save changes to trigger ${maybeAxiosError(error)}` });
      }
      return;
    }

    // otherwise we are creating a new automation
    try {
      await addTrigger(values);
      postSubmit();
    } catch (error) {
      setError('root', { message: `Failed to save trigger ${maybeAxiosError(error)}` });
    }
  };

  const automationSelect = Object.keys(automations).map((automation) => {
    return {
      value: automation,
      label: automations[automation].title,
    };
  });

  const canSubmit = isDirty && isValid;

  return (
    <Panel.Indent
      as='form'
      name='trigger-form'
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(event) => preventEscape(event, onCancel)}
    >
      <Panel.SubHeader>{initialId ? 'Edit trigger' : 'Create trigger'}</Panel.SubHeader>
      <label>
        Title
        <Input
          {...register('title', { required: { value: true, message: 'Required field' } })}
          size='sm'
          variant='ontime-filled'
          autoComplete='off'
          defaultValue={initialTitle}
        />
        <Panel.Error>{errors.title?.message}</Panel.Error>
      </label>
      <label>
        Lifecycle trigger
        <Select
          size='sm'
          variant='ontime'
          defaultValue={initialTrigger}
          {...register('trigger', { required: { value: true, message: 'Required field' } })}
        >
          {cycles.map((cycle) => (
            <option key={cycle.id} value={cycle.value}>
              {cycle.label}
            </option>
          ))}
        </Select>
        <Panel.Error>{errors.trigger?.message}</Panel.Error>
      </label>
      <label>
        Automation title
        <Select
          size='sm'
          variant='ontime'
          defaultValue={initialAutomationId}
          {...register('automationId', { required: { value: true, message: 'Required field' } })}
        >
          {automationSelect.map((automation) => (
            <option key={automation.value} value={automation.value}>
              {automation.label}
            </option>
          ))}
        </Select>
        <Panel.Error>{errors.automationId?.message}</Panel.Error>
      </label>
      <Panel.InlineElements align='end'>
        <Button size='sm' variant='ontime-subtle' isDisabled={isSubmitting} onClick={onCancel}>
          Cancel
        </Button>
        <Button type='submit' size='sm' variant='ontime-filled' isDisabled={!canSubmit} isLoading={isSubmitting}>
          Save
        </Button>
      </Panel.InlineElements>
    </Panel.Indent>
  );
}
