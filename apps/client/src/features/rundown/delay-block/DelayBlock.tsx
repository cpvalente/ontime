import { useCallback, useEffect, useRef } from 'react';
import { Button, HStack } from '@chakra-ui/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IoCheckmark } from '@react-icons/all-files/io5/IoCheckmark';
import { IoReorderTwo } from '@react-icons/all-files/io5/IoReorderTwo';
import { OntimeDelay, OntimeEvent } from 'ontime-types';

import DelayInput from '../../../common/components/input/delay-input/DelayInput';
import { useEventAction } from '../../../common/hooks/useEventAction';
import { millisToMinutes } from '../../../common/utils/dateConfig';
import { cx } from '../../../common/utils/styleUtils';
import BlockActionMenu from '../event-block/composite/BlockActionMenu';
import { EventItemActions } from '../RundownEntry';

import style from './DelayBlock.module.scss';

interface DelayBlockProps {
  eventId: string;
  data: OntimeDelay;
  index: number;
  hasCursor: boolean;
  actionHandler: (action: EventItemActions, payload?: number | { field: keyof OntimeEvent; value: unknown }) => void;
}

export default function DelayBlock(props: DelayBlockProps) {
  const { eventId, data, index, hasCursor, actionHandler } = props;
  const { applyDelay, updateEvent } = useEventAction();
  const handleRef = useRef<null | HTMLSpanElement>(null);

  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    animateLayoutChanges: () => true,
    id: data.id,
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

  const applyDelayHandler = useCallback(() => {
    applyDelay(data.id);
  }, [data.id, applyDelay]);

  const delaySubmitHandler = useCallback(
    (value: number) => {
      const newEvent = {
        id: data.id,
        duration: value * 60000,
      };

      updateEvent(newEvent);
    },
    [data.id, updateEvent],
  );

  const blockClasses = cx([style.delay, hasCursor ? style.hasCursor : null]);

  const delayValue = data.duration != null ? millisToMinutes(data.duration) : undefined;

  return (
    <div className={blockClasses} ref={setNodeRef} style={dragStyle}>
      <span className={style.drag} ref={handleRef} {...dragAttributes} {...dragListeners}>
        <IoReorderTwo />
      </span>
      <DelayInput value={delayValue} submitHandler={delaySubmitHandler} />
      <HStack spacing='8px' className={style.actionOverlay}>
        <Button onClick={applyDelayHandler} size='sm' leftIcon={<IoCheckmark />} variant='ontime-subtle-white'>
          Apply delay
        </Button>
        <BlockActionMenu showAdd enableDelete actionHandler={actionHandler} />
      </HStack>
    </div>
  );
}
