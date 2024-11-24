import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, Select } from '@chakra-ui/react';
import { AutomationDTO, NormalisedAutomationBlueprint, TimerLifeCycle } from 'ontime-types';

import { addAutomation, editAutomation } from '../../../../common/api/automation';
import { maybeAxiosError } from '../../../../common/api/utils';
import { preventEscape } from '../../../../common/utils/keyEvent';
import * as Panel from '../../panel-utils/PanelUtils';

import { cycles } from './automationUtils';

interface AutomationFormProps {
  blueprints: NormalisedAutomationBlueprint;
  initialId?: string;
  initialTitle?: string;
  initialBlueprint?: string;
  initialTrigger?: TimerLifeCycle;
  onCancel: () => void;
  postSubmit: () => void;
}

export default function AutomationForm(props: AutomationFormProps) {
  const { blueprints, initialId, initialTitle, initialBlueprint, initialTrigger, onCancel, postSubmit } = props;
  const {
    handleSubmit,
    register,
    setFocus,
    setError,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<AutomationDTO>({
    defaultValues: {
      title: initialTitle,
      trigger: initialTrigger,
      blueprintId: initialBlueprint,
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

  const onSubmit = async (values: AutomationDTO) => {
    // if we were passed an ID we are editing a blueprint
    if (initialId) {
      try {
        await editAutomation(initialId, { id: initialId, ...values });
        postSubmit();
      } catch (error) {
        setError('root', { message: `Failed to save changes to automation ${maybeAxiosError(error)}` });
      }
      return;
    }

    // otherwise we are creating a new automation
    try {
      await addAutomation(values);
      postSubmit();
    } catch (error) {
      setError('root', { message: `Failed to save automation ${maybeAxiosError(error)}` });
    }
  };

  const blueprintSelect = Object.keys(blueprints).map((blueprint) => {
    return {
      value: blueprint,
      label: blueprints[blueprint].title,
    };
  });

  const canSubmit = isDirty && isValid;

  return (
    <Panel.Indent
      as='form'
      name='automation-form'
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(event) => preventEscape(event, onCancel)}
    >
      <Panel.SubHeader>{initialId ? 'Edit automation' : 'Create automation'}</Panel.SubHeader>
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
        Trigger
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
        Blueprint title
        <Select
          size='sm'
          variant='ontime'
          defaultValue={initialBlueprint}
          {...register('blueprintId', { required: { value: true, message: 'Required field' } })}
        >
          {blueprintSelect.map((blueprint) => (
            <option key={blueprint.value} value={blueprint.value}>
              {blueprint.label}
            </option>
          ))}
        </Select>
        <Panel.Error>{errors.blueprintId?.message}</Panel.Error>
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
