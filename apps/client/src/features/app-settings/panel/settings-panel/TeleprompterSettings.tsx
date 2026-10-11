import type { TeleprompterHeading, TeleprompterSettings as TeleprompterSettingsType } from 'ontime-types';
import { teleprompterCharsPerLine } from 'ontime-utils';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Info from '../../../../common/components/info/Info';
import Input from '../../../../common/components/input/input/Input';
import Select from '../../../../common/components/select/Select';
import useCustomFields from '../../../../common/hooks-query/useCustomFields';
import useTeleprompterSettings from '../../../../common/hooks-query/useTeleprompterSettings';
import { preventEscape } from '../../../../common/utils/keyEvent';
import * as Panel from '../../panel-utils/PanelUtils';

const headingOptions: { value: TeleprompterHeading; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'cue', label: 'Cue' },
  { value: 'both', label: 'Cue and title' },
  { value: 'none', label: 'None' },
];

/** What every teleprompter view reads, kept with the project */
export default function TeleprompterSettings() {
  const { data, status, mutateAsync } = useTeleprompterSettings();
  const { data: customFields } = useCustomFields();

  const {
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    watch,
    formState: { isSubmitting, isDirty, errors },
  } = useForm<TeleprompterSettingsType>({
    defaultValues: data,
    resetOptions: { keepDirtyValues: true },
  });

  // update form if we get new data from server
  useEffect(() => {
    reset(data);
  }, [data, reset]);

  const onSubmit = async (formData: TeleprompterSettingsType) => {
    try {
      await mutateAsync({ ...formData, charsPerLine: Number(formData.charsPerLine) });
    } catch (error) {
      setError('root', { message: maybeAxiosError(error) });
    }
  };

  const onReset = () => reset(data);

  const scriptOptions = [
    { value: 'note', label: 'Note' },
    { value: 'title', label: 'Title' },
    ...Object.entries(customFields)
      .filter(([, field]) => field.type === 'text')
      .map(([key, field]) => ({ value: `custom-${key}`, label: field.label })),
  ];

  return (
    <Panel.Section
      as='form'
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(event) => preventEscape(event, onReset)}
      id='teleprompter-settings'
    >
      <Panel.Card>
        <Panel.SubHeader>
          Teleprompter
          <Panel.InlineElements>
            <Button disabled={!isDirty || isSubmitting} variant='ghosted' onClick={onReset}>
              Revert to saved
            </Button>
            <Button type='submit' loading={isSubmitting} disabled={!isDirty} variant='primary'>
              Save
            </Button>
          </Panel.InlineElements>
        </Panel.SubHeader>
        <Panel.Divider />
        <Panel.Section>
          <Info>
            Every teleprompter view, Companion and the integration API read the script these settings make, so all of
            them count the same lines. How each view shows it is set in the view's options.
          </Info>
          <Panel.Loader isLoading={status === 'pending'} />
          <Panel.Error>{errors.root?.message}</Panel.Error>
          <Panel.ListGroup>
            <Panel.ListItem>
              <Panel.Field title='Script field' description='The field which holds the text to read' />
              <Select
                value={watch('script')}
                onValueChange={(value: string | null) => {
                  if (value !== null) setValue('script', value, { shouldDirty: true });
                }}
                options={scriptOptions}
              />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field
                title='Line length'
                description={`Characters per line, ${teleprompterCharsPerLine.min} to ${teleprompterCharsPerLine.max}. Text grows until the longest line fills the width, so shorter lines mean larger text`}
                error={errors.charsPerLine?.message}
              />
              <Input
                type='number'
                style={{ width: '75px' }}
                {...register('charsPerLine', {
                  required: { value: true, message: 'Required field' },
                  min: { value: teleprompterCharsPerLine.min, message: `Minimum is ${teleprompterCharsPerLine.min}` },
                  max: { value: teleprompterCharsPerLine.max, message: `Maximum is ${teleprompterCharsPerLine.max}` },
                })}
              />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field title='Event heading' description='Shown above the script of each event' />
              <Select
                value={watch('heading')}
                onValueChange={(value: TeleprompterHeading | null) => {
                  if (value !== null) setValue('heading', value, { shouldDirty: true });
                }}
                options={headingOptions}
              />
            </Panel.ListItem>
          </Panel.ListGroup>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
