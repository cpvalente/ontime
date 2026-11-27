import { Popover } from '@base-ui/react/popover';
import { CustomFieldOption, CustomFieldType, NewCustomField } from 'ontime-types';
import { customFieldLabelToKey, validateCustomFieldLabel, validateCustomFieldOptions } from 'ontime-utils';
import { useEffect } from 'react';
import { Control, UseFormRegister, UseFormSetValue, useFieldArray, useForm } from 'react-hook-form';
import { IoAdd, IoBan, IoClose } from 'react-icons/io5';

import { maybeAxiosError } from '../../../../../common/api/utils';
import Button from '../../../../../common/components/buttons/Button';
import IconButton from '../../../../../common/components/buttons/IconButton';
import Info from '../../../../../common/components/info/Info';
import SwatchSelect from '../../../../../common/components/input/colour-input/SwatchSelect';
import Input from '../../../../../common/components/input/input/Input';
import Modal from '../../../../../common/components/modal/Modal';
import PopoverContents from '../../../../../common/components/popover/Popover';
import RadioGroup from '../../../../../common/components/radio-group/RadioGroup';
import useCustomFields from '../../../../../common/hooks-query/useCustomFields';
import { OptionRow, getOptionChanges } from '../../../../../common/utils/customFieldOptions';
import { cx } from '../../../../../common/utils/styleUtils';
import * as Panel from '../../../panel-utils/PanelUtils';

import swatchStyle from '../../../../../common/components/input/colour-input/SwatchSelect.module.scss';
import style from '../RundownPanel.module.scss';

const formId = 'custom-field-form';

interface CustomFieldsFormProps {
  /** renamedOptions maps the labels of renamed options to their new label */
  onSubmit: (field: NewCustomField, renamedOptions: Record<string, string>) => Promise<void>;
  onCancel: () => void;
  initialColour?: string;
  initialLabel?: string;
  initialKey?: string;
  initialType?: CustomFieldType;
  initialOptions?: CustomFieldOption[];
}

const emptyRow: OptionRow = { label: '', colour: '', original: null };
const noOptions: CustomFieldOption[] = [];
type CustomFieldFormData = {
  type: CustomFieldType;
  label: string;
  colour: string;
  key: string;
  options: OptionRow[];
};

export default function CustomFieldForm({
  onSubmit,
  onCancel,
  initialColour,
  initialLabel,
  initialKey,
  initialType,
  initialOptions = noOptions,
}: CustomFieldsFormProps) {
  const { fieldsByKey } = useCustomFields();

  const {
    handleSubmit,
    register,
    setFocus,
    setError,
    setValue,
    getValues,
    watch,
    control,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<CustomFieldFormData>({
    // validate while typing, otherwise a disabled save button gives no reason
    mode: 'onChange',
    defaultValues: {
      type: initialType ?? 'text',
      label: initialLabel || '',
      colour: initialColour || '',
      options:
        initialOptions.length > 0
          ? initialOptions.map((option) => ({ ...option, original: option.label }))
          : [emptyRow],
    },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  const setupSubmit = async (values: CustomFieldFormData) => {
    const { type, label, colour } = values;
    const { options, renamed } = getOptionChanges(values.options, initialOptions);
    const newField: NewCustomField = type === 'option' ? { type, colour, label, options } : { type, colour, label };
    try {
      await onSubmit(newField, renamed);
    } catch (error) {
      setError('root', { type: 'custom', message: maybeAxiosError(error) });
    }
  };

  // give initial focus to the label
  useEffect(() => {
    setFocus('label');
  }, [setFocus]);

  // if initial values are given, we can assume we are in edit mode
  const isEditMode = initialKey !== undefined;
  const type = watch('type');
  const colour = watch('colour');
  const rows = watch('options');
  const optionChanges = getOptionChanges(rows, initialOptions);
  const optionsError = type === 'option' ? validateCustomFieldOptions(optionChanges.options) : null;
  const canSubmit = isDirty && isValid && !optionsError;
  // one warning tells what saving does to entries, renames first
  const renames = Object.entries(optionChanges.renamed);
  const hasRenames = renames.length > 0;
  const entryChanges = [
    ...renames.map(([oldLabel, newLabel]) => `"${oldLabel}" becomes "${newLabel}"`),
    ...optionChanges.removed.map((option) => `"${option.label}" is cleared`),
  ];

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
                { value: 'option', label: 'Option' },
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
              <Panel.Description>Label (letters, numbers and spaces only)</Panel.Description>
              {errors.label && <Panel.Error>{errors.label.message}</Panel.Error>}
              <Input
                {...register('label', {
                  required: { value: true, message: 'Required field' },
                  onChange: () => setValue('key', customFieldLabelToKey(getValues('label')) ?? 'N/A'),
                  validate: (value) => {
                    const labelError = validateCustomFieldLabel(value);
                    if (labelError) return labelError;
                    const newKey = customFieldLabelToKey(value);
                    if (newKey !== initialKey && fieldsByKey.has(newKey)) {
                      return 'Custom fields must be unique';
                    }
                    return true;
                  },
                })}
                fluid
              />
            </label>

            <label>
              <Panel.Description>Key (use in Integrations and API)</Panel.Description>
              <Input {...register('key')} variant='ghosted' readOnly fluid />
            </label>
          </div>
          <label>
            <Panel.Description>Colour</Panel.Description>
            <SwatchSelect
              name='colour'
              value={colour}
              handleChange={(_field, value) => setValue('colour', value, { shouldDirty: true })}
            />
          </label>
          {type === 'option' && (
            <div>
              <Panel.Description>Options (Enter adds a row)</Panel.Description>
              {optionsError && isDirty && <Panel.Error>{optionsError}</Panel.Error>}
              <OptionRows control={control} register={register} setValue={setValue} rows={rows} />
              {entryChanges.length > 0 && (
                <Info type='warning'>
                  Saving changes every entry which uses these options, in all rundowns: {entryChanges.join(', ')}.
                  {hasRenames && (
                    <>
                      <br />
                      Automation filters and external senders using an old label are not updated.
                    </>
                  )}
                </Info>
              )}
            </div>
          )}
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

interface OptionRowsProps {
  control: Control<CustomFieldFormData>;
  register: UseFormRegister<CustomFieldFormData>;
  setValue: UseFormSetValue<CustomFieldFormData>;
  rows: OptionRow[];
}

/**
 * A row per option, each with a colour, a label and a remove button; Enter adds a row below
 */
function OptionRows({ control, register, setValue, rows }: OptionRowsProps) {
  const { fields, insert, append, remove } = useFieldArray({ control, name: 'options' });

  return (
    <>
      {fields.map((field, index) => {
        const colour = rows[index]?.colour;
        const position = index + 1;
        return (
          <div key={field.id} className={style.optionRow}>
            <Popover.Root>
              <Popover.Trigger
                className={cx([swatchStyle.swatch, swatchStyle.selectable, style.optionColour])}
                style={colour ? { backgroundColor: colour } : undefined}
                aria-label={`Colour of option ${position}`}
              >
                {!colour && <IoBan />}
              </Popover.Trigger>
              <PopoverContents align='start'>
                <SwatchSelect
                  name='colour'
                  value={colour ?? ''}
                  handleChange={(_field, value) => setValue(`options.${index}.colour`, value, { shouldDirty: true })}
                />
              </PopoverContents>
            </Popover.Root>
            <Input
              {...register(`options.${index}.label`)}
              aria-label={`Option ${position}`}
              placeholder='Option'
              maxLength={100}
              fluid
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return;
                // Enter would otherwise submit the form
                event.preventDefault();
                insert(index + 1, emptyRow);
              }}
            />
            <IconButton
              variant='ghosted-destructive'
              aria-label={`Remove option ${position}`}
              onClick={() => remove(index)}
            >
              <IoClose />
            </IconButton>
          </div>
        );
      })}
      <Button variant='ghosted' size='small' onClick={() => append(emptyRow)}>
        <IoAdd /> Add option
      </Button>
    </>
  );
}
