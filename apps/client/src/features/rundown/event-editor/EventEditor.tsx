import { CSSProperties, useCallback, useEffect, useState } from 'react';
import { Button } from '@chakra-ui/react';
import { CustomFieldLabel, isOntimeEvent, OntimeEvent } from 'ontime-types';

import CopyTag from '../../../common/components/copy-tag/CopyTag';
import { useEventAction } from '../../../common/hooks/useEventAction';
import useCustomFields from '../../../common/hooks-query/useCustomFields';
import useRundown from '../../../common/hooks-query/useRundown';
import { useEventSelection } from '../useEventSelection';

import EventEditorTimes from './composite/EventEditorTimes';
import EventEditorTitles from './composite/EventEditorTitles';
import EventEditorUser from './composite/EventEditorUser';
import EventTextArea from './composite/EventTextArea';

import style from './EventEditor.module.scss';

export type EventEditorSubmitActions = keyof OntimeEvent;

// TODO: this logic will become dynamic
export type EditorUpdateFields =
  | 'cue'
  | 'title'
  | 'presenter'
  | 'subtitle'
  | 'note'
  | 'colour'
  | 'user0'
  | 'user1'
  | 'user2'
  | 'user3'
  | 'user4'
  | 'user5'
  | 'user6'
  | 'user7'
  | 'user8'
  | 'user9'
  | CustomFieldLabel; // TODO: keyof customFields

export default function EventEditor() {
  const selectedEvents = useEventSelection((state) => state.selectedEvents);
  const { data } = useRundown();
  const { data: customFields } = useCustomFields();
  const { order, rundown } = data;
  const { updateEvent } = useEventAction();

  const [event, setEvent] = useState<OntimeEvent | null>(null);

  useEffect(() => {
    if (order.length === 0) {
      setEvent(null);
      return;
    }

    const selectedEventId = order.find((eventId) => selectedEvents.has(eventId));
    if (!selectedEventId) {
      setEvent(null);
      return;
    }
    const event = rundown[selectedEventId];

    if (event && isOntimeEvent(event)) {
      setEvent(event);
    } else {
      setEvent(null);
    }
  }, [order, rundown, selectedEvents]);

  const handleSubmit = useCallback(
    (field: EditorUpdateFields, value: string) => {
      if (field.startsWith('custom-')) {
        const fieldLabel = field.split('custom-')[1];
        updateEvent({ id: event?.id, custom: { [fieldLabel]: { value } } });
      } else {
        updateEvent({ id: event?.id, [field]: value });
      }
    },
    [event?.id, updateEvent],
  );

  if (!event) {
    return (
      <div className={style.eventEditor} data-testid='editor-container'>
        Select an event to edit
      </div>
    );
  }

  // Compositing user fields by hand
  // this will be replaced by dynamic logic
  const userFields = {
    user0: event.user0,
    user1: event.user1,
    user2: event.user2,
    user3: event.user3,
    user4: event.user4,
    user5: event.user5,
    user6: event.user6,
    user7: event.user7,
    user8: event.user8,
    user9: event.user9,
  };

  const customKeys = Object.keys(customFields ?? {});

  return (
    <div className={style.eventEditor} data-testid='editor-container'>
      <div className={style.content}>
        <EventEditorTimes
          key={`${event.id}-times`}
          eventId={event.id}
          timeStart={event.timeStart}
          timeEnd={event.timeEnd}
          duration={event.duration}
          timeStrategy={event.timeStrategy}
          linkStart={event.linkStart}
          delay={event.delay ?? 0}
          isPublic={event.isPublic}
          endAction={event.endAction}
          timerType={event.timerType}
          timeWarning={event.timeWarning}
          timeDanger={event.timeDanger}
        />
        <EventEditorTitles
          key={`${event.id}-titles`}
          eventId={event.id}
          cue={event.cue}
          title={event.title}
          presenter={event.presenter}
          subtitle={event.subtitle}
          note={event.note}
          colour={event.colour}
          handleSubmit={handleSubmit}
        />
        <div className={style.column}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Custom Fields</span>
            <Button variant='ontime-subtle' size='sm' isDisabled>
              Manage
            </Button>
          </div>
          {customKeys.map((label) => {
            return (
              <EventTextArea
                key={label}
                field={`custom-${label}`}
                label={label}
                initialValue={event.custom[label]?.value ?? ''}
                submitHandler={handleSubmit}
                className={style.decorated}
                style={{ '--decorator-color': customFields[label].colour } as CSSProperties}
              />
            );
          })}
        </div>
        <EventEditorUser key={`${event.id}-user`} userFields={userFields} handleSubmit={handleSubmit} />
      </div>
      <div className={style.footer}>
        <CopyTag label='OSC trigger by id'>{`/ontime/load/id "${event.id}"`}</CopyTag>
        <CopyTag label='OSC trigger by cue'>{`/ontime/load/cue "${event.cue}"`}</CopyTag>
      </div>
    </div>
  );
}
