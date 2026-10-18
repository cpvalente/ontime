import { CustomField } from 'ontime-types';
import { checkRegex, customKeyFromLabel } from 'ontime-utils';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { maybeAxiosError } from '../../../../../common/api/utils';
import Button from '../../../../../common/components/buttons/Button';
import Info from '../../../../../common/components/info/Info';
import SwatchSelect from '../../../../../common/components/input/colour-input/SwatchSelect';
import Input from '../../../../../common/components/input/input/Input';
import Modal from '../../../../../common/components/modal/Modal';
import RadioGroup from '../../../../../common/components/radio-group/RadioGroup';
import useCustomFields from '../../../../../common/hooks-query/useCustomFields';
import * as Panel from '../../../panel-utils/PanelUtils';

import style from '../ManagePanel.module.scss';

const formId = 'custom-field-form';

interface CustomFieldsFormProps {
  onSubmit: (field: CustomField) => Promise<void>;
  onCancel: () => void;
  initialColour?: string;
  initialLabel?: string;
  initialKey?: string;
  initialType?: CustomField['type'];
}

export default function CustomFieldForm({
  onSubmit,
  onCancel,
  initialColour,
  initialLabel,
  initialKey,
  initialType,
}: CustomFieldsFormProps) {
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
  } = useForm<CustomField>({
    // validate while typing, otherwise a disabled save button gives no reason
    mode: 'onChange',
    defaultValues: {
      type: initialType ?? 'text',
      label: initialLabel || '',
      colour: initialColour || '',
    },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  const setupSubmit = async (values: CustomField) => {
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
  const type = watch('type');

  return (
    <Modal
      isOpen
      onClose={onCancel}
      showBackdrop
      showCloseButton
      size='compact'
      title={isEditMode ? 'Edit custom field' : 'Create custom field'}
      bodyElements={
        <form id={formId} onSubmit={handleSubmit(setupSubmit)} className={style.formColumn}>
          <div>
            <Panel.Description>Type</Panel.Description>
            <RadioGroup
              orientation='horizontal'
              disabled={isEditMode}
              onValueChange={(value) => setValue('type', value, { shouldDirty: true })}
              value={type}
              items={[
                { value: 'text', label: 'Text' },
                { value: 'image', label: 'Image' },
              ]}
            />
          </div>
          {type === 'image' && (
            <Info>
              Images can impact your app&apos;s performance.
              <br />
              Prefer using small, and compressed images.
            </Info>
          )}
          <div className={style.twoCols}>
            <label>
              <Panel.Description>Label (only alphanumeric characters are allowed)</Panel.Description>
              {errors.label && <Panel.Error>{errors.label.message}</Panel.Error>}
              <Input
                {...register('label', {
                  required: { value: true, message: 'Required field' },
                  validate: (value) => {
                    if (value.trim().length === 0) return 'Required field';
                    if (!checkRegex.isAlphanumericWithSpace(value))
                      return 'Only alphanumeric characters and space are allowed';
                    if (initialKey && value.trim() === initialLabel?.trim()) return true;
                    const duplicateId = customKeyFromLabel(value.trim(), data);
                    if (duplicateId !== null && duplicateId !== initialKey) {
                      return 'Custom fields must be unique';
                    }
                    return true;
                  },
                })}
                fluid
              />
            </label>

            <label>
              <Panel.Description>ID (use in Integrations and API)</Panel.Description>
              <Input value={initialKey ?? 'Assigned when saved'} variant='ghosted' readOnly fluid />
            </label>
          </div>
          <label>
            <Panel.Description>Colour</Panel.Description>
            <SwatchSelect name='colour' value={colour} handleChange={(_field, value) => handleSelectColour(value)} />
          </label>
        </form>
      }
      footerElements={
        <>
          {errors.root && <Panel.Error>{errors.root.message}</Panel.Error>}
          <Button variant='ghosted' onClick={onCancel}>
            Cancel
          </Button>
          <Button type='submit' form={formId} variant='primary' disabled={!canSubmit} loading={isSubmitting}>
            Save
          </Button>
        </>
      }
    />
  );
}
