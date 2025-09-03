import { PropsWithChildren } from 'react';
import { IoClose } from 'react-icons/io5';

import Button from '../../../common/components/buttons/Button';

import style from './PanelContent.module.scss';

interface PanelContentProps {
  onClose: () => void;
}

export default function PanelContent({ onClose, children }: PropsWithChildren<PanelContentProps>) {
  return (
    <div className={style.contentWrapper}>
      <div className={style.content}>{children}</div>
      <div className={style.corner}>
        <Button size='large' onClick={onClose}>
          Close settings <IoClose />
        </Button>
      </div>
    </div>
  );
}
