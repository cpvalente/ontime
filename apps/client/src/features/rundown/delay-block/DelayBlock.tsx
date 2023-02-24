import { useCallback, useEffect, useRef } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Button, HStack } from '@chakra-ui/react';
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
  data: OntimeDelay;
  index: number;
  hasCursor: boolean;
  actionHandler: (action: EventItemActions, payload?: number | { field: keyof OntimeEvent; value: unknown }) => void;
}

export default function DelayBlock(props: DelayBlockProps) {
  const { data, index, hasCursor, actionHandler } = props;
  const { applyDelay, updateEvent } = useEventAction();
  const onFocusRef = useRef<null | HTMLSpanElement>(null);

  useEffect(() => {
    if (hasCursor) {
      onFocusRef?.current?.focus();
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
    <Draggable key={data.id} draggableId={data.id} index={index}>
      {(provided) => (
        <div className={blockClasses} {...provided.draggableProps} ref={provided.innerRef}>
          <span className={style.drag} {...provided.dragHandleProps} ref={onFocusRef}>
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
      )}
    </Draggable>
  );
}
