import { useCallback, useState } from 'react';
import { OntimeEvent, TimeStrategy } from 'ontime-types';
import { parseUserTime } from 'ontime-utils';

import Button from '../../../common/components/buttons/Button';
import Dialog from '../../../common/components/dialog/Dialog';
import * as Editor from '../../../common/components/editor-utils/EditorUtils';
import Info from '../../../common/components/info/Info';
import AppLink from '../../../common/components/link/app-link/AppLink';
import { useEntryActionsContext } from '../../../common/context/EntryActionsContext';
import useCustomFields from '../../../common/hooks-query/useCustomFields';

import EntryEditorCustomFields from './composite/EventEditorCustomFields';
import EventEditorTimes from './composite/EventEditorTimes';
import EventEditorTitles from './composite/EventEditorTitles';
import EventEditorTriggers from './composite/EventEditorTriggers';
import { isIndeterminate, MergedEvent } from './multi-edit/multiEditUtils';
import { resolveMergedValues } from './multi-edit/resolveMergedValues';

import style from './EntryEditor.module.scss';

// any of the titles + colour + custom field labels
export type EventEditorUpdateFields = 'cue' | 'title' | 'note' | 'colour' | string;

interface MultiEditConfig {
  merged: MergedEvent;
  selectedIds: string[];
}

interface EventEditorProps {
  event: OntimeEvent;
  multiEdit?: MultiEditConfig;
}

export default function EventEditor({ event, multiEdit }: EventEditorProps) {
  const { data: customFields } = useCustomFields();
  const { updateEntry, batchUpdateEvents } = useEntryActionsContext();
  const [pendingStrategy, setPendingStrategy] = useState<TimeStrategy | null>(null);

  const isEditor = window.location.pathname.includes('editor');
  const isMulti = !!multiEdit;

  // Single-event handleSubmit (used when no multiEdit)
  const singleHandleSubmit = useCallback(
    (field: EventEditorUpdateFields, value: string) => {
      if (field.startsWith('custom-')) {
        const fieldLabel = field.split('custom-')[1];
        updateEntry({ id: event.id, custom: { [fieldLabel]: value } });
      } else {
        updateEntry({ id: event.id, [field]: value });
      }
    },
    [event.id, updateEntry],
  );

  // Multi-event handleSubmit
  const multiHandleSubmit = useCallback(
    (field: string, value: string | boolean) => {
      if (!multiEdit) return;
      if (field.startsWith('custom-')) {
        const fieldKey = field.split('custom-')[1];
        batchUpdateEvents({ custom: { [fieldKey]: value } } as Partial<OntimeEvent>, multiEdit.selectedIds);
      } else if (field === 'duration' || field === 'timeWarning' || field === 'timeDanger') {
        const ms = parseUserTime(value as string);
        batchUpdateEvents({ [field]: ms } as Partial<OntimeEvent>, multiEdit.selectedIds);
      } else {
        batchUpdateEvents({ [field]: value } as Partial<OntimeEvent>, multiEdit.selectedIds);
      }
    },
    [batchUpdateEvents, multiEdit],
  );

  const handleConfirmStrategy = useCallback(() => {
    if (pendingStrategy && multiEdit) {
      batchUpdateEvents({ timeStrategy: pendingStrategy }, multiEdit.selectedIds);
    }
    setPendingStrategy(null);
  }, [batchUpdateEvents, multiEdit, pendingStrategy]);

  const handleSubmit = isMulti ? multiHandleSubmit : singleHandleSubmit;

  const merged = multiEdit?.merged;
  const resolved = resolveMergedValues(event, merged);

  return (
    <div className={style.content}>
      {isMulti && merged && (
        <Info type='info'>
          <span className={style.bold}>Batch Edit:</span> {multiEdit.selectedIds.length} events selected
        </Info>
      )}
      <EventEditorTimes
        key={`${event.id}-times`}
        eventId={event.id}
        timeStart={event.timeStart}
        timeEnd={event.timeEnd}
        duration={resolved.duration}
        timeStrategy={event.timeStrategy}
        linkStart={resolved.linkStart}
        countToEnd={resolved.countToEnd}
        delay={event.delay}
        endAction={resolved.endAction}
        timerType={resolved.timerType}
        timeWarning={resolved.timeWarning}
        timeDanger={resolved.timeDanger}
        onSubmit={isMulti ? multiHandleSubmit : undefined}
        multiEdit={
          merged
            ? {
                endActionIndeterminate: isIndeterminate(merged.endAction),
                countToEndIndeterminate: isIndeterminate(merged.countToEnd),
                countToEndTally: merged.countToEndTally,
                timerTypeIndeterminate: isIndeterminate(merged.timerType),
                timeWarningIndeterminate: isIndeterminate(merged.timeWarning),
                timeDangerIndeterminate: isIndeterminate(merged.timeDanger),
                linkStartIndeterminate: isIndeterminate(merged.linkStart),
                durationLockIndeterminate: isIndeterminate(merged.timeStrategy),
                allLockDuration: merged.allLockDuration,
                allLockEnd: merged.allLockEnd,
              }
            : undefined
        }
        onStrategyChange={isMulti ? setPendingStrategy : undefined}
      />
      <EventEditorTitles
        key={`${event.id}-titles`}
        eventId={event.id}
        cue={event.cue}
        flag={resolved.flag}
        title={resolved.title}
        note={resolved.note}
        colour={resolved.colour}
        titlePlaceholder={resolved.titlePlaceholder}
        notePlaceholder={resolved.notePlaceholder}
        onSubmit={isMulti ? multiHandleSubmit : undefined}
        multiEdit={
          merged
            ? {
                flagIndeterminate: isIndeterminate(merged.flag),
                flagTally: merged.flagTally,
                colourIndeterminate: resolved.colourIndeterminate,
              }
            : undefined
        }
      />
      <div className={style.column}>
        <Editor.Title>
          Custom Fields
          {isEditor && <AppLink search='settings=manage__custom'>Manage Custom Fields</AppLink>}
        </Editor.Title>
        <EntryEditorCustomFields
          fields={customFields}
          handleSubmit={handleSubmit}
          entry={event}
          mergedCustom={merged?.custom}
        />
      </div>
      <div className={style.column}>
        <Editor.Title>
          Automations
          {isEditor && !isMulti && <AppLink search='settings=automation'>Manage Automations</AppLink>}
        </Editor.Title>
        {isMulti ? (
          <Info type='info'>Not available when editing multiple events</Info>
        ) : (
          <EventEditorTriggers triggers={event.triggers} eventId={event.id} />
        )}
      </div>
      {isMulti && (
        <Dialog
          isOpen={pendingStrategy !== null}
          onClose={() => setPendingStrategy(null)}
          title='Warning!'
          showBackdrop
          showCloseButton
          bodyElements={
            pendingStrategy === TimeStrategy.LockDuration
              ? "This will set duration lock for all selected events and may significantly impact this rundown's total duration."
              : 'This will set end lock for all selected events and may cause the rundown to behave unexpectedly.'
          }
          footerElements={
            <>
              <Button variant='ghosted-white' size='large' onClick={() => setPendingStrategy(null)}>
                No
              </Button>
              <Button variant='destructive' size='large' onClick={handleConfirmStrategy}>
                Yes
              </Button>
            </>
          }
        />
      )}
    </div>
  );
}
