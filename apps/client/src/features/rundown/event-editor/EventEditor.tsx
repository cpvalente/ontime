import { CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@chakra-ui/react';
import { CustomFieldLabel, OntimeEvent } from 'ontime-types';

import CopyTag from '../../../common/components/copy-tag/CopyTag';
import useCustomFields from '../../../common/hooks-query/useCustomFields';
import { getAccessibleColour } from '../../../common/utils/styleUtils';

import EventEditorTimes from './composite/EventEditorTimes';
import EventEditorTitles from './composite/EventEditorTitles';
import EventTextArea from './composite/EventTextArea';

import style from './EventEditor.module.scss';

export type EventEditorSubmitActions = keyof OntimeEvent;

export type EditorUpdateFields = 'cue' | 'title' | 'note' | 'colour' | CustomFieldLabel;

interface EventEditorProps {
  event: OntimeEvent | null;
  handleSubmit: (field: EditorUpdateFields, value: string) => void;
  isMultiple: boolean;
}

export default function EventEditor({ event, handleSubmit, isMultiple }: EventEditorProps) {
  const { data: customFields } = useCustomFields();
  const [_searchParams, setSearchParams] = useSearchParams();

  const handleOpenCustomManager = () => {
    setSearchParams({ settings: 'project_settings__custom' });
  };

  if (!event) {
    return (
      <div className={style.eventEditor} data-testid='editor-container'>
        Select an event to edit
      </div>
    );
  }

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
          {Object.keys(customFields).map((label) => {
            const key = `${event.id}-${label}`;
            const fieldName = `custom-${label}`;
            const initialValue = event.custom[label]?.value ?? '';
            const { backgroundColor, color } = getAccessibleColour(customFields[label].colour);

            return (
              <EventTextArea
                key={key}
                field={fieldName}
                label={label}
                initialValue={initialValue}
                submitHandler={handleSubmit}
                className={style.decorated}
                style={{ '--decorator-bg': backgroundColor, '--decorator-color': color } as CSSProperties}
              />
            );
          })}
        </div>
      </div>
      {!isMultiple ? (
        <div className={style.footer}>
          <CopyTag label='OSC trigger by id'>{`/ontime/load/id "${event.id}"`}</CopyTag>
          <CopyTag label='OSC trigger by cue'>{`/ontime/load/cue "${event.cue}"`}</CopyTag>
        </div>
      ) : null}
    </div>
  );
}
