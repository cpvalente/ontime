import { ChangeEvent, useRef, useState } from 'react';
import { IoAdd } from 'react-icons/io5';

import { uploadProjectFile } from '../../../../common/api/db';
import { invalidateAllCaches, maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import { validateProjectFile } from '../../../../common/utils/uploadUtils';
import * as Panel from '../../panel-utils/PanelUtils';
import useAppSettingsNavigation from '../../useAppSettingsNavigation';
import ProjectList from './ProjectList';

export default function ManageProjects() {
  const { setLocation } = useAppSettingsNavigation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<'import' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
            <Button onClick={handleSelectFile} disabled={Boolean(loading)} loading={loading === 'import'}>
              Import
            </Button>
            <Button onClick={() => setLocation('project__create')} disabled={Boolean(loading)}>
              New <IoAdd />
            </Button>
          </Panel.InlineElements>
        </Panel.SubHeader>
        {error && <Panel.Error>{error}</Panel.Error>}
        <Panel.Divider />
        <ProjectList />
      </Panel.Card>
    </Panel.Section>
  );
}
