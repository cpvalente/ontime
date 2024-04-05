import { useEffect, useRef } from 'react';
import { Button } from '@chakra-ui/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IoCheckmark } from '@react-icons/all-files/io5/IoCheckmark';
import { IoClose } from '@react-icons/all-files/io5/IoClose';
import { IoReorderTwo } from '@react-icons/all-files/io5/IoReorderTwo';
import { OntimeDelay } from 'ontime-types';

import DelayInput from '../../../common/components/input/delay-input/DelayInput';
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
    deleteEvent(data.id);
  };

  const blockClasses = cx([style.delay, hasCursor ? style.hasCursor : null]);

  return (
    <div className={blockClasses} ref={setNodeRef} style={dragStyle}>
      <span className={style.drag} ref={handleRef} {...dragAttributes} {...dragListeners}>
        <IoReorderTwo />
      </span>
      <DelayInput eventId={data.id} duration={data.duration} />
      <div className={style.actionButtons}>
        <Button onClick={applyDelayHandler} size='sm' leftIcon={<IoCheckmark />} variant='ontime-subtle-white'>
          Apply
        </Button>
        <Button onClick={cancelDelayHandler} size='sm' leftIcon={<IoClose />} variant='ontime-subtle-white'>
          Cancel
        </Button>
      </div>
    </div>
  );
}
