import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from '@chakra-ui/react';

import { version } from '../../../../package.json';
import OntimeLogo from '../../../assets/images/ontime-logo.svg?react';
import { gitbookUrl, githubUrl } from '../../../externals';
import ModalLink from '../ModalLink';

import UpdateChecker from './UpdateChecker';

import styles from '../Modal.module.scss';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal(props: AboutModalProps) {
  const { isOpen, onClose } = props;

  return (
    <Modal
      size='sm'
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={false}
      motionPreset='slideInBottom'
      scrollBehavior='inside'
      preserveScrollBarGap
      variant='ontime-small'
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          About Ontime
          <ModalCloseButton />
        </ModalHeader>

        <ModalBody className={styles.body}>
          <div className={styles.twoColumn}>
            <OntimeLogo className={styles.logo} />
            <div>
              <div className={styles.padBottom}>
                <span className={styles.sectionTitle}>Ontime</span>
                Free Open Source Software for managing rundowns and event timers
                <ModalLink href='https://www.getontime.no'>www.getontime.no</ModalLink>
              </div>
              <div className={styles.padBottom}>
                <span className={styles.sectionTitle}>Current version</span>

                {`You are currently using Ontime ${version}`}
              </div>
              <div className={styles.padBottom}>
                <span className={styles.sectionTitle}>Docs</span>
                <ModalLink href={gitbookUrl}>Read the docs over at GitBook</ModalLink>
              </div>
              <div>
                <span className={styles.sectionTitle}>Github</span>
                <ModalLink href={githubUrl}>Follow the project on GitHub</ModalLink>
              </div>
              <UpdateChecker version={version} />
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
