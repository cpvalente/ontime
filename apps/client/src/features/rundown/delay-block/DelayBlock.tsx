import { useEffect, useRef } from 'react';
import { IoCheckmarkDone } from 'react-icons/io5';
import { IoClose } from 'react-icons/io5';
import { IoReorderTwo } from 'react-icons/io5';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { OntimeDelay } from 'ontime-types';

import DelayInput from '../../../common/components/input/delay-input/DelayInput';
import { Button } from '../../../common/components/ui/button';
import { useEventAction } from '../../../common/hooks/useEventAction';
import { cx } from '../../../common/utils/styleUtils';

import style from './DelayBlock.module.scss';

interface DelayBlockProps {
  data: OntimeDelay;
  hasCursor: boolean;
}

export default function DelayBlock(props: DelayBlockProps) {
  const { data, hasCursor } = props;
  const { applyDelay, deleteEvent } = useEventAction();
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

  useEffect(() => {
    if (hasCursor) {
      handleRef?.current?.focus();
    }
  }, [hasCursor]);

  const applyDelayHandler = () => {
    applyDelay(data.id);
  };

  const cancelDelayHandler = () => {
    deleteEvent([data.id]);
  };

  const blockClasses = cx([style.delay, hasCursor ? style.hasCursor : null]);

  return (
    <div className={blockClasses} ref={setNodeRef} style={dragStyle}>
      <span className={style.drag} ref={handleRef} {...dragAttributes} {...dragListeners}>
        <IoReorderTwo />
      </span>
      <DelayInput eventId={data.id} duration={data.duration} />
      <div className={style.actionButtons}>
        <Button onClick={applyDelayHandler} size='sm' variant='ontime-ghosted-white'>
          <IoCheckmarkDone /> Make permanent
        </Button>
        <Button onClick={cancelDelayHandler} size='sm' variant='ontime-ghosted-white'>
          <IoClose /> Cancel
        </Button>
      </div>
    </div>
  );
}
