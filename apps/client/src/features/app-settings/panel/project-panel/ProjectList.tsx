import { useState } from 'react';

import { useOrderedProjectList } from '../../../../common/hooks-query/useProjectList';
import * as Panel from '../../panel-utils/PanelUtils';

import ProjectListItem, { EditMode } from './ProjectListItem';

import style from './ProjectPanel.module.scss';

export default function ProjectList() {
  const { data, refetch } = useOrderedProjectList();

  const [editingMode, setEditingMode] = useState<EditMode | null>(null);
  const [editingFilename, setEditingFilename] = useState<string | null>(null);

  const handleToggleEditMode = (editMode: EditMode, filename: string | null) => {
    setEditingMode((prev) => (prev === editMode && filename === editingFilename ? null : editMode));
    setEditingFilename(filename);
  };

  const handleClear = () => {
    setEditingMode(null);
    setEditingFilename(null);
  };

  const handleRefetch = async () => {
    await refetch();
  };

  return (
    <Panel.Table>
      <thead>
        <tr>
          <th className={style.containCell}>Project Name</th>
          <th>Last Used</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {data.reorderedProjectFiles.map((project) => (
          <ProjectListItem
            key={project.filename}
            filename={project.filename}
            updatedAt={project.updatedAt}
            onToggleEditMode={handleToggleEditMode}
            onSubmit={handleClear}
            onRefetch={handleRefetch}
            editingFilename={editingFilename}
            editingMode={editingMode}
            current={project.filename === data.lastLoadedProject}
          />
        ))}
      </tbody>
    </Panel.Table>
  );
}
