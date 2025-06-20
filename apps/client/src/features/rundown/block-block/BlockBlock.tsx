import { useRef } from 'react';
import { IoChevronDown, IoChevronUp, IoEllipsisHorizontal, IoReorderTwo } from 'react-icons/io5';
import { IconButton, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EntryId, OntimeBlock } from 'ontime-types';

import { useEntryActions } from '../../../common/hooks/useEntryAction';
import { cx, getAccessibleColour } from '../../../common/utils/styleUtils';
import { formatDuration, formatTime } from '../../../common/utils/time';
import EditableBlockTitle from '../common/EditableBlockTitle';
import { canDrop } from '../rundown.utils';

import style from './BlockBlock.module.scss';

interface BlockBlockProps {
  data: OntimeBlock;
  hasCursor: boolean;
  collapsed: boolean;
  onCollapse: (collapsed: boolean, groupId: EntryId) => void;
}

export default function BlockBlock(props: BlockBlockProps) {
  const { data, hasCursor, collapsed, onCollapse } = props;
  const handleRef = useRef<null | HTMLSpanElement>(null);
  const { dissolveBlock } = useEntryActions();

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
      style={{
        ...(binderColours ? { '--user-bg': binderColours.backgroundColor } : {}),
        ...dragStyle,
      }}
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
          <EditableBlockTitle title={data.title} eventId={data.id} placeholder='Block title' />
          <Menu variant='ontime-on-dark' size='sm'>
            <MenuButton
              as={IconButton}
              aria-label='Options'
              icon={<IoEllipsisHorizontal />}
              color='#e2e2e2' // $gray-200
              variant='ontime-ghosted'
              size='sm'
            />
            <MenuList>
              <MenuItem onClick={() => dissolveBlock(data.id)}>Dissolve Block</MenuItem>
            </MenuList>
          </Menu>
          <IconButton
            aria-label='Dissolve'
            onClick={() => onCollapse(!collapsed, data.id)}
            color='#e2e2e2' // $gray-200
            variant='ontime-ghosted'
            size='sm'
          >
            {collapsed ? <IoChevronUp /> : <IoChevronDown />}
          </IconButton>
        </div>
        <div className={style.metaRow}>
          <div className={style.metaEntry}>
            <div>Start</div>
            <div>{formatTime(data.startTime)}</div>
          </div>
          <div className={style.metaEntry}>
            <div>End</div>
            <div>{formatTime(data.endTime)}</div>
          </div>
          <div className={style.metaEntry}>
            <div>Duration</div>
            <div>{formatDuration(data.duration)}</div>
          </div>
          <div className={style.metaEntry}>
            <div>Events</div>
            <div>{data.numEvents}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
