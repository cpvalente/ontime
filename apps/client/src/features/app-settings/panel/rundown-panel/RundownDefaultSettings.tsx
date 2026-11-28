import { EndAction, Settings, TimeStrategy, TimerType } from 'ontime-types';
import { defaultRundownDefaults, millisToString, parseUserTime } from 'ontime-utils';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import PhaseThresholdInput from '../../../../common/components/input/phase-threshold-input/PhaseThresholdInput';
import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import Select from '../../../../common/components/select/Select';
import Switch from '../../../../common/components/switch/Switch';
import useSettings, { useUpdateSettings } from '../../../../common/hooks-query/useSettings';
import { preventEscape } from '../../../../common/utils/keyEvent';
import * as Panel from '../../panel-utils/PanelUtils';

type RundownDefaultFields = Pick<Settings, 'rundownDefaults' | 'phaseThresholds'>;

function toRundownDefaultFields(settings: Settings): RundownDefaultFields {
  return { rundownDefaults: settings.rundownDefaults, phaseThresholds: settings.phaseThresholds };
}

export default function RundownDefaultSettings() {
  const { data, status } = useSettings();
  const { updateSettings } = useUpdateSettings();
  const {
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { isSubmitting, isDirty, errors, dirtyFields },
  } = useForm<RundownDefaultFields>({
    defaultValues: toRundownDefaultFields(data),
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  // keep the form in sync with the project settings
  useEffect(() => {
    if (data) {
      reset(toRundownDefaultFields(data));
    }
  }, [data, reset]);

  const onSubmit = async (formData: RundownDefaultFields) => {
    try {
      await updateSettings(formData);
    } catch (error) {
      setError('root', { message: maybeAxiosError(error) });
    }
  };

  const onReset = () => {
    reset(toRundownDefaultFields(data));
  };

  const { rundownDefaults, phaseThresholds } = watch();
  const isLoading = status === 'pending';

  return (
    <Panel.Section
      as='form'
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(event) => preventEscape(event, onReset)}
      id='rundown-default-settings'
    >
      <Panel.Card>
        <Panel.SubHeader>
          Rundown defaults
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
          <Panel.Loader isLoading={isLoading} />
          <Panel.Error>{errors.root?.message}</Panel.Error>
          <Panel.Title>Default settings for new events</Panel.Title>
          <Panel.ListGroup>
            <Panel.ListItem>
              <Panel.Field
                title='Link previous'
                description='Whether the start time of new events should be linked to the previous event end time'
              />
              <Switch
                size='large'
                className={Panel.pendingClass(dirtyFields.rundownDefaults?.linkPrevious)}
                checked={rundownDefaults.linkPrevious}
                onCheckedChange={(value: boolean) =>
                  setValue('rundownDefaults.linkPrevious', value, { shouldDirty: true })
                }
              />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field
                title='Inherit group colour'
                description='Whether new events and milestones inherit the colour of their parent group'
              />
              <Switch
                size='large'
                className={Panel.pendingClass(dirtyFields.rundownDefaults?.inheritGroupColour)}
                checked={rundownDefaults.inheritGroupColour}
                onCheckedChange={(value: boolean) =>
                  setValue('rundownDefaults.inheritGroupColour', value, { shouldDirty: true })
                }
              />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field
                title='Timer strategy'
                description='Which time should be maintained when event schedule is recalculated'
              />
              <Select
                triggerClassName={Panel.pendingClass(dirtyFields.rundownDefaults?.timeStrategy)}
                value={rundownDefaults.timeStrategy}
                onValueChange={(value: TimeStrategy | null) => {
                  if (value === null) return;
                  setValue('rundownDefaults.timeStrategy', value, { shouldDirty: true });
                }}
                options={[
                  { value: TimeStrategy.LockDuration, label: 'Duration' },
                  { value: TimeStrategy.LockEnd, label: 'End Time' },
                ]}
              />
            </Panel.ListItem>
          </Panel.ListGroup>
          <Panel.ListGroup>
            <Panel.ListItem>
              <Panel.Field title='Default duration' description='Default duration for new events' />
              <TimeInput<'duration'>
                name='duration'
                className={Panel.pendingClass(dirtyFields.rundownDefaults?.duration)}
                submitHandler={(_field, value) =>
                  setValue('rundownDefaults.duration', parseUserTime(value), { shouldDirty: true })
                }
                time={rundownDefaults.duration}
                placeholder={millisToString(defaultRundownDefaults.duration)}
              />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field title='Timer type' description='Default type of timer for new events' />
              <Select
                triggerClassName={Panel.pendingClass(dirtyFields.rundownDefaults?.timerType)}
                value={rundownDefaults.timerType}
                onValueChange={(value: TimerType | null) => {
                  if (value === null) return;
                  setValue('rundownDefaults.timerType', value, { shouldDirty: true });
                }}
                options={[
                  { value: TimerType.CountDown, label: 'Count down' },
                  { value: TimerType.CountUp, label: 'Count up' },
                  { value: TimerType.Clock, label: 'Clock' },
                  { value: TimerType.None, label: 'None' },
                ]}
              />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field title='End Action' description='Default end action for new events' />
              <Select
                triggerClassName={Panel.pendingClass(dirtyFields.rundownDefaults?.endAction)}
                value={rundownDefaults.endAction}
                onValueChange={(value: EndAction | null) => {
                  if (value === null) return;
                  setValue('rundownDefaults.endAction', value, { shouldDirty: true });
                }}
                options={[
                  { value: EndAction.None, label: 'None' },
                  { value: EndAction.LoadNext, label: 'Load next' },
                  { value: EndAction.PlayNext, label: 'Play next' },
                ]}
              />
            </Panel.ListItem>
          </Panel.ListGroup>
          <Panel.ListGroup>
            <Panel.ListItem>
              <Panel.Field title='Warning time' description='Time or % of duration left, eg: 2m or 20%' />
              <PhaseThresholdInput
                name='projectWarning'
                label='Warning'
                className={Panel.pendingClass(dirtyFields.phaseThresholds?.warning)}
                disabled={status !== 'success'}
                value={phaseThresholds.warning}
                onChange={(threshold) => setValue('phaseThresholds.warning', threshold, { shouldDirty: true })}
              />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field title='Danger time' description='Time or % of duration left, eg: 1m or 10%' />
              <PhaseThresholdInput
                name='projectDanger'
                label='Danger'
                className={Panel.pendingClass(dirtyFields.phaseThresholds?.danger)}
                disabled={status !== 'success'}
                value={phaseThresholds.danger}
                onChange={(threshold) => setValue('phaseThresholds.danger', threshold, { shouldDirty: true })}
              />
            </Panel.ListItem>
          </Panel.ListGroup>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
