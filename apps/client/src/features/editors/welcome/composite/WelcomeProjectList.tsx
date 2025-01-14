import { Button } from '../../../../common/components/ui/button';
import { useOrderedProjectList } from '../../../../common/hooks-query/useProjectList';

import style from '../Welcome.module.scss';

interface WelcomeProjectListProps {
  loadProject: (filename: string) => Promise<void>;
  onClose: () => void;
}

export default function WelcomeProjectList(props: WelcomeProjectListProps) {
  const { loadProject, onClose } = props;
  const { data } = useOrderedProjectList();

  return (
    <tbody>
      {data.reorderedProjectFiles.map((project) => {
        if (project.filename === data.lastLoadedProject) {
          return (
            <tr className={style.current} key={project.filename}>
              <td>{project.filename}</td>
              <td>Loaded from last session</td>
              <td>
                <Button variant='ontime-subtle' size='2xs' onClick={onClose}>
                  Continue
                </Button>
              </td>
            </tr>
          );
        }
        return (
          <tr key={project.filename}>
            <td>{project.filename}</td>
            <td>{new Date(project.updatedAt).toLocaleString()}</td>
            <td>
              <Button variant='ontime-subtle' size='2xs' onClick={() => loadProject(project.filename)}>
                Load
              </Button>
            </td>
          </tr>
        );
      })}
    </tbody>
  );
}
