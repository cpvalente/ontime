import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Switch, Tooltip } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';

import { PROJECT_DATA } from '../../../../common/api/constants';
import { maybeAxiosError } from '../../../../common/api/utils';
import { mergeProjects } from '../../../../common/utils/mergeProjects';
import * as Panel from '../PanelUtils';

import style from './ProjectPanel.module.scss';

interface ProjectMergeFromProps {
  onClose: () => void;
  fileName: string;
}

type ProjectMergeFormValues = {
  project: boolean;
  rundown: boolean;
  viewSettings: boolean;
  urlPresets: boolean;
  osc: boolean;
  http: boolean;
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
      await queryClient.invalidateQueries({ queryKey: PROJECT_DATA });
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
        <span className={style.toggleOption}>
          <span>Project data</span>
          <Switch variant='ontime' size='md' defaultChecked={false} {...register('project')} />
        </span>
        <span className={style.toggleOption}>
          <span>
            Rundown{' '}
            <Tooltip label='The rundown requires the correct custom fields to be preset so they can only be imported together'>
              (and Custom Filleds)
            </Tooltip>
          </span>
          <Switch variant='ontime' size='md' defaultChecked={false} {...register('rundown')} />
        </span>
        <span className={style.toggleOption}>
          <span>View Settings</span>
          <Switch variant='ontime' size='md' defaultChecked={false} {...register('viewSettings')} />
        </span>
        <span className={style.toggleOption}>
          <span>Url Presets</span>
          <Switch variant='ontime' size='md' defaultChecked={false} {...register('urlPresets')} />
        </span>
        <span className={style.toggleOption}>
          <span>OSC Integration</span>
          <Switch variant='ontime' size='md' defaultChecked={false} {...register('osc')} />
        </span>
        <span className={style.toggleOption}>
          <span>HTTP Integration</span>
          <Switch variant='ontime' size='md' defaultChecked={false} {...register('http')} />
        </span>
      </div>
    </Panel.Section>
  );
}
