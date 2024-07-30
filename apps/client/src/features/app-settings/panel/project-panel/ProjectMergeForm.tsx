import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Switch } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';

import { PROJECT_LIST } from '../../../../common/api/constants';
import { maybeAxiosError } from '../../../../common/api/utils';
import { mergeProjects } from '../../../../common/utils/mergeProjects';
import * as Panel from '../PanelUtils';

import style from './ProjectPanel.module.scss';

interface ProjectMergeFromProps {
  onClose: () => void;
  fileName: string;
}

type ProjectMergeFormValues = {
  project?: boolean;
};

export default function ProjectMergeForm(props: ProjectMergeFromProps) {
  const { onClose, fileName } = props;
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    handleSubmit,
    register,
    formState: { isSubmitting, isValid },
  } = useForm<ProjectMergeFormValues>({
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  const handleSubmitCreate = async (values: ProjectMergeFormValues) => {
    try {
      setError(null);

      await mergeProjects(fileName, values);
      await queryClient.invalidateQueries({ queryKey: PROJECT_LIST });
      onClose();
    } catch (error) {
      setError(maybeAxiosError(error));
    }
  };

  return (
    <Panel.Section as='form' onSubmit={handleSubmit(handleSubmitCreate)}>
      <Panel.Title>
        Partially load {`"${fileName}"`} into this project
        <div className={style.createActionButtons}>
          <Button onClick={onClose} variant='ontime-ghosted' size='sm' isDisabled={isSubmitting}>
            Cancel
          </Button>
          <Button isDisabled={!isValid} type='submit' isLoading={isSubmitting} variant='ontime-filled' size='sm'>
            Merge
          </Button>
        </div>
      </Panel.Title>
      {error && <Panel.Error>{error}</Panel.Error>}
      <div className={style.innerColumn}>
        <label>
          Project data
          <Switch variant='ontime' size='md' defaultChecked={false} {...register('project')} />
        </label>
      </div>
    </Panel.Section>
  );
}
