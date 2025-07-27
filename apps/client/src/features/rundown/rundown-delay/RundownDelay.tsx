import { useEffect, useRef } from 'react';
import { IoCheckmarkDone, IoClose, IoReorderTwo } from 'react-icons/io5';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { OntimeDelay } from 'ontime-types';

import Button from '../../../common/components/buttons/Button';
import DelayInput from '../../../common/components/input/delay-input/DelayInput';
import { useEntryActions } from '../../../common/hooks/useEntryAction';
import { cx } from '../../../common/utils/styleUtils';

import style from './RundownDelay.module.scss';

interface RundownDelayProps {
  data: OntimeDelay;
  hasCursor: boolean;
}

export default function RundownDelay({ data, hasCursor }: RundownDelayProps) {
  const { applyDelay, deleteEntry } = useEntryActions();
  const handleRef = useRef<null | HTMLSpanElement>(null);

  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef,
    isDragging,
    transform,
    transition,
  } = useSortable({
    id: data.id,
    data: {
      type: 'delay',
    },
    animateLayoutChanges: () => false,
  });

  const dragStyle = {
    zIndex: isDragging ? 2 : 'inherit',
    cursor: isDragging ? 'grabbing' : 'grab',
    transform: CSS.Translate.toString(transform),
    transition,
  };

  useEffect(() => {
    if (hasCursor) {
      handleRef?.current?.focus();
    }
  }, [hasCursor]);

  const applyDelayHandler = () => {
    applyDelay(data.id);
  };

  const cancelDelayHandler = () => {
    deleteEntry([data.id]);
  };

  return (
    <div
      className={cx([style.delay, hasCursor ? style.hasCursor : null])}
      ref={setNodeRef}
      style={dragStyle}
      data-testid='rundown-delay'
    >
      <span className={style.drag} ref={handleRef} {...dragAttributes} {...dragListeners}>
        <IoReorderTwo />
      </span>
      <DelayInput eventId={data.id} duration={data.duration} />
      <Button onClick={applyDelayHandler} variant='ghosted-white'>
        <IoCheckmarkDone /> Make permanent
      </Button>
      <Button onClick={cancelDelayHandler} variant='ghosted-white'>
        <IoClose />
        Cancel
      </Button>
    </div>
  );
}
