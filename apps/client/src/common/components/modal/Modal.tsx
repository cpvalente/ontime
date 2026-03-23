import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import type { ReactNode } from 'react';
import { IoClose } from 'react-icons/io5';

import { cx } from '../../utils/styleUtils';
import IconButton from '../buttons/IconButton';

import style from './Modal.module.scss';

interface ModalProps {
  isOpen: boolean;
  title?: string;
  showCloseButton?: boolean;
  showBackdrop?: boolean;
  size?: 'default' | 'wide';
  bodyElements: ReactNode;
  footerElements?: ReactNode;
  onClose: () => void;
}

export default function Modal({
  isOpen,
  title,
  showCloseButton,
  showBackdrop,
  size = 'default',
  bodyElements,
  footerElements,
  onClose,
}: ModalProps) {
  return (
    <BaseDialog.Root
      open={isOpen}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      disablePointerDismissal
    >
      <BaseDialog.Portal>
        {showBackdrop && <BaseDialog.Backdrop className={style.backdrop} />}
        <BaseDialog.Popup aria-label={title} className={cx([style.modal, size === 'wide' && style.wide])}>
          <div className={style.title}>
            {title ? <BaseDialog.Title className={style.titleText}>{title}</BaseDialog.Title> : <div />}
            {showCloseButton && (
              <IconButton variant='subtle-white' onClick={onClose}>
                <IoClose />
              </IconButton>
            )}
          </div>
          <div className={style.body}>{bodyElements}</div>
          {footerElements ? <div className={style.footer}>{footerElements}</div> : null}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
