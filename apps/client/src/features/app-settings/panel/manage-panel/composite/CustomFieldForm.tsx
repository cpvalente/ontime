import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CustomField } from 'ontime-types';
import { customFieldLabelToKey, isAlphanumericWithSpace } from 'ontime-utils';

import { maybeAxiosError } from '../../../../../common/api/utils';
import Button from '../../../../../common/components/buttons/Button';
import Info from '../../../../../common/components/info/Info';
import SwatchSelect from '../../../../../common/components/input/colour-input/SwatchSelect';
import Input from '../../../../../common/components/input/input/Input';
import RadioGroup from '../../../../../common/components/radio-group/RadioGroup';
import useCustomFields from '../../../../../common/hooks-query/useCustomFields';
import { preventEscape } from '../../../../../common/utils/keyEvent';
import * as Panel from '../../../panel-utils/PanelUtils';

import style from '../ManagePanel.module.scss';

interface CustomFieldsFormProps {
  onSubmit: (field: CustomField) => Promise<void>;
  onCancel: () => void;
  initialColour?: string;
  initialLabel?: string;
  initialKey?: string;
}

type CustomFieldFormData = CustomField & { key: string };

export default function CustomFieldForm(props: CustomFieldsFormProps) {
  const { onSubmit, onCancel, initialColour, initialLabel, initialKey } = props;
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
    watch,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<CustomFieldFormData>({
    defaultValues: { type: 'text', label: initialLabel || '', colour: initialColour || '' },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  const setupSubmit = async (values: CustomFieldFormData) => {
    const { type, label, colour } = values;
    const newField: CustomField = {
      type,
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
  // if initial values are given, we can assume we are in edit mode
  const isEditMode = initialKey !== undefined;

  return (
    <form
      onSubmit={handleSubmit(setupSubmit)}
      className={style.fieldForm}
      onKeyDown={(event) => preventEscape(event, onCancel)}
    >
      <Info>
        Please note that images can quickly deteriorate your app&apos;s performance.
        <br />
        Prefer using small, and compressed images.
      </Info>
      <div>
        <Panel.Description>Type</Panel.Description>
        <RadioGroup
          orientation='horizontal'
          disabled={isEditMode}
          onValueChange={(value) => setValue('type', value, { shouldDirty: true })}
          value={watch('type')}
          items={[
            { value: 'text', label: 'Text' },
            { value: 'image', label: 'Image' },
          ]}
        />
      </div>
      <div className={style.twoCols}>
        <div>
          <Panel.Description>Label (only alphanumeric characters are allowed)</Panel.Description>
          {errors.label && <Panel.Error>{errors.label.message}</Panel.Error>}
          <Input
            {...register('label', {
              required: { value: true, message: 'Required field' },
              onChange: () => setValue('key', customFieldLabelToKey(getValues('label')) ?? 'N/A'),
              validate: (value) => {
                if (value.trim().length === 0) return 'Required field';
                if (!isAlphanumericWithSpace(value)) return 'Only alphanumeric characters and space are allowed';
                if (!isEditMode) {
                  if (isEditMode && Object.keys(data).includes(value)) return 'Custom fields must be unique';
                }
                return true;
              },
            })}
            fluid
          />
        </div>

        <div>
          <Panel.Description>Key (use in Integrations and API)</Panel.Description>
          <Input {...register('key')} readOnly fluid />
        </div>
      </div>
      <div>
        <Panel.Description>Colour</Panel.Description>
        <SwatchSelect name='colour' value={colour} handleChange={(_field, value) => handleSelectColour(value)} />
      </div>
      {errors.root && <Panel.Error>{errors.root.message}</Panel.Error>}
      <Panel.InlineElements relation='inner' align='end'>
        <Button variant='ghosted' onClick={onCancel}>
          Cancel
        </Button>
        <Button type='submit' variant='primary' disabled={!canSubmit} loading={isSubmitting}>
          Save
        </Button>
      </Panel.InlineElements>
    </form>
  );
}
