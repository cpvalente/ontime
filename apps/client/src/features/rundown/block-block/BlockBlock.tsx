import { PropsWithChildren, useRef } from 'react';
import { IoChevronDown, IoChevronUp, IoReorderTwo } from 'react-icons/io5';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSessionStorage } from '@mantine/hooks';
import { OntimeBlock } from 'ontime-types';

import { cx, getAccessibleColour } from '../../../common/utils/styleUtils';
import { formatDuration, formatTime } from '../../../common/utils/time';
import EditableBlockTitle from '../common/EditableBlockTitle';

import style from './BlockBlock.module.scss';

interface BlockBlockProps {
  data: OntimeBlock;
  hasCursor: boolean;
}

export default function BlockBlock(props: PropsWithChildren<BlockBlockProps>) {
  const { data, hasCursor, children } = props;
  const [collapsed, setCollapsed] = useSessionStorage<boolean>({ key: `block-${data.id}`, defaultValue: false });
  const handleRef = useRef<null | HTMLSpanElement>(null);

  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: data.id,
    animateLayoutChanges: () => false,
  });

  const dragStyle = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const binderColours = data.colour && getAccessibleColour(data.colour);

  return (
    <div
      className={cx([style.block, hasCursor && style.hasCursor])}
      ref={setNodeRef}
      style={{
        ...(binderColours ? { '--user-bg': binderColours.backgroundColor } : {}),
        ...dragStyle,
      }}
    >
      <div className={style.binder} style={{ ...binderColours }} tabIndex={-1}>
        <span className={style.drag} ref={handleRef} {...dragAttributes} {...dragListeners}>
          <IoReorderTwo />
        </span>
      </div>
      <div className={style.header}>
        <div className={style.titleRow}>
          <EditableBlockTitle title={data.title} eventId={data.id} placeholder='Block title' />
          <button onClick={() => setCollapsed((prev) => !prev)}>
            {collapsed ? <IoChevronUp /> : <IoChevronDown />}
          </button>
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
      {!collapsed && (
        <div className={style.group} style={binderColours ? { '--user-bg': binderColours.backgroundColor } : {}}>
          {children}
        </div>
      )}
      <div className={style.footer} style={binderColours ? { '--user-bg': binderColours.backgroundColor } : {}} />
    </div>
  );
}
