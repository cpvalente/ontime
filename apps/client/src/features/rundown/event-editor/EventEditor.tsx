import { CSSProperties, memo, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@chakra-ui/react';
import { CustomFieldLabel, isOntimeEvent, OntimeEvent } from 'ontime-types';

import CopyTag from '../../../common/components/copy-tag/CopyTag';
import { useEventAction } from '../../../common/hooks/useEventAction';
import useCustomFields from '../../../common/hooks-query/useCustomFields';
import useRundown from '../../../common/hooks-query/useRundown';
import { getAccessibleColour } from '../../../common/utils/styleUtils';
import { useEventSelection } from '../useEventSelection';

import EventEditorTimes from './composite/EventEditorTimes';
import EventEditorTitles from './composite/EventEditorTitles';
import EventTextArea from './composite/EventTextArea';
import EventEditorEmpty from './EventEditorEmpty';

import style from './EventEditor.module.scss';

export type EventEditorSubmitActions = keyof OntimeEvent;

export type EditorUpdateFields = 'cue' | 'title' | 'note' | 'colour' | CustomFieldLabel;

export default function EventEditor() {
  const { selectedEvents } = useEventSelection(); //don't use state selector so we get all updates to selectedEvents
  const { data } = useRundown();
  const { data: customFields } = useCustomFields();
  const { order, rundown } = data;
  const { updateEvent } = useEventAction();
  const [_searchParams, setSearchParams] = useSearchParams();

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

  const multiSelect = selectedEvents.size > 1;

  const handleSubmit = useCallback(
    (field: EditorUpdateFields, value: string) => {
      if (field.startsWith('custom-')) {
        const fieldLabel = field.split('custom-')[1];
        updateEvent({ id: event?.id, custom: { [fieldLabel]: value } });
      } else {
        updateEvent({ id: event?.id, [field]: value });
      }
    },
    [event?.id, updateEvent],
  );

  const handleOpenCustomManager = () => {
    setSearchParams({ settings: 'feature_settings__custom' });
  };

  if (!event) {
    return <EventEditorEmpty />;
  }

  return (
    <div className={`${style.eventEditor} ${multiSelect ? style.multi : ''}`} data-testid='editor-container'>
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
          note={event.note}
          colour={event.colour}
          handleSubmit={handleSubmit}
        />
        <div className={style.column}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Custom Fields</span>
            <Button variant='ontime-subtle' size='sm' onClick={handleOpenCustomManager}>
              Manage
            </Button>
          </div>
          {Object.keys(customFields).map((fieldKey) => {
            const key = `${event.id}-${fieldKey}`;
            const fieldName = `custom-${fieldKey}`;
            const initialValue = event.custom[fieldKey] ?? '';
            const { backgroundColor, color } = getAccessibleColour(customFields[fieldKey].colour);
            const labelText = customFields[fieldKey].label;

            return (
              <EventTextArea
                key={key}
                field={fieldName}
                label={labelText}
                initialValue={initialValue}
                submitHandler={handleSubmit}
                className={style.decorated}
                style={{ '--decorator-bg': backgroundColor, '--decorator-color': color } as CSSProperties}
              />
            );
          })}
        </div>
      </div>
      <EventEditorFooter id={event.id} cue={event.cue} />
    </div>
  );
}

interface EventEditorFooterProps {
  id: string;
  cue: string;
}

const EventEditorFooter = memo(_EventEditorFooter);

function _EventEditorFooter(props: EventEditorFooterProps) {
  const { id, cue } = props;

  const loadById = `/ontime/load/id "${id}"`;
  const loadByCue = `/ontime/load/cue "${cue}"`;

  return (
    <div className={style.footer}>
      <CopyTag copyValue={loadById} label='OSC trigger by ID'>
        {loadById}
      </CopyTag>
      <CopyTag copyValue={loadByCue} label='OSC trigger by cue'>
        {loadByCue}
      </CopyTag>
    </div>
  );
}
