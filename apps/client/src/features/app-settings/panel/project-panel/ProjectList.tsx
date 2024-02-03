import { useMemo, useState } from 'react';

import { maybeAxiosError } from '../../../../common/api/apiUtils';
import { createProject } from '../../../../common/api/ontimeApi';
import { useProjectList } from '../../../../common/hooks-query/useProjectList';
import * as Panel from '../PanelUtils';

import ProjectCreateForm, { ProjectCreateFormValues } from './ProjectCreateForm';
import ProjectListItem, { EditMode } from './ProjectListItem';

import style from './ProjectPanel.module.scss';

interface ProjectListProps {
  isCreatingProject: boolean;
  onToggleCreate: () => void;
}

export default function ProjectList({ isCreatingProject, onToggleCreate }: ProjectListProps) {
  const { data, refetch } = useProjectList();
  const { files, lastLoadedProject } = data;

  const [editingMode, setEditingMode] = useState<EditMode | null>(null);
  const [editingFilename, setEditingFilename] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleToggleCreateMode = () => {
    onToggleCreate();
    setSubmitError(null);
  };

  const handleSubmitCreate = async (values: ProjectCreateFormValues) => {
    try {
      setSubmitError(null);
      const filename = values.title.trim();
      if (!filename) {
        setSubmitError('Project name cannot be empty');
        return;
      }
      await createProject({
        ...values,
        filename,
      });
      await refetch();
      handleToggleCreateMode();
    } catch (error) {
      setSubmitError(maybeAxiosError(error));
    }
  };

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
    if (!data?.files?.length) return [];

    const currentlyLoadedIndex = files.findIndex((project) => project.filename === lastLoadedProject);
    const projectFiles = [...files];
    const current = projectFiles.splice(currentlyLoadedIndex, 1)?.[0];

    return [current, ...projectFiles];
  }, [data.files.length, files, lastLoadedProject]);

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
        {isCreatingProject ? (
          <tr className={style.createContainer}>
            <td colSpan={99}>
              <ProjectCreateForm onSubmit={handleSubmitCreate} onCancel={handleToggleCreateMode} submitError='' />
              {submitError && <span className={style.createSubmitError}>{submitError}</span>}
            </td>
          </tr>
        ) : null}
        {reorderedProjectFiles.map((project) => (
          <ProjectListItem
            key={project.filename}
            filename={project.filename}
            createdAt={project.createdAt}
            updatedAt={project.updatedAt}
            onToggleEditMode={handleToggleEditMode}
            onSubmit={handleClear}
            onRefetch={handleRefetch}
            editingFilename={editingFilename}
            editingMode={editingMode}
            current={project.filename === lastLoadedProject}
          />
        ))}
      </tbody>
    </Panel.Table>
  );
}
