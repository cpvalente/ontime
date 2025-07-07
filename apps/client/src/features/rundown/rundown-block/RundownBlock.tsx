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
import { EntryId, OntimeBlock } from 'ontime-types';

import IconButton from '../../../common/components/buttons/IconButton';
import { useContextMenu } from '../../../common/hooks/useContextMenu';
import { useEntryActions } from '../../../common/hooks/useEntryAction';
import { cx, getAccessibleColour } from '../../../common/utils/styleUtils';
import { formatDuration, formatTime } from '../../../common/utils/time';
import EditableBlockTitle from '../common/EditableBlockTitle';
import { canDrop } from '../rundown.utils';
import { useEventSelection } from '../useEventSelection';

import style from './RundownBlock.module.scss';

interface RundownBlockProps {
  data: OntimeBlock;
  hasCursor: boolean;
  collapsed: boolean;
  onCollapse: (collapsed: boolean, groupId: EntryId) => void;
}

export default function RundownBlock({ data, hasCursor, collapsed, onCollapse }: RundownBlockProps) {
  const handleRef = useRef<null | HTMLSpanElement>(null);
  const { clone, ungroup, deleteEntry } = useEntryActions();
  const { selectedEvents, setSelectedBlock } = useEventSelection();

  const [onContextMenu] = useContextMenu<HTMLDivElement>([
    {
      label: 'Clone Group',
      icon: IoDuplicateOutline,
      onClick: () => clone(data.id),
    },
    {
      label: 'Ungroup',
      icon: IoFolderOpenOutline,
      onClick: () => ungroup(data.id),
      isDisabled: data.entries.length === 0,
    },
    {
      label: 'Delete Group',
      icon: IoTrash,
      onClick: () => deleteEntry([data.id]),
      withDivider: true,
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
      type: 'block',
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
    setSelectedBlock({ id: data.id });
  };

  const binderColours = data.colour && getAccessibleColour(data.colour);
  const isValidDrop = over?.id && canDrop(over.data.current?.type, over.data.current?.parent);

  const dragStyle = {
    zIndex: isDragging ? 2 : 'inherit',
    transform: CSS.Translate.toString(transform),
    transition,
    cursor: isOver ? (isValidDrop ? 'grabbing' : 'no-drop') : 'default',
  };

  return (
    <div
      className={cx([style.block, hasCursor && style.hasCursor, !collapsed && style.expanded])}
      ref={setNodeRef}
      onClick={handleFocusClick}
      onContextMenu={onContextMenu}
      style={{
        //  ...(binderColours ? { '--user-bg': binderColours.backgroundColor } : {}),
        ...dragStyle,
        '--user-bg': data.colour || '#929292',
      }}
      data-testid='rundown-block'
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
          <EditableBlockTitle title={data.title} eventId={data.id} placeholder='Group title' />
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
            <div>{formatDuration(data.duration)}</div>
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
