import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input } from '@chakra-ui/react';
import { PresetEvent } from 'ontime-types';

import { maybeAxiosError } from '../../../../common/api/utils';
import SwatchSelect from '../../../../common/components/input/colour-input/SwatchSelect';
import * as Panel from '../PanelUtils';

import style from '../integrations-panel/IntegrationsPanel.module.css';

interface PresetEventsFormProps {
  onSubmit: (preset: PresetEvent) => Promise<void>;
  onCancel: () => void;
  initialPreset: PresetEvent;
  initialLabel?: string;
}

export default function PresetEventForm(props: PresetEventsFormProps) {
  const { onSubmit, onCancel, initialLabel, initialPreset } = props;

  const {
    handleSubmit,
    register,
    setValue,
    getValues,
    setFocus,
    setError,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm({
    defaultValues: {
      label: initialLabel || '',
      preset: initialPreset,
    },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  // give initial focus to the label
  useEffect(() => {
    setFocus('label');
  }, [setFocus]);

  const setupSubmit = async (values: { label: string; preset: PresetEvent }) => {
    values.preset.label = values.label;
    try {
      await onSubmit(values.preset);
    } catch (error) {
      setError('root', { type: 'preset', message: maybeAxiosError(error) });
    }
  };
  const handleSelectColour = (colour: string) => {
    setValue('preset.colour', colour, { shouldDirty: true });
  };

  const colour = getValues('preset.colour') || '';
  const canSubmit = isDirty && isValid;

  return (
    <form onSubmit={handleSubmit(setupSubmit)} className={style.fieldForm}>
      <div className={style.column}>
        <Panel.Description>Label</Panel.Description>
        {errors.label && <Panel.Error>{errors.label.message}</Panel.Error>}
        <Input
          {...register('label', {
            required: { value: true, message: 'Required field' },
            validate: (value) => {
              if (value.trim().length === 0) return 'Required field';
              return true;
            },
          })}
          size='sm'
          variant='ontime-filled'
          autoComplete='off'
        />
      </div>
      <div className={style.column}>
        <Panel.Description>Cue</Panel.Description>
        {errors.preset?.cue && <Panel.Error>{errors.preset.cue.message}</Panel.Error>}
        <Input {...register('preset.cue')} size='sm' variant='ontime-filled' autoComplete='off' />
      </div>
      <div className={style.column}>
        <Panel.Description>Title</Panel.Description>
        {errors.preset?.title && <Panel.Error>{errors.preset.title.message}</Panel.Error>}
        <Input {...register('preset.title')} size='sm' variant='ontime-filled' autoComplete='off' />
      </div>
      <div>
        <Panel.Description>Colour</Panel.Description>
        <SwatchSelect name='colour' value={colour} handleChange={(_field, value) => handleSelectColour(value)} />
      </div>
      {errors.root && <Panel.Error>{errors.root.message}</Panel.Error>}
      <div className={style.buttonRow}>
        <Button size='sm' variant='ontime-ghosted' onClick={onCancel}>
          Cancel
        </Button>
        <Button size='sm' type='submit' variant='ontime-filled' isDisabled={!canSubmit} isLoading={isSubmitting}>
          Save
        </Button>
      </div>
    </form>
  );
}
