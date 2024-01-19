import { useMemo, useState } from 'react';

import style from './ProjectPanel.module.scss';
import { useProjectList } from '../../../../common/hooks-query/useProjectList';
import * as Panel from '../PanelUtils';
import ProjectListItem from './ProjectListItem';

export type EditMode = 'rename' | 'duplicate' | null;

export default function ProjectList() {
  const { data } = useProjectList();
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

  const reorderedProjectFiles = useMemo(() => {
    if (!data?.files?.length) return [];

    const currentlyLoadedIndex = files.findIndex((project) => project.filename === lastLoadedProject);
    const projectFiles = [...files];
    const current = projectFiles.splice(currentlyLoadedIndex, 1)?.[0];

    return [current, ...projectFiles];
  }, [data?.files, lastLoadedProject]);

  return (
    <Panel.Section>
      <Panel.Card>
        <div className={style.divTable}>
          <div className={style.divTableHead}>
            <div className={style.divTableRow}>
              <div
                className={style.divTableHeader}
                style={{
                  flex: 4,
                }}
              >
                Project Name
              </div>
              <div
                className={style.divTableHeader}
                style={{
                  flex: 4,
                }}
              >
                Date Created
              </div>
              <div
                className={style.divTableHeader}
                style={{
                  flex: 4,
                }}
              >
                Date Modified
              </div>
              <div
                className={style.divTableHeader}
                style={{
                  flex: 1,
                }}
              ></div>
            </div>
          </div>
          <div className={style.divTableBody}>
            {reorderedProjectFiles.map((project) => (
              <ProjectListItem
                key={project.filename}
                filename={project.filename}
                createdAt={project.createdAt}
                updatedAt={project.updatedAt}
                onToggleEditMode={handleToggleEditMode}
                onSubmit={handleClear}
                editingFilename={editingFilename}
                editingMode={editingMode}
                current={project.filename === lastLoadedProject}
              />
            ))}
          </div>
        </div>
      </Panel.Card>
    </Panel.Section>
  );
}
