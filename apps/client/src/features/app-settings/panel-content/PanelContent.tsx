import { PropsWithChildren } from 'react';
import { IconButton } from '@chakra-ui/react';
import { IoClose } from '@react-icons/all-files/io5/IoClose';

import style from './PanelContent.module.scss';

interface PanelContentProps {
  onClose: () => void;
}

export default function PanelContent(props: PropsWithChildren<PanelContentProps>) {
  const { onClose, children } = props;

  return (
    <div className={style.contentWrapper}>
      <div className={style.corner}>
        <IconButton onClick={onClose} aria-label='close' icon={<IoClose />} variant='ontime-ghosted-white' />
      </div>
      <div className={style.content}>{children}</div>
    </div>
  );
}
