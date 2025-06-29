import { useEffect, useState } from 'react';
import { isOntimeBlock, isOntimeEvent, OntimeEntry } from 'ontime-types';

import useRundown from '../../../common/hooks-query/useRundown';

import BlockEditor from './BlockEditor';
import EventEditor from './EventEditor';

import style from './EntryEditor.module.scss';

interface CuesheetEntryEditorProps {
  entryId: string;
}

export default function CuesheetEntryEditor({ entryId }: CuesheetEntryEditorProps) {
  const { data } = useRundown();
  const [entry, setEntry] = useState<OntimeEntry | null>(null);

  useEffect(() => {
    if (data.order.length === 0) {
      setEntry(null);
      return;
    }

    const event = data.entries[entryId];
    if (event) {
      setEntry(event);
    } else {
      setEntry(null);
    }
  }, [entryId, data.order, data.entries]);

  if (isOntimeEvent(entry)) {
    return (
      <div className={style.entryEditor} data-testid='editor-container'>
        <EventEditor event={entry} />
      </div>
    );
  }

  if (isOntimeBlock(entry)) {
    return (
      <div className={style.inModal} data-testid='editor-container'>
        <BlockEditor block={entry} />
      </div>
    );
  }

  return null;
}
