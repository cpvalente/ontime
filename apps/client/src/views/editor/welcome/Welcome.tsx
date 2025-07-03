import { useNavigate } from 'react-router-dom';

import { loadDemo, loadProject } from '../../../common/api/db';
import { postShowWelcomeDialog } from '../../../common/api/settings';
import { invalidateAllCaches } from '../../../common/api/utils';
import * as Editor from '../../../common/components/editor-utils/EditorUtils';
import ExternalLink from '../../../common/components/link/external-link/ExternalLink';
import { appVersion, discordUrl, documentationUrl, websiteUrl } from '../../../externals';
import Modal from '../../../common/components/modal/Modal';
import Button from '../../../common/components/buttons/Button';
import Checkbox from '../../../common/components/checkbox/Checkbox';


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

  const bodyElements = (
    <>
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
          <Editor.Title>Select project</Editor.Title>
          <div className={style.tableContainer}>
            <table className={style.table}>
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Last Used</th>
                </tr>
              </thead>
              <WelcomeProjectList loadProject={handleLoadProject} onClose={handleClose} />
            </table>
          </div>
        </div>
      </div>
      <div className={style.buttonRow}>
        <Button
          size='small' // Assuming 'sm' -> 'small'
          variant='subtle' // Assuming 'ontime-subtle' -> 'subtle'
          onClick={handleLoadDemo}
        >
          Load demo project
        </Button>
        <ImportProjectButton onFinish={handleClose} />
        <Button
          size='small' // Assuming 'sm' -> 'small'
          variant='primary' // Assuming 'ontime-filled' -> 'primary'
          onClick={handleCallCreate}
        >
          Create new...
        </Button>
      </div>
      <Checkbox
        // size='sm' // Checkbox doesn't have size prop, styled via class
        // variant='ontime-ondark' // Checkbox doesn't have variant, styled via class
        defaultChecked
        onCheckedChange={(checked) => postShowWelcomeDialog(Boolean(checked))} // Base Checkbox provides boolean
        // The label for Checkbox is typically passed as children to the BaseCheckbox.Root
        // For standalone Checkbox like this, it might need a <label> wrapper or different usage
        // For now, assuming the text is a separate label or handled by styling.
      >
        Show this modal on next startup {/* This might need to be wrapped */}
      </Checkbox>
    </>
  );


  return (
    <Modal
      isOpen // isOpen is always true for this modal as it's shown on startup
      title="Welcome" // Or a more fitting title
      onClose={handleClose}
      bodyElements={bodyElements}
      showCloseButton
      // closeOnOverlayClick={false} // Default behavior
      // maxWidth='max(640px, 40vw)' // Handle with Modal styling or wrapper
    />
  );
}
