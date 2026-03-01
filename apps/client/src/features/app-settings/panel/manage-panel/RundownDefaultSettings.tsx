import { EndAction, TimeStrategy, TimerType } from 'ontime-types';
import { parseUserTime } from 'ontime-utils';

import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import Select from '../../../../common/components/select/Select';
import Switch from '../../../../common/components/switch/Switch';
import { editorSettingsDefaults, useEditorSettings } from '../../../../common/stores/editorSettings';
import * as Panel from '../../panel-utils/PanelUtils';

export default function RundownDefaultSettings() {
  const {
    defaultDuration,
    linkPrevious,
    defaultTimeStrategy,
    defaultWarnTime,
    defaultDangerTime,
    defaultTimerType,
    defaultEndAction,
    setDefaultDuration,
    setLinkPrevious,
    setTimeStrategy,
    setWarnTime,
    setDangerTime,
    setDefaultTimerType,
    setDefaultEndAction,
  } = useEditorSettings((state) => state);

  const durationInMs = parseUserTime(defaultDuration);
  const warnTimeInMs = parseUserTime(defaultWarnTime);
  const dangerTimeInMs = parseUserTime(defaultDangerTime);

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
          <Panel.ListGroup>
            <Panel.ListItem>
              <Panel.Field title='Warning time' description='Default threshold for warning time in an event' />
              <TimeInput<'warnTime'>
                name='warnTime'
                submitHandler={(_field, value) => setWarnTime(value)}
                time={warnTimeInMs}
                placeholder={editorSettingsDefaults.warnTime}
              />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field title='Danger time' description='Default threshold for danger time in an event' />
              <TimeInput<'dangerTime'>
                name='dangerTime'
                submitHandler={(_field, value) => setDangerTime(value)}
                time={dangerTimeInMs}
                placeholder={editorSettingsDefaults.dangerTime}
              />
            </Panel.ListItem>
          </Panel.ListGroup>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
