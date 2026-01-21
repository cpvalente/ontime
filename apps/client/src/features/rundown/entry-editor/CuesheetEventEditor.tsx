import { useMemo } from 'react';
import { isOntimeEvent, isOntimeGroup, isOntimeMilestone, OntimeEntry } from 'ontime-types';

import useRundown from '../../../common/hooks-query/useRundown';

import EventEditor from './EventEditor';
import GroupEditor from './GroupEditor';
import MilestoneEditor from './MilestoneEditor';

import style from './EntryEditor.module.scss';

interface CuesheetEntryEditorProps {
  entryId: string;
}

export default function CuesheetEntryEditor({ entryId }: CuesheetEntryEditorProps) {
  const { data } = useRundown();

  const entry = useMemo<OntimeEntry | null>(() => {
    if (data.order.length === 0) {
      return null;
    }

    const event = data.entries[entryId];
    return event ?? null;
  }, [entryId, data.order, data.entries]);

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
