import { PropsWithChildren } from 'react';
import { IoClose } from 'react-icons/io5';
import { Button } from '@chakra-ui/react';

import style from './PanelContent.module.scss';

interface PanelContentProps {
  onClose: () => void;
}

export default function PanelContent(props: PropsWithChildren<PanelContentProps>) {
  const { onClose, children } = props;

  return (
    <div className={style.contentWrapper}>
      <div className={style.corner}>
        <Button onClick={onClose} aria-label='close' rightIcon={<IoClose />} variant='ontime-subtle'>
          Close settings
        </Button>
      </div>
      <div className={style.content}>{children}</div>
    </div>
  );
}
