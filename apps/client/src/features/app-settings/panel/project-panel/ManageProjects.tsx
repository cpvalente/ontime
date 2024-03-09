import { ChangeEvent, useRef, useState } from 'react';
import { Button, Input } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';

import { uploadProjectFile } from '../../../../common/api/db';
import { invalidateAllCaches, maybeAxiosError } from '../../../../common/api/utils';
import { validateProjectFile } from '../../../../common/utils/uploadUtils';
import * as Panel from '../PanelUtils';

import ProjectCreateForm from './ProjectCreateForm';
import ProjectList from './ProjectList';

import style from './ProjectPanel.module.scss';

export default function ManageProjects() {
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<'import' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToggleCreate = () => {
    setIsCreatingProject((prev) => !prev);
  };

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target?.files?.[0];
    if (!selectedFile) {
      return;
    }

    setLoading('import');

    try {
      validateProjectFile(selectedFile);
      await uploadProjectFile(selectedFile);
    } catch (error) {
      const errorMessage = maybeAxiosError(error);
      setError(`Error uploading file: ${errorMessage}`);
    } finally {
      invalidateAllCaches();
    }

    setLoading(null);
  };

  const handleCloseForm = () => {
    setIsCreatingProject(false);
  };

  return (
    <Panel.Section>
      <Input
        ref={fileInputRef}
        style={{ display: 'none' }}
        type='file'
        onChange={handleImport}
        accept='.json'
        data-testid='file-input'
      />
      <Panel.Card>
        <Panel.SubHeader>
          Manage projects
          <div className={style.headerButtons}>
            <Button
              variant='ontime-subtle'
              onClick={handleSelectFile}
              size='sm'
              isDisabled={Boolean(loading) || isCreatingProject}
              isLoading={loading === 'import'}
            >
              Import
            </Button>
            <Button
              variant='ontime-subtle'
              onClick={handleToggleCreate}
              size='sm'
              isDisabled={Boolean(loading) || isCreatingProject}
              rightIcon={<IoAdd />}
            >
              New
            </Button>
          </div>
        </Panel.SubHeader>
        {error && <Panel.Error>{error}</Panel.Error>}
        <Panel.Divider />
        {isCreatingProject && <ProjectCreateForm onClose={handleCloseForm} />}
        <ProjectList />
      </Panel.Card>
    </Panel.Section>
  );
}
