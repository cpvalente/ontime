import { MouseEvent, useRef } from 'react';
import {
  IoChevronDown,
  IoChevronUp,
  IoDuplicateOutline,
  IoFolderOpenOutline,
  IoReorderTwo,
  IoTrash,
} from 'react-icons/io5';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EntryId, OntimeGroup } from 'ontime-types';
import { MILLIS_PER_MINUTE } from 'ontime-utils';

import IconButton from '../../../common/components/buttons/IconButton';
import { useContextMenu } from '../../../common/hooks/useContextMenu';
import { useEntryActions } from '../../../common/hooks/useEntryAction';
import { getOffsetState } from '../../../common/utils/offset';
import { cx, getAccessibleColour } from '../../../common/utils/styleUtils';
import { formatDuration, formatTime } from '../../../common/utils/time';
import TitleEditor from '../common/TitleEditor';
import { canDrop } from '../rundown.utils';
import { useEventSelection } from '../useEventSelection';

import style from './RundownGroup.module.scss';

interface RundownGroupProps {
  data: OntimeGroup;
  hasCursor: boolean;
  collapsed: boolean;
  onCollapse: (collapsed: boolean, groupId: EntryId) => void;
}

//TODO: the group should maybe include a multiple day indicator
export default function RundownGroup({ data, hasCursor, collapsed, onCollapse }: RundownGroupProps) {
  const handleRef = useRef<null | HTMLSpanElement>(null);
  const { clone, ungroup, deleteEntry } = useEntryActions();
  const { selectedEvents, setSingleEntrySelection } = useEventSelection();

  const [onContextMenu] = useContextMenu<HTMLDivElement>([
    {
      type: 'item',
      label: 'Clone Group',
      icon: IoDuplicateOutline,
      onClick: () => clone(data.id),
    },
    {
      type: 'item',
      label: 'Ungroup',
      icon: IoFolderOpenOutline,
      onClick: () => ungroup(data.id),
      disabled: data.entries.length === 0,
    },
    { type: 'divider' },
    {
      type: 'item',
      label: 'Delete Group',
      icon: IoTrash,
      onClick: () => deleteEntry([data.id]),
    },
  ]);

  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
    over,
  } = useSortable({
    id: data.id,
    data: {
      type: 'group',
    },
    animateLayoutChanges: () => false,
  });

  const handleFocusClick = (event: MouseEvent) => {
    event.stopPropagation();

    // event.button === 2 is a right-click
    // disable selection if the user selected events and right clicks
    // so the context menu shows up
    if (selectedEvents.size > 1 && event.button === 2) {
      return;
    }

    // UI indexes are 1 based
    setSingleEntrySelection({ id: data.id });
  };

  const binderColours = data.colour && getAccessibleColour(data.colour);
  const isValidDrop = over?.id && canDrop(over.data.current?.type, over.data.current?.parent);

  const [planOffset, planOffsetLabel] = (() => {
    if (data.targetDuration === null) {
      return [null, null];
    }

    const offset = data.duration - data.targetDuration;
    if (offset === 0) {
      return [null, 'under'];
    }
    const absOffset = Math.abs(offset);
    return [
      `${offset < 0 ? '-' : '+'}${formatDuration(absOffset, absOffset > 2 * MILLIS_PER_MINUTE)}`,
      getOffsetState(offset),
    ];
  })();

  const dragStyle = {
    zIndex: isDragging ? 2 : 'inherit',
    transform: CSS.Translate.toString(transform),
    transition,
    cursor: isOver ? (isValidDrop ? 'grabbing' : 'no-drop') : 'grab',
  };

  return (
    <div
      className={cx([style.group, hasCursor && style.hasCursor, !collapsed && style.expanded])}
      ref={setNodeRef}
      onClick={handleFocusClick}
      onContextMenu={onContextMenu}
      style={{
        ...dragStyle,
        '--user-bg': data.colour || '#929292',
      }}
      data-testid='rundown-group'
    >
      <div className={style.binder} style={{ ...binderColours }} tabIndex={-1}>
        <span
          className={cx([style.drag, isDragging && style.isDragging, isDragging && !isValidDrop && style.notAllowed])}
          ref={handleRef}
          {...dragAttributes}
          {...dragListeners}
        >
          <IoReorderTwo />
        </span>
      </div>
      <div className={style.header}>
        <div className={style.titleRow}>
          <TitleEditor title={data.title} entryId={data.id} placeholder='Group title' />
          <IconButton aria-label='Collapse' variant='subtle-white' onClick={() => onCollapse(!collapsed, data.id)}>
            {collapsed ? <IoChevronUp /> : <IoChevronDown />}
          </IconButton>
        </div>
        <div className={style.metaRow}>
          <div className={style.metaEntry}>
            <div>Start</div>
            <div>{formatTime(data.timeStart)}</div>
          </div>
          <div className={style.metaEntry}>
            <div>End</div>
            <div>{formatTime(data.timeEnd)}</div>
          </div>
          <div className={style.metaEntry}>
            <div>Duration</div>
            {planOffset === null ? (
              <div className={cx([planOffsetLabel !== null && style[planOffsetLabel]])}>
                {formatDuration(data.duration)}
              </div>
            ) : (
              <div>
                <span className={style.strike}>{formatDuration(data.duration)}</span>
                <span className={cx([planOffsetLabel !== null && style[planOffsetLabel]])}>{planOffset}</span>
              </div>
            )}
          </div>
          <div className={style.metaEntry}>
            <div>Entries</div>
            <div>{data.entries.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
