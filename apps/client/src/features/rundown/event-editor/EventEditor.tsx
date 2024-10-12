import { CSSProperties, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@chakra-ui/react';
import { CustomFieldLabel, EventCustomFields, OntimeEvent } from 'ontime-types';

import CopyTag from '../../../common/components/copy-tag/CopyTag';
import { useEventAction } from '../../../common/hooks/useEventAction';
import useCustomFields from '../../../common/hooks-query/useCustomFields';
import { getAccessibleColour } from '../../../common/utils/styleUtils';

import EventEditorTimes from './composite/EventEditorTimes';
import EventEditorTitles from './composite/EventEditorTitles';
import EventTextArea from './composite/EventTextArea';
import { getInitialAndPlaceholder } from './placeholderUtil';

import style from './EventEditor.module.scss';

export type EventEditorSubmitActions = keyof OntimeEvent;
export type MultiOntimeEvent = Omit<Partial<OntimeEvent>, 'id' | 'custom'> & {
  id: string[];
  custom: EventCustomFields;
};

export type EditorUpdateFields = 'cue' | 'title' | 'note' | 'colour' | CustomFieldLabel;

interface EventEditorProps {
  event: OntimeEvent;
  isMultiple?: false;
}

interface EventEditorMultiProps {
  event: MultiOntimeEvent;
  isMultiple: true;
}

export default function EventEditor({ event, isMultiple }: EventEditorProps | EventEditorMultiProps) {
  const { data: customFields } = useCustomFields();
  const [_searchParams, setSearchParams] = useSearchParams();
  const { updateEvent, batchUpdateEvents } = useEventAction();

  const handleOpenCustomManager = () => {
    setSearchParams({ settings: 'feature_settings__custom' });
  };
  const idString = isMultiple ? event.id.join(', ') : event.id;

  const submitCustomHandler = useCallback(
    (field: CustomFieldLabel, value: string) => {
      const fieldLabel = field.split('custom-')[1];
      if (isMultiple) {
        batchUpdateEvents({ custom: { [fieldLabel]: value } }, event.id);
      } else {
        updateEvent({ id: event.id, custom: { [fieldLabel]: value } });
      }
    },
    [batchUpdateEvents, event, isMultiple, updateEvent],
  );

  const submitHandler = useCallback(
    (field: EditorUpdateFields, value: string) => {
      if (isMultiple) {
        batchUpdateEvents({ [field]: value }, event.id);
      } else {
        updateEvent({ id: event.id, [field]: value });
      }
    },
    [batchUpdateEvents, event, isMultiple, updateEvent],
  );

  return (
    <div className={style.eventEditor} data-testid='editor-container'>
      <div className={style.content}>
        <EventEditorTimes
          key={`${idString}-times`}
          id={event.id}
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
          isMultiple
        />
        <EventEditorTitles
          key={`${idString}-titles`}
          eventId={idString}
          cue={event.cue}
          title={event.title}
          note={event.note}
          colour={event.colour}
          submitHandler={submitHandler}
          isMultiple
        />
        <div className={style.column}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Custom Fields</span>
            <Button variant='ontime-subtle' size='sm' onClick={handleOpenCustomManager}>
              Manage
            </Button>
          </div>
          {Object.keys(customFields).map((fieldKey) => {
            const key = `${idString}-${fieldKey}`;
            const fieldName = `custom-${fieldKey}`;
            const [initialValue, placeholder] = getInitialAndPlaceholder(event.custom[fieldKey], isMultiple);
            const { backgroundColor, color } = getAccessibleColour(customFields[fieldKey].colour);
            const labelText = customFields[fieldKey].label;

            return (
              <EventTextArea
                key={key}
                field={fieldName}
                label={labelText}
                initialValue={initialValue}
                placeholder={placeholder}
                submitHandler={submitCustomHandler}
                className={style.decorated}
                style={{ '--decorator-bg': backgroundColor, '--decorator-color': color } as CSSProperties}
              />
            );
          })}
        </div>
      </div>
      {isMultiple ? null : (
        <div className={style.footer}>
          <CopyTag label='OSC trigger by id'>{`/ontime/load/id "${event.id}"`}</CopyTag>
          <CopyTag label='OSC trigger by cue'>{`/ontime/load/cue "${event.cue}"`}</CopyTag>
        </div>
      )}
    </div>
  );
}
