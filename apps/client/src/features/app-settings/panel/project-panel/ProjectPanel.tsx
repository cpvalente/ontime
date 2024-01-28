import { useState } from 'react';
import { Button } from '@chakra-ui/react';
import { maybeAxiosError } from 'common/api/apiUtils';

import { PROJECT_LIST } from '../../../../common/api/apiConstants';
import { createProject } from '../../../../common/api/ontimeApi';
import { ontimeQueryClient } from '../../../../common/queryClient';
import * as Panel from '../PanelUtils';

import ProjectForm, { ProjectFormValues } from './ProjectForm';
import ProjectList from './ProjectList';

import style from './ProjectPanel.module.scss';

export default function ProjectPanel() {
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleToggleCreate = () => {
    setIsCreatingProject((prev) => !prev);
    setSubmitError(null);
  };

  const handleSubmitCreate = async (values: ProjectFormValues) => {
    try {
      setSubmitError(null);

      if (!values.filename) {
        setSubmitError('Filename cannot be blank');
        return;
      }
      await createProject(values.filename);
      await ontimeQueryClient.invalidateQueries({ queryKey: PROJECT_LIST });
      handleToggleCreate();
    } catch (error) {
      maybeAxiosError(error);
    }
  };

  return (
    <>
      <Panel.Header>Project</Panel.Header>
      <Panel.Section>
        <Panel.Card>
          <Panel.SubHeader>
            {!isCreatingProject ? (
              <>
                Manage projects
                <Button variant='ontime-filled' onClick={handleToggleCreate}>
                  New
                </Button>
              </>
            ) : (
              <span>Create new project</span>
            )}
          </Panel.SubHeader>
          {isCreatingProject ? (
            <div className={style.createContainer}>
              <ProjectForm
                action='create'
                filename=''
                onSubmit={handleSubmitCreate}
                onCancel={handleToggleCreate}
                submitError=''
              />
              {submitError && <span className={style.createSubmitError}>{submitError}</span>}
            </div>
          ) : null}
          {!isCreatingProject && <ProjectList />}
        </Panel.Card>
      </Panel.Section>
    </>
  );
}
