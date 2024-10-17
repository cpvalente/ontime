import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input } from '@chakra-ui/react';
import { CustomField } from 'ontime-types';
import { isAlphanumeric } from 'ontime-utils';

import { maybeAxiosError } from '../../../../../common/api/utils';
import SwatchSelect from '../../../../../common/components/input/colour-input/SwatchSelect';
import useCustomFields from '../../../../../common/hooks-query/useCustomFields';
import * as Panel from '../../PanelUtils';

import style from '../FeatureSettings.module.scss';

interface CustomFieldsFormProps {
  onSubmit: (field: CustomField) => Promise<void>;
  onCancel: () => void;
  initialColour?: string;
  initialLabel?: string;
}

export default function CustomFieldForm(props: CustomFieldsFormProps) {
  const { onSubmit, onCancel, initialColour, initialLabel } = props;
  const { data } = useCustomFields();

  // we use this to force an update
  const [_, setColour] = useState(initialColour || '');

  const {
    handleSubmit,
    register,
    setFocus,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm({
    defaultValues: { label: initialLabel || '', colour: initialColour || '', key: initialLabel || '' },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  const setupSubmit = async (values: { label: string; colour: string }) => {
    const { label, colour } = values;
    const newField: CustomField = {
      type: 'string', // type is not user definable yet
      colour,
      label,
    };
    try {
      await onSubmit(newField);
    } catch (error) {
      setError('root', { type: 'custom', message: maybeAxiosError(error) });
    }
  };

  // give initial focus to the label
  useEffect(() => {
    setFocus('label');
  }, [setFocus]);

  const handleSelectColour = (colour: string) => {
    setColour(colour);
    setValue('colour', colour, { shouldDirty: true });
  };

  const colour = getValues('colour');
  const canSubmit = isDirty && isValid;

  return (
    <form onSubmit={handleSubmit(setupSubmit)} className={style.fieldForm}>
      <div className={style.column}>
        <Panel.Description>Label (only alphanumeric characters are allowed)</Panel.Description>
        {errors.label && <Panel.Error>{errors.label.message}</Panel.Error>}
        <Input
          {...register('label', {
            required: { value: true, message: 'Required field' },
            onChange: () => setValue('key', getValues('label')),
            validate: (value) => {
              if (value.trim().length === 0) return 'Required field';
              if (!isAlphanumeric(value)) return 'Only alphanumeric characters are allowed';
              if (Object.keys(data).includes(value)) return 'Custom fields must be unique';
              return true;
            },
          })}
          size='sm'
          variant='ontime-filled'
          autoComplete='off'
        />
      </div>
      <div className={style.column}>
        {/* TODO: better style and description */}
        <Panel.Description>Key (The key is generated from the label for use in Integrations and API)</Panel.Description>
        <Input {...register('key')} disabled size='sm' variant='ontime-filled' autoComplete='off' />
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
