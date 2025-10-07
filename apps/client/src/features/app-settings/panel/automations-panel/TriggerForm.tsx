import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { NormalisedAutomation, TimerLifeCycle, TriggerDTO } from 'ontime-types';

import { addTrigger, editTrigger } from '../../../../common/api/automation';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Input from '../../../../common/components/input/input/Input';
import Select from '../../../../common/components/select/Select';
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

export default function TriggerForm({
  automations,
  initialId,
  initialTitle,
  initialAutomationId,
  initialTrigger,
  onCancel,
  postSubmit,
}: TriggerFormProps) {
  const {
    handleSubmit,
    register,
    setFocus,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<TriggerDTO>({
    defaultValues: {
      title: initialTitle,
      trigger: initialTrigger ?? (cycles[0].value as TimerLifeCycle | undefined),
      automationId: initialAutomationId ?? automations?.[Object.keys(automations)[0]]?.id,
    },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  // give initial focus to the title field
  useEffect(() => {
    setFocus('title');
  }, [setFocus]);

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
          fluid
          defaultValue={initialTitle}
        />
        <Panel.Error>{errors.title?.message}</Panel.Error>
      </label>
      <label>
        Lifecycle trigger
        <Select
          value={watch('trigger')}
          onValueChange={(value) => setValue('trigger', value as TimerLifeCycle, { shouldDirty: true })}
          options={cycles.map((cycle) => ({ value: cycle.value, label: cycle.label }))}
          aria-label='Lifecycle trigger'
        />
        <Panel.Error>{errors.trigger?.message}</Panel.Error>
      </label>
      <label>
        Automation title
        <Select
          value={watch('automationId')}
          onValueChange={(value) => setValue('automationId', value, { shouldDirty: true })}
          options={automationSelect}
          aria-label='Automation title'
        />
        <Panel.Error>{errors.automationId?.message}</Panel.Error>
      </label>
      <Panel.InlineElements align='end'>
        <Button disabled={isSubmitting} onClick={onCancel}>
          Cancel
        </Button>
        <Button type='submit' variant='primary' disabled={!canSubmit} loading={isSubmitting}>
          Save
        </Button>
      </Panel.InlineElements>
    </Panel.Indent>
  );
}
