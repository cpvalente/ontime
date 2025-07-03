import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { IoCheckmarkDone, IoClose, IoReorderTwo } from 'react-icons/io5';
import { Button } from '@chakra-ui/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { OntimeDelay } from 'ontime-types';

import DelayInput from '../../../common/components/input/delay-input/DelayInput';
import { useEntryActions } from '../../../common/hooks/useEntryAction';
import { cx } from '../../../common/utils/styleUtils';

import style from './RundownDelay.module.scss';

interface RundownDelayProps {
  data: OntimeDelay;
  hasCursor: boolean;
}

function RundownDelayComponent({ data, hasCursor }: RundownDelayProps) {
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

  const dragStyle = useMemo(
    () => ({
      zIndex: isDragging ? 2 : 'inherit',
      transform: CSS.Translate.toString(transform),
      transition,
    }),
    [isDragging, transform, transition],
  );

  useEffect(() => {
    if (hasCursor) {
      handleRef?.current?.focus();
    }
  }, [hasCursor]);

  const applyDelayHandler = useCallback(() => {
    applyDelay(data.id);
  }, [applyDelay, data.id]);

  const cancelDelayHandler = useCallback(() => {
    deleteEntry([data.id]);
  }, [deleteEntry, data.id]);

  const blockClasses = cx([style.delay, hasCursor ? style.hasCursor : null]);

  return (
    <div className={blockClasses} ref={setNodeRef} style={dragStyle} data-testid='rundown-delay'>
      <span className={style.drag} ref={handleRef} {...dragAttributes} {...dragListeners}>
        <IoReorderTwo />
      </span>
      <DelayInput eventId={data.id} duration={data.duration} />
      <div className={style.actionButtons}>
        <Button onClick={applyDelayHandler} size='sm' leftIcon={<IoCheckmarkDone />} variant='ontime-ghosted-white'>
          Make permanent
        </Button>
        <Button onClick={cancelDelayHandler} size='sm' leftIcon={<IoClose />} variant='ontime-ghosted-white'>
          Cancel
        </Button>
      </div>
    </div>
  );
}
export default memo(RundownDelayComponent);
