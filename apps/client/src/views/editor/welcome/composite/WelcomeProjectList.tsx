import { ProjectFileList } from 'ontime-types';

import { cx } from '../../../../common/utils/styleUtils';

import style from '../Welcome.module.scss';

interface WelcomeProjectListProps {
  projects: ProjectFileList;
  loadedProject: string;
  status: 'pending' | 'error' | 'success';
  isBusy: boolean;
  loadingProject?: string;
  loadProject: (filename: string) => void;
  onClose: () => void;
}

export default function WelcomeProjectList({
  projects,
  loadedProject,
  status,
  isBusy,
  loadingProject,
  loadProject,
  onClose,
}: WelcomeProjectListProps) {
  if (status === 'pending') {
    return <div className={style.listMessage}>Loading projects...</div>;
  }

  if (status === 'error') {
    return <div className={style.listMessage}>Could not load the project list</div>;
  }

  return (
    <div className={style.projectList} aria-busy={isBusy}>
      <div className={style.projectHeader}>
        <span>File name</span>
        <span className={style.detail}>Last modified</span>
      </div>
      {projects.map((project) => {
        const isCurrent = project.filename === loadedProject;
        const isLoadingProject = project.filename === loadingProject;
        return (
          <button
            key={project.filename}
            type='button'
            className={cx([style.project, isCurrent && style.current, isBusy && !isLoadingProject && style.inactive])}
            aria-current={isCurrent || undefined}
            // aria-disabled keeps focus on the row while a project loads, disabled would drop it
            aria-disabled={isBusy || undefined}
            onClick={isCurrent ? onClose : () => loadProject(project.filename)}
          >
            <span className={style.filename} title={project.filename}>
              {project.filename}
            </span>
            <span className={style.detail}>{getProjectDetail(project.updatedAt, isCurrent, isLoadingProject)}</span>
          </button>
        );
      })}
    </div>
  );
}

function getProjectDetail(updatedAt: string, isCurrent: boolean, isLoading: boolean): string {
  if (isLoading) return 'Loading...';
  if (isCurrent) return 'Currently loaded';
  return new Date(updatedAt).toLocaleString();
}
