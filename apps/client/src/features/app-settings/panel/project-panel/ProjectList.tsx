import { useState } from 'react';
import { useProjectList } from '../../../../common/hooks-query/useProjectList';
import * as Panel from '../PanelUtils';
import ProjectListItem from './ProjectListItem';

export type EditMode = 'rename' | 'duplicate' | null;

export default function ProjectList() {
  const { data } = useProjectList();
  const { files, lastLoadedProject } = data;

  const [editingMode, setEditingMode] = useState<EditMode | null>(null);
  const [editingFilename, setEditingFilename] = useState<string | null>(null);

  const handleToggleEditMode = (editMode: EditMode, filename: string) => {
    setEditingMode((prev) => (prev === editMode && filename === editingFilename ? null : editMode));
    setEditingFilename(filename);
  };

  const handleClear = () => {
    setEditingMode(null);
    setEditingFilename(null);
  };

  // extract currently loaded from file list
  const currentlyLoadedIndex = files.findIndex((project) => project.filename === lastLoadedProject);
  const projectFiles = [...files];
  const current = projectFiles.splice(currentlyLoadedIndex, 1)[0];

  return (
    <Panel.Table>
      <thead>
        <tr>
          <th>Project Name</th>
          <th>Date Created</th>
          <th>Date Modified</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {current && (
          <ProjectListItem
            filename={current.filename}
            createdAt={current.createdAt}
            updatedAt={current.updatedAt}
            onToggleEditMode={handleToggleEditMode}
            onSubmit={handleClear}
            editingFilename={editingFilename}
            editingMode={editingMode}
          />
        )}
        {projectFiles.map((project) => (
          <ProjectListItem
            key={project.filename}
            filename={project.filename}
            createdAt={project.createdAt}
            updatedAt={project.updatedAt}
            onToggleEditMode={handleToggleEditMode}
            onSubmit={handleClear}
            editingFilename={editingFilename}
            editingMode={editingMode}
          />
        ))}
      </tbody>
    </Panel.Table>
  );
}
