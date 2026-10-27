import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { ProjectStartup } from 'ontime-types';
import { useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { useNavigate } from 'react-router';

import { loadDemo, loadProject } from '../../../common/api/db';
import { invalidateAllCaches, maybeAxiosError } from '../../../common/api/utils';
import Button from '../../../common/components/buttons/Button';
import IconButton from '../../../common/components/buttons/IconButton';
import Checkbox from '../../../common/components/checkbox/Checkbox';
import * as Editor from '../../../common/components/editor-utils/EditorUtils';
import Info from '../../../common/components/info/Info';
import ExternalLink from '../../../common/components/link/external-link/ExternalLink';
import Modal from '../../../common/components/modal/Modal';
import { useOrderedProjectList } from '../../../common/hooks-query/useProjectList';
import useShowWelcomeDialog from '../../../common/hooks-query/useShowWelcomeDialog';
import { useProjectImport } from '../../../common/hooks/useProjectImport';
import { appVersion, discordUrl, documentationUrl, isOntimeCloud, websiteUrl } from '../../../externals';
import WelcomeProjectList from './composite/WelcomeProjectList';
import { getStartupMessage, hasOwnProjects, isDemoProject } from './welcome.utils';

import style from './Welcome.module.scss';

interface WelcomeProps {
  projectStartup: ProjectStartup | null;
  onClose: () => void;
}

export default function Welcome({ projectStartup, onClose }: WelcomeProps) {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingProject, setLoadingProject] = useState<string | null>(null);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const { fileInputRef, selectFile, handleFileChange, isImporting } = useProjectImport({
    onImported: onClose,
    onError: setErrorMessage,
  });
  const { showWelcomeDialog, setShowWelcomeDialog } = useShowWelcomeDialog();
  const { data: projectList, status: projectListStatus } = useOrderedProjectList();

  const isBusy = loadingProject !== null || isLoadingDemo || isImporting;
  const { reorderedProjectFiles, lastLoadedProject } = projectList;
  // steering waits for the project list, so the actions do not change under the user
  const isListReady = projectListStatus === 'success';
  const recoveryProject = projectStartup?.reason === 'recovered-corrupt' ? projectStartup.project : null;
  const showLoadDemo = isListReady && !isDemoProject(lastLoadedProject);
  const isImportPrimary = isListReady && !hasOwnProjects(reorderedProjectFiles, recoveryProject);
  const isCreatePrimary = isListReady && !isImportPrimary;
  const startupMessage = getStartupMessage(projectStartup, Boolean(isOntimeCloud));

  /** closing while loading would hide the outcome of the load */
  const handleClose = () => {
    if (!isBusy) onClose();
  };

  /** loads a project and closes the dialog, or keeps it open with the error */
  const runLoad = async (load: () => Promise<unknown>, target: string, setLoading: (isLoading: boolean) => void) => {
    if (isBusy) return;
    setErrorMessage(null);
    setLoading(true);
    try {
      await load();
      await invalidateAllCaches();
      onClose();
    } catch (error) {
      setErrorMessage(`Could not load ${target}: ${maybeAxiosError(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadProject = (filename: string) =>
    runLoad(
      () => loadProject(filename),
      `"${filename}"`,
      (isLoading) => setLoadingProject(isLoading ? filename : null),
    );

  const handleLoadDemo = () => runLoad(loadDemo, 'the demo project', setIsLoadingDemo);

  const handleImport = () => {
    setErrorMessage(null);
    selectFile();
  };

  /** handle redirect to create modal */
  const handleCallCreate = () => {
    navigate('/editor?settings=project__create');
    onClose();
  };

  const handleShowOnStartup = async (show: boolean) => {
    setErrorMessage(null);
    try {
      await setShowWelcomeDialog(show);
    } catch (error) {
      setErrorMessage(`Could not save startup preference: ${maybeAxiosError(error)}`);
    }
  };

  return (
    <Modal
      isOpen
      onClose={handleClose}
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
              <BaseDialog.Title className={style.title}>Welcome to Ontime</BaseDialog.Title>
              <IconButton aria-label='close welcome modal' variant='subtle-white' onClick={handleClose}>
                <IoClose />
              </IconButton>
            </div>
            {startupMessage && (
              <BaseDialog.Description render={<div />}>
                <Info type={startupMessage.type}>{startupMessage.text}</Info>
              </BaseDialog.Description>
            )}
            <Editor.Title>Select project</Editor.Title>
            <WelcomeProjectList
              projects={reorderedProjectFiles}
              loadedProject={lastLoadedProject}
              status={projectListStatus}
              isBusy={isBusy}
              loadingProject={loadingProject ?? undefined}
              loadProject={handleLoadProject}
              onClose={handleClose}
            />
          </div>
        </div>
      }
      footerElements={
        <div className={style.column}>
          <div role='alert' className={style.alert}>
            {errorMessage && <Info type='error'>{errorMessage}</Info>}
          </div>
          <input
            ref={fileInputRef}
            style={{ display: 'none' }}
            type='file'
            onChange={handleFileChange}
            accept='.json'
            data-testid='file-input'
          />
          <div className={style.buttonRow}>
            {showLoadDemo && (
              <Button
                className={style.secondaryAction}
                onClick={handleLoadDemo}
                disabled={isBusy}
                loading={isLoadingDemo}
              >
                Load demo project
              </Button>
            )}
            <Button
              variant={isImportPrimary ? 'primary' : 'subtle'}
              onClick={handleImport}
              disabled={isBusy}
              loading={isImporting}
            >
              Import project
            </Button>
            <Button variant={isCreatePrimary ? 'primary' : 'subtle'} onClick={handleCallCreate} disabled={isBusy}>
              Create new...
            </Button>
          </div>
          {showWelcomeDialog !== undefined && (
            <Editor.Label className={style.inline}>
              <Checkbox checked={showWelcomeDialog} disabled={isBusy} onCheckedChange={handleShowOnStartup} />
              Show this modal on next startup
            </Editor.Label>
          )}
        </div>
      }
    />
  );
}
