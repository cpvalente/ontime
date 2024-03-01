import { ChangeEvent, useRef, useState } from 'react';
import { Button, Input } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';

import { invalidateAllCaches, maybeAxiosError } from '../../../../common/api/apiUtils';
import { importProjectFile } from '../../../../common/api/ontimeApi';
import { validateProjectFile } from '../../../../common/utils/uploadUtils';
import * as Panel from '../PanelUtils';

import ProjectCreateForm from './ProjectCreateForm';
import ProjectList from './ProjectList';

import style from './ProjectPanel.module.scss';

export default function ProjectPanel() {
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
      await importProjectFile(selectedFile);
    } catch (error) {
      const errorMessage = maybeAxiosError(error);
      setError(`Error uploading file: ${errorMessage}`);
    } finally {
      invalidateAllCaches();
    }

    setLoading(null);
  };

  return (
    <>
      <Panel.Header>Project</Panel.Header>
      <Input
        ref={fileInputRef}
        style={{ display: 'none' }}
        type='file'
        onChange={handleImport}
        accept='.json'
        data-testid='file-input'
      />
      <Panel.Section>
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
                Add
              </Button>
            </div>
          </Panel.SubHeader>
          {error && <Panel.Error>{error}</Panel.Error>}
          {isCreatingProject && <ProjectCreateForm onClose={() => setIsCreatingProject(false)} />}
          <ProjectList />
        </Panel.Card>
      </Panel.Section>
    </>
  );
}
