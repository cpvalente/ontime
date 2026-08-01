import { useDisclosure } from '@mantine/hooks';
import { OntimeView } from 'ontime-types';
import { ReactNode } from 'react';

import Button from '../../common/components/buttons/Button';
import Modal from '../../common/components/modal/Modal';
import GenerateLinkFormExport from './GenerateLinkFormExport';

interface ShareViewModalProps {
  /** the view or preset the link will point to */
  target: { value: OntimeView | string; label: string };
  children: ReactNode;
}

/**
 * Offers a share link for a given view.
 * Sharing sits next to the view configuration so a customised view can be handed on.
 */
export default function ShareViewModal({ target, children }: ShareViewModalProps) {
  const [isOpen, handler] = useDisclosure();

  return (
    <>
      <Button variant='subtle' size='large' onClick={handler.open}>
        {children}
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={handler.close}
        title='Share link'
        size='wide'
        showBackdrop
        showCloseButton
        bodyElements={isOpen ? <GenerateLinkFormExport lockedPath={target} /> : null}
      />
    </>
  );
}
