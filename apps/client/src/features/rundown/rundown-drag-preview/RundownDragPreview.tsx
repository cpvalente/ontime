import { type OntimeEntry, isOntimeDelay, isOntimeEvent, isOntimeGroup, isOntimeMilestone } from 'ontime-types';
import { millisToString } from 'ontime-utils';
import { IoReorderTwo } from 'react-icons/io5';

import { getAccessibleColour } from '../../../common/utils/styleUtils';

import style from './RundownDragPreview.module.scss';

interface RundownDragPreviewProps {
  entry: OntimeEntry;
  eventIndex?: number;
}

/**
 * Lightweight representation of an entry to be shown in the drag overlay
 * ------------------------------------
 * The rundown list is virtualised, which means that the dragged element
 * is unmounted once it leaves the render window.
 * Rendering the drag overlay guarantees that the user
 * always sees the element being dragged, regardless of the scroll position.
 */
export default function RundownDragPreview({ entry, eventIndex }: RundownDragPreviewProps) {
  const colour = isOntimeDelay(entry) ? '' : entry.colour;
  const binderColours = colour ? getAccessibleColour(colour) : undefined;

  return (
    <div className={style.preview} style={{ '--user-bg': colour || '#929292' }}>
      <div className={style.binder} style={binderColours}>
        <IoReorderTwo />
      </div>
      <div className={style.label}>{getPreviewLabel(entry, eventIndex)}</div>
    </div>
  );
}

function getPreviewLabel(entry: OntimeEntry, eventIndex?: number): string {
  if (isOntimeGroup(entry)) {
    return entry.title || 'Untitled group';
  }

  if (isOntimeEvent(entry)) {
    const prefix = eventIndex !== undefined ? `${eventIndex}` : entry.cue;
    return `${prefix} ${entry.title || 'Untitled'}`.trim();
  }

  if (isOntimeMilestone(entry)) {
    return entry.title || 'Untitled milestone';
  }

  if (isOntimeDelay(entry)) {
    return `Delay ${millisToString(entry.duration)}`;
  }

  return '';
}
