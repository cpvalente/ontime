import { type OntimeEntry, isOntimeDelay, isOntimeEvent, isOntimeGroup, isOntimeMilestone } from 'ontime-types';
import { IoFolderOutline, IoReorderTwo } from 'react-icons/io5';

import { cx, getAccessibleColour } from '../../../common/utils/styleUtils';
import { formatDuration, formatTime } from '../../../common/utils/time';

import style from './RundownDragPreview.module.scss';

interface RundownDragPreviewProps {
  entry: OntimeEntry;
  eventIndex?: number;
  isValidDrop: boolean;
}

export default function RundownDragPreview({ entry, eventIndex, isValidDrop }: RundownDragPreviewProps) {
  const isGroup = isOntimeGroup(entry);
  const colour = isOntimeDelay(entry) ? '' : entry.colour;
  const binderColours = colour ? getAccessibleColour(colour) : undefined;

  return (
    <div className={cx([style.preview, !isValidDrop && style.notAllowed])} style={{ '--user-bg': colour || '#929292' }}>
      <div className={style.binder} style={binderColours}>
        {isGroup ? <IoFolderOutline /> : <IoReorderTwo />}
      </div>
      <div className={style.content}>
        <div className={style.title}>
          {eventIndex !== undefined && <span className={style.index}>{eventIndex}</span>}
          {getTitle(entry)}
        </div>
        <div className={style.meta}>{isValidDrop ? getMeta(entry) : 'Groups cannot be nested'}</div>
      </div>
    </div>
  );
}

function getTitle(entry: OntimeEntry): string {
  if (isOntimeGroup(entry)) {
    return entry.title || 'Untitled group';
  }

  if (isOntimeEvent(entry) || isOntimeMilestone(entry)) {
    return entry.title || 'Untitled';
  }

  return 'Delay';
}

function getMeta(entry: OntimeEntry): string {
  if (isOntimeGroup(entry)) {
    const entryCount = `${entry.entries.length} ${entry.entries.length === 1 ? 'entry' : 'entries'}`;
    return `${entryCount} · ${formatDuration(entry.duration)}`;
  }

  if (isOntimeEvent(entry)) {
    return `${formatTime(entry.timeStart)} → ${formatTime(entry.timeEnd)}`;
  }

  if (isOntimeMilestone(entry)) {
    return entry.cue;
  }

  return formatDuration(entry.duration);
}
