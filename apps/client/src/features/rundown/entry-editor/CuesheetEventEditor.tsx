import { OntimeEntry, Rundown, isOntimeEvent, isOntimeGroup, isOntimeMilestone } from 'ontime-types';
import { useMemo } from 'react';

import EventEditor from './EventEditor';
import GroupEditor from './GroupEditor';
import MilestoneEditor from './MilestoneEditor';

import style from './EntryEditor.module.scss';

interface CuesheetEntryEditorProps {
  entryId: string;
  rundown: Rundown;
}

export default function CuesheetEntryEditor({ entryId, rundown }: CuesheetEntryEditorProps) {
  const entry = useMemo<OntimeEntry | null>(() => {
    if (rundown.order.length === 0) {
      return null;
    }

    const event = rundown.entries[entryId];
    return event ?? null;
  }, [entryId, rundown.entries, rundown.order.length]);

  if (isOntimeEvent(entry)) {
    return (
      <div className={style.entryEditor} data-testid='editor-container'>
        <EventEditor event={entry} />
      </div>
    );
  }

  if (isOntimeMilestone(entry)) {
    return (
      <div className={style.inModal} data-testid='editor-container'>
        <MilestoneEditor milestone={entry} />
      </div>
    );
  }

  if (isOntimeGroup(entry)) {
    return (
      <div className={style.inModal} data-testid='editor-container'>
        <GroupEditor group={entry} />
      </div>
    );
  }

  return null;
}
