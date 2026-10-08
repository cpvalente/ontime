import type { TeleprompterHeading, TeleprompterSettings as TeleprompterSettingsType } from 'ontime-types';
import { teleprompterCharsPerLine } from 'ontime-utils';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Info from '../../../../common/components/info/Info';
import Input from '../../../../common/components/input/input/Input';
import Select from '../../../../common/components/select/Select';
import Switch from '../../../../common/components/switch/Switch';
import useCustomFields from '../../../../common/hooks-query/useCustomFields';
import useViewSettings from '../../../../common/hooks-query/useViewSettings';
import { preventEscape } from '../../../../common/utils/keyEvent';
import * as Panel from '../../panel-utils/PanelUtils';

const headingOptions: { value: TeleprompterHeading; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'cue', label: 'Cue' },
  { value: 'both', label: 'Cue and title' },
  { value: 'none', label: 'None' },
];

/** Settings shared by every teleprompter remote screen and controller, kept with the project */
export default function TeleprompterSettings() {
  const { data, status, mutateAsync } = useViewSettings();
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
    defaultValues: data.teleprompter,
    resetOptions: { keepDirtyValues: true },
  });

  // update form if we get new data from server
  useEffect(() => {
    reset(data.teleprompter);
  }, [data, reset]);

  const onSubmit = async (formData: TeleprompterSettingsType) => {
    try {
      await mutateAsync({ ...data, teleprompter: { ...formData, charsPerLine: Number(formData.charsPerLine) } });
    } catch (error) {
      setError('root', { message: maybeAxiosError(error) });
    }
  };

  const onReset = () => reset(data.teleprompter);

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
            Every teleprompter remote screen and controller uses these settings, so all of them show the same lines.
          </Info>
          <Panel.Loader isLoading={status === 'pending'} />
          <Panel.Error>{errors.root?.message}</Panel.Error>
          <Panel.ListGroup>
            <Panel.ListItem>
              <Panel.Field title='Script' description='The field which holds the script to read' />
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
                title='Characters per line'
                description={`Where lines break (${teleprompterCharsPerLine.min}-${teleprompterCharsPerLine.max}). Screens size the text to fit the longest line`}
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
              <Panel.Field title='Heading' description='What to show above the script of each event' />
              <Select
                value={watch('heading')}
                onValueChange={(value: TeleprompterHeading | null) => {
                  if (value !== null) setValue('heading', value, { shouldDirty: true });
                }}
                options={headingOptions}
              />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field title='Group titles' description='Shows the group title when the script enters a group' />
              <Switch
                size='large'
                checked={watch('showGroups')}
                onCheckedChange={(value: boolean) => setValue('showGroups', value, { shouldDirty: true })}
              />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field title='Hide events without a script' description='Leaves out events with no script text' />
              <Switch
                size='large'
                checked={watch('hideEmpty')}
                onCheckedChange={(value: boolean) => setValue('hideEmpty', value, { shouldDirty: true })}
              />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field
                title='Follow loaded event'
                description='Cued: loading an event moves the reader to it, and playback stops at the end of each event. Off: playback reads on to the end of the script'
              />
              <Switch
                size='large'
                checked={watch('followLoaded')}
                onCheckedChange={(value: boolean) => setValue('followLoaded', value, { shouldDirty: true })}
              />
            </Panel.ListItem>
          </Panel.ListGroup>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
