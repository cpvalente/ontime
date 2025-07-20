import { ChangeEvent, useRef, useState } from 'react';
import { IoAdd } from 'react-icons/io5';
import { useSearchParams } from 'react-router';

import { uploadProjectFile } from '../../../../common/api/db';
import { invalidateAllCaches, maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import { validateProjectFile } from '../../../../common/utils/uploadUtils';
import * as Panel from '../../panel-utils/PanelUtils';

import ProjectCreateForm from './ProjectCreateForm';
import ProjectList from './ProjectList';

export default function ManageProjects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<'import' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCreatingProject = searchParams.get('new') === 'true';

  const handleToggleCreate = () => {
    searchParams.set('new', isCreatingProject ? 'false' : 'true');
    setSearchParams(searchParams);
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
      await invalidateAllCaches();
    }

    setLoading(null);
  };

  const handleCloseForm = () => {
    searchParams.delete('new');
    setSearchParams(searchParams);
  };

  return (
    <Panel.Section>
      <input
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
          <Panel.InlineElements>
            <Button
              onClick={handleSelectFile}
              disabled={Boolean(loading) || isCreatingProject}
              loading={loading === 'import'}
            >
              Import
            </Button>
            <Button onClick={handleToggleCreate} disabled={Boolean(loading) || isCreatingProject}>
              New <IoAdd />
            </Button>
          </Panel.InlineElements>
        </Panel.SubHeader>
        {error && <Panel.Error>{error}</Panel.Error>}
        <Panel.Divider />
        {isCreatingProject && <ProjectCreateForm onClose={handleCloseForm} />}
        <ProjectList />
      </Panel.Card>
    </Panel.Section>
  );
}
