import { useState } from 'react';
import { IoArrowDown, IoArrowUp } from 'react-icons/io5';

import Info from '../../../../common/components/info/Info';
import { ProjectSortMode, useOrderedProjectList } from '../../../../common/hooks-query/useProjectList';
import * as Panel from '../../panel-utils/PanelUtils';
import ProjectListItem, { EditMode } from './ProjectListItem';

import style from './ProjectPanel.module.scss';

type SortParameter = 'alphabetical' | 'modified';

export default function ProjectList() {
  const [editingMode, setEditingMode] = useState<EditMode | null>(null);
  const [editingFilename, setEditingFilename] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<ProjectSortMode>('modified-desc');

  const { data, refetch, status } = useOrderedProjectList(sortMode);

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

  const handleSort = (sortParameter: SortParameter) => {
    setSortMode((current) => {
      const isAscending = current === `${sortParameter}-asc`;
      return `${sortParameter}-${isAscending ? 'desc' : 'asc'}` as ProjectSortMode;
    });
  };

  if (status === 'pending') {
    return (
      <div className={style.empty}>
        <Panel.Loader isLoading />
      </div>
    );
  }

  const numProjects = data.reorderedProjectFiles.length;

  return (
    <>
      {numProjects > 20 && (
        <Info className={style.warningInfo} type='warning'>
          You have {numProjects} projects. Consider deleting unused projects to improve performance.
        </Info>
      )}
      <Panel.Table>
        <thead>
          <tr>
            <th className={style.containCell} onClick={() => handleSort('alphabetical')}>
              <span className={style.sortableHeader}>
                File Name
                <SortIcon sortMode={sortMode} type='alphabetical' />
              </span>
            </th>
            <th onClick={() => handleSort('modified')}>
              <span className={style.sortableHeader}>
                Last Used
                <SortIcon sortMode={sortMode} type='modified' />
              </span>
            </th>
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
    </>
  );
}

function SortIcon({ sortMode, type }: { sortMode: ProjectSortMode; type: SortParameter }) {
  const prefix = `${type}-`;
  if (sortMode === `${prefix}asc`) return <IoArrowDown />;
  if (sortMode === `${prefix}desc`) return <IoArrowUp />;
  return null;
}
