import { Select, Switch } from '@chakra-ui/react';
import { EndAction, TimerType } from 'ontime-types';

import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import { editorSettingsDefaults, useEditorSettings } from '../../../../common/stores/editorSettings';
import { forgivingStringToMillis } from '../../../../common/utils/dateConfig';
import * as Panel from '../PanelUtils';

export default function EditorSettingsForm() {
  const eventSettings = useEditorSettings((state) => state);

  const setDefaultDuration = eventSettings.setDefaultDuration;
  const setLinkPrevious = eventSettings.setLinkPrevious;
  const setWarnTime = eventSettings.setWarnTime;
  const setDangerTime = eventSettings.setDangerTime;
  const setDefaultPublic = eventSettings.setDefaultPublic;

  const durationInMs = forgivingStringToMillis(eventSettings.defaultDuration);
  const warnTimeInMs = forgivingStringToMillis(eventSettings.defaultWarnTime);
  const dangerTimeInMs = forgivingStringToMillis(eventSettings.defaultDangerTime);

  return (
    <Panel.Section>
      <Panel.Card>
        <Panel.SubHeader>Editor settings</Panel.SubHeader>
        <Panel.Divider />
        <Panel.Section>
          <Panel.Title>Rundown defaults for new events</Panel.Title>
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
              <Panel.Field
                title='Link previous'
                description='Whether the start time of new events should be linked to the previous event end time'
              />
              <Switch
                variant='ontime'
                size='lg'
                defaultChecked={eventSettings.linkPrevious}
                onChange={(event) => setLinkPrevious(event.target.checked)}
              />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field title='Timer type' description='Default type of timer for new events' />
              <Select variant='ontime' size='sm' width='auto' isDisabled>
                <option value={TimerType.CountDown}>Count down</option>
                <option value={TimerType.CountUp}>Count up</option>
                <option value={TimerType.TimeToEnd}>Time to end</option>
                <option value={TimerType.Clock}>Clock</option>
              </Select>
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field title='End Action' description='Default end action for new events' />
              <Select variant='ontime' size='sm' width='auto' isDisabled>
                <option value={EndAction.None}>None</option>
                <option value={EndAction.Stop}>Stop</option>
                <option value={EndAction.LoadNext}>Load next</option>
                <option value={EndAction.PlayNext}>Play next</option>
              </Select>
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
          <Panel.ListGroup>
            <Panel.ListItem>
              <Panel.Field title='Default public' description='New events will be public' />
              <Switch
                variant='ontime'
                size='lg'
                defaultChecked={eventSettings.defaultPublic}
                onChange={(event) => setDefaultPublic(event.target.checked)}
              />
            </Panel.ListItem>
          </Panel.ListGroup>
        </Panel.Section>
        <Panel.Section>
          <Panel.Title>Play mode</Panel.Title>
          <Panel.ListGroup>
            <Panel.ListItem>
              <Panel.Field
                title='Show quick entry'
                description='Whether the quick entry buttons show above / under selected event'
              />
              <Switch variant='ontime' size='lg' defaultChecked={false} isDisabled />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field
                title='Follow playback'
                description='Whether view automatically follows the event being played'
              />
              <Switch variant='ontime' size='lg' defaultChecked isDisabled />
            </Panel.ListItem>
          </Panel.ListGroup>
        </Panel.Section>
        <Panel.Section>
          <Panel.Title>Edit mode</Panel.Title>
          <Panel.ListGroup>
            <Panel.ListItem>
              <Panel.Field
                title='Show quick entry'
                description='Whether the quick entry buttons show above / under selected event'
              />
              <Switch variant='ontime' size='lg' defaultChecked isDisabled />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field
                title='Follow playback'
                description='Whether view automatically follows the event being played'
              />
              <Switch variant='ontime' size='lg' defaultChecked={false} isDisabled />
            </Panel.ListItem>
          </Panel.ListGroup>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
