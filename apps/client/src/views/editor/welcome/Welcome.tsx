import { IoClose } from 'react-icons/io5';
import { useNavigate } from 'react-router';

import { loadDemo, loadProject } from '../../../common/api/db';
import { postShowWelcomeDialog } from '../../../common/api/settings';
import { invalidateAllCaches } from '../../../common/api/utils';
import Button from '../../../common/components/buttons/Button';
import IconButton from '../../../common/components/buttons/IconButton';
import Checkbox from '../../../common/components/checkbox/Checkbox';
import * as Editor from '../../../common/components/editor-utils/EditorUtils';
import ExternalLink from '../../../common/components/link/external-link/ExternalLink';
import Modal from '../../../common/components/modal/Modal';
import { appVersion, discordUrl, documentationUrl, websiteUrl } from '../../../externals';

import ImportProjectButton from './composite/ImportProjectButton';
import WelcomeProjectList from './composite/WelcomeProjectList';

import style from './Welcome.module.scss';

interface WelcomeProps {
  onClose: () => void;
}

export default function Welcome({ onClose }: WelcomeProps) {
  const navigate = useNavigate();

  /** handle loading a selected project */
  const handleLoadProject = async (filename: string) => {
    try {
      await loadProject(filename);
      await invalidateAllCaches();
      onClose();
    } catch (_error) {
      /** no error handling for now */
    }
  };

  /** handle loading the demo project */
  const handleLoadDemo = async () => {
    try {
      await loadDemo();
      await invalidateAllCaches();
      onClose();
    } catch (_error) {
      /** no error handling for now */
    }
  };

  /** handle redirect to create modal */
  const handleCallCreate = () => {
    navigate('/editor?settings=project__create');
    onClose();
  };

  return (
    <Modal
      isOpen
      onClose={() => onClose()}
      showBackdrop
      bodyElements={
        <div className={style.sections}>
          <div className={style.about}>
            <img src='ontime-logo.png' alt='ontime' className={style.logo} />
            <div>Ontime v{appVersion}</div>
            <ExternalLink href={websiteUrl}>Website</ExternalLink>
            <ExternalLink href={documentationUrl}>Read the docs</ExternalLink>
            <ExternalLink href={discordUrl}>Discord server</ExternalLink>
          </div>
          <div className={style.column}>
            <div className={style.header}>
              Welcome to Ontime
              <IconButton aria-label='close welcome modal' variant='subtle-white' onClick={() => onClose()}>
                <IoClose />
              </IconButton>
            </div>
            <Editor.Title>Select project</Editor.Title>
            <div className={style.tableContainer}>
              <table className={style.table}>
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Last Used</th>
                  </tr>
                </thead>
                <WelcomeProjectList loadProject={handleLoadProject} onClose={() => onClose()} />
              </table>
            </div>
          </div>
        </div>
      }
      footerElements={
        <div className={style.column}>
          <div className={style.buttonRow}>
            <Button onClick={handleLoadDemo}>Load demo project</Button>
            <ImportProjectButton onFinish={() => onClose()} />
            <Button variant='primary' onClick={handleCallCreate}>
              Create new...
            </Button>
          </div>
          <Editor.Label className={style.inline}>
            <Checkbox defaultChecked onCheckedChange={(checked) => postShowWelcomeDialog(checked)} />
            Show this modal on next startup
          </Editor.Label>
        </div>
      }
    />
  );
}
