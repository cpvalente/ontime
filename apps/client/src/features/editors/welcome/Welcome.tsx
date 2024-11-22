import { useNavigate } from 'react-router-dom';
import { Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalOverlay } from '@chakra-ui/react';

import { loadDemo, loadProject } from '../../../common/api/db';
import { invalidateAllCaches } from '../../../common/api/utils';
import ExternalLink from '../../../common/components/external-link/ExternalLink';
import { appVersion, discordUrl, documentationUrl, websiteUrl } from '../../../externals';

import ImportProjectButton from './composite/ImportProjectButton';
import WelcomeProjectList from './composite/WelcomeProjectList';

import style from './Welcome.module.scss';

interface WelcomeProps {
  onClose: () => void;
}

export default function Welcome(props: WelcomeProps) {
  const { onClose } = props;
  const navigate = useNavigate();

  /** handle cleanup actions before request closing the modal */
  const handleClose = () => {
    onClose();
  };

  /** handle loading a selected project */
  const handleLoadProject = async (filename: string) => {
    try {
      await loadProject(filename);
      await invalidateAllCaches();
      handleClose();
    } catch (_error) {
      /** no error handling for now */
    }
  };

  /** handle loading the demo project */
  const handleLoadDemo = async () => {
    try {
      await loadDemo();
      await invalidateAllCaches();
      handleClose();
    } catch (_error) {
      /** no error handling for now */
    }
  };

  /** handle redirect to create modal */
  const handleCallCreate = () => {
    navigate('/editor?settings=project__create');
    handleClose();
  };

  return (
    <Modal isOpen onClose={handleClose} variant='ontime'>
      <ModalOverlay />
      <ModalContent maxWidth='max(640px, 40vw)'>
        <ModalCloseButton />
        <ModalBody>
          <div className={style.sections}>
            <div className={style.column}>
              <img src='ontime-logo.png' alt='ontime' className={style.logo} />
              <div>Ontime v{appVersion}</div>
              <ExternalLink href={websiteUrl}>Website</ExternalLink>
              <ExternalLink href={documentationUrl}>Read the docs</ExternalLink>
              <ExternalLink href={discordUrl}>Discord server</ExternalLink>
            </div>
            <div className={style.column}>
              <div className={style.header}>Welcome to Ontime</div>
              <div className={style.tableContainer}>
                <table className={style.table}>
                  <thead>
                    <tr>
                      <th>Project Name</th>
                      <th>Last Used</th>
                      <th />
                    </tr>
                  </thead>
                  <WelcomeProjectList loadProject={handleLoadProject} onClose={handleClose} />
                </table>
              </div>

              <div className={style.buttonRow}>
                <ImportProjectButton onFinish={handleClose} />
                <Button size='sm' variant='ontime-subtle' onClick={handleLoadDemo}>
                  Load demo project
                </Button>
                <Button size='sm' variant='ontime-filled' onClick={handleCallCreate}>
                  Create new...
                </Button>
              </div>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
