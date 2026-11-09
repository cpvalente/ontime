import { useState } from 'react';
import { IoAdd } from 'react-icons/io5';

import Button from '../../../../common/components/buttons/Button';
import { useProjectImport } from '../../../../common/hooks/useProjectImport';
import * as Panel from '../../panel-utils/PanelUtils';
import useAppSettingsNavigation from '../../useAppSettingsNavigation';
import ProjectList from './ProjectList';

export default function ManageProjects() {
  const { setLocation } = useAppSettingsNavigation();
  const [error, setError] = useState('');
  const { inputProps, selectFile, isImporting } = useProjectImport({ onError: setError });

  const handleImport = () => {
    setError('');
    selectFile();
  };

  return (
    <Panel.Section>
      <input {...inputProps} />
      <Panel.Card>
        <Panel.SubHeader>
          Manage projects
          <Panel.InlineElements>
            <Button onClick={handleImport} disabled={isImporting} loading={isImporting}>
              Import
            </Button>
            <Button onClick={() => setLocation('project__create')} disabled={isImporting}>
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
