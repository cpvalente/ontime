import { IconButton } from '@chakra-ui/react';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';

import { AppMode, useAppMode } from '../../../common/stores/appModeStore';

interface BlockDeleteProps {
  onDelete: () => void;
}

export default function BlockDelete(props: BlockDeleteProps) {
  const { onDelete } = props;
  const mode = useAppMode((state) => state.mode);

  const isRunMode = mode === AppMode.Run;

  return (
    <IconButton
      aria-label='Delete'
      size='sm'
      icon={<IoTrash />}
      variant='ontime-subtle'
      color='#FA5656'
      onClick={onDelete}
      isDisabled={isRunMode}
    />
  );
}
