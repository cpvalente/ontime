import { useProjectList } from '../../../../common/hooks-query/useProjectList';
import * as Panel from '../PanelUtils';
import ProjectListItem from './ProjectListItem';

export default function ProjectList() {
  const { data } = useProjectList();
  const { files, lastLoadedProject } = data;

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
          <ProjectListItem filename={current.filename} createdAt={current.createdAt} updatedAt={current.updatedAt} />
        )}
        {projectFiles.map((project) => (
          <ProjectListItem
            key={project.filename}
            filename={project.filename}
            createdAt={project.createdAt}
            updatedAt={project.updatedAt}
          />
        ))}
      </tbody>
    </Panel.Table>
  );
}
