import { useMemo, useState } from 'react';

import { useProjectList } from '../../../../common/hooks-query/useProjectList';
import * as Panel from '../PanelUtils';

import ProjectListItem, { EditMode } from './ProjectListItem';

import style from './ProjectPanel.module.scss';

interface ProjectListProps {
  onMerge: (name: string) => void;
}

export default function ProjectList(props: ProjectListProps) {
  const { onMerge } = props;
  const { data, refetch } = useProjectList();
  const { files, lastLoadedProject } = data;

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

  const reorderedProjectFiles = useMemo(() => {
    if (!data.files?.length) return [];

    const currentlyLoadedIndex = files.findIndex((project) => project.filename === lastLoadedProject);
    const projectFiles = [...files];
    const current = projectFiles.splice(currentlyLoadedIndex, 1)?.[0];

    return [current, ...projectFiles];
  }, [data.files?.length, files, lastLoadedProject]);

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
        {reorderedProjectFiles.map((project) => (
          <ProjectListItem
            key={project.filename}
            filename={project.filename}
            updatedAt={project.updatedAt}
            onToggleEditMode={handleToggleEditMode}
            onSubmit={handleClear}
            onRefetch={handleRefetch}
            editingFilename={editingFilename}
            editingMode={editingMode}
            current={project.filename === lastLoadedProject}
            onMerge={onMerge}
          />
        ))}
      </tbody>
    </Panel.Table>
  );
}
