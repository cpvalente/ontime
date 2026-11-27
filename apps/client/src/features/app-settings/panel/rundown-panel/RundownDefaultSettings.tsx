import { EndAction, PhaseThreshold, PhaseThresholds, TimeStrategy, TimerType } from 'ontime-types';
import { parseUserTime } from 'ontime-utils';
import { useState } from 'react';

import { maybeAxiosError } from '../../../../common/api/utils';
import PhaseThresholdInput from '../../../../common/components/input/phase-threshold-input/PhaseThresholdInput';
import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import Select from '../../../../common/components/select/Select';
import Switch from '../../../../common/components/switch/Switch';
import useSettings, { useUpdateSettings } from '../../../../common/hooks-query/useSettings';
import { editorSettingsDefaults, useEditorSettings } from '../../../../common/stores/editorSettings';
import * as Panel from '../../panel-utils/PanelUtils';

export default function RundownDefaultSettings() {
  const {
    defaultDuration,
    linkPrevious,
    defaultTimeStrategy,
    defaultTimerType,
    defaultEndAction,
    inheritGroupColour,
    setDefaultDuration,
    setLinkPrevious,
    setTimeStrategy,
    setDefaultTimerType,
    setDefaultEndAction,
    setInheritGroupColour,
  } = useEditorSettings((state) => state);

  const { data: settings, status } = useSettings();
  const { updateSettings } = useUpdateSettings();
  const [error, setError] = useState<string | null>(null);

  const durationInMs = parseUserTime(defaultDuration);

  const submitThreshold = async (phase: keyof PhaseThresholds, threshold: PhaseThreshold) => {
    try {
      setError(null);
      await updateSettings({ ...settings, phaseThresholds: { ...settings.phaseThresholds, [phase]: threshold } });
    } catch (submitError) {
      setError(maybeAxiosError(submitError));
    }
  };

  return (
    <Panel.Section>
      <Panel.Card>
        <Panel.SubHeader>Rundown defaults</Panel.SubHeader>
        <Panel.Divider />
        <Panel.Section>
          <Panel.Title>Default settings for new events</Panel.Title>
          <Panel.ListGroup>
            <Panel.ListItem>
              <Panel.Field
                title='Link previous'
                description='Whether the start time of new events should be linked to the previous event end time'
              />
              <Switch size='large' checked={linkPrevious} onCheckedChange={setLinkPrevious} />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field
                title='Inherit group colour'
                description='Whether new events and milestones inherit the colour of their parent group'
              />
              <Switch size='large' checked={inheritGroupColour} onCheckedChange={setInheritGroupColour} />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field
                title='Timer strategy'
                description='Which time should be maintained when event schedule is recalculated'
              />
              <Select
                value={defaultTimeStrategy}
                onValueChange={(value: TimeStrategy | null) => {
                  if (value === null) return;
                  setTimeStrategy(value);
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
              <TimeInput<'defaultDuration'>
                name='defaultDuration'
                submitHandler={(_field, value) => setDefaultDuration(value)}
                time={durationInMs}
                placeholder={editorSettingsDefaults.duration}
              />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field title='Timer type' description='Default type of timer for new events' />
              <Select
                value={defaultTimerType}
                onValueChange={(value: TimerType | null) => {
                  if (value === null) return;
                  setDefaultTimerType(value);
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
                value={defaultEndAction}
                onValueChange={(value: EndAction | null) => {
                  if (value === null) return;
                  setDefaultEndAction(value);
                }}
                options={[
                  { value: EndAction.None, label: 'None' },
                  { value: EndAction.LoadNext, label: 'Load next' },
                  { value: EndAction.PlayNext, label: 'Play next' },
                ]}
              />
            </Panel.ListItem>
          </Panel.ListGroup>
          {error && <Panel.Error>{error}</Panel.Error>}
          <Panel.ListGroup>
            <Panel.ListItem>
              <Panel.Field title='Warning time' description='Time or % of duration left, eg: 2m or 20%' />
              <PhaseThresholdInput
                name='projectWarning'
                label='Warning'
                disabled={status !== 'success'}
                value={settings.phaseThresholds.warning}
                onChange={(threshold) => submitThreshold('warning', threshold)}
              />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field title='Danger time' description='Time or % of duration left, eg: 1m or 10%' />
              <PhaseThresholdInput
                name='projectDanger'
                label='Danger'
                disabled={status !== 'success'}
                value={settings.phaseThresholds.danger}
                onChange={(threshold) => submitThreshold('danger', threshold)}
              />
            </Panel.ListItem>
          </Panel.ListGroup>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
