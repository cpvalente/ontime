import { useRef } from 'react';
import { IconButton } from '@chakra-ui/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IoReorderTwo } from '@react-icons/all-files/io5/IoReorderTwo';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';
import { OntimeBlock } from 'ontime-types';

import { AppMode, useAppMode } from '../../../common/stores/appModeStore';
import { cx } from '../../../common/utils/styleUtils';
import EditableBlockTitle from '../common/EditableBlockTitle';

import style from './BlockBlock.module.scss';

interface BlockBlockProps {
  data: OntimeBlock;
  hasCursor: boolean;
  onDelete: () => void;
}

export default function BlockBlock(props: BlockBlockProps) {
  const { data, hasCursor, onDelete } = props;

  const mode = useAppMode((state) => state.mode);
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

  const blockClasses = cx([style.block, hasCursor ? style.hasCursor : null]);
  const isRunMode = mode === AppMode.Run;

  return (
    <div className={blockClasses} ref={setNodeRef} style={dragStyle}>
      <span className={style.drag} ref={handleRef} {...dragAttributes} {...dragListeners}>
        <IoReorderTwo />
      </span>
      <EditableBlockTitle title={data.title} eventId={data.id} placeholder='Block title' />
      <IconButton
        aria-label='Delete'
        size='sm'
        icon={<IoTrash />}
        variant='ontime-subtle'
        color='#FA5656'
        onClick={onDelete}
        isDisabled={isRunMode}
      />
    </div>
  );
}
