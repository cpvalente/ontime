import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Switch } from '@chakra-ui/react';
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
    formState: { isSubmitting, isValid, isDirty },
  } = useForm<ProjectMergeFormValues>({
    defaultValues: {
      project: false,
      rundown: false,
      viewSettings: false,
      urlPresets: false,
      osc: false,
      http: false,
    },
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
        Partial load project
        <div className={style.createActionButtons}>
          <Button onClick={onClose} variant='ontime-ghosted' size='sm' isDisabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            isDisabled={!isValid || !isDirty}
            type='submit'
            isLoading={isSubmitting}
            variant='ontime-filled'
            size='sm'
          >
            Merge
          </Button>
        </div>
      </Panel.Title>
      {error && <Panel.Error>{error}</Panel.Error>}
      <div className={style.innerColumn}>
        <Panel.Description>Select data to load from {`"${fileName}"`} into the current project</Panel.Description>
        <label className={style.toggleOption}>
          <Switch variant='ontime' {...register('project')} />
          Project data
        </label>
        <label className={style.toggleOption}>
          <Switch variant='ontime' {...register('rundown')} />
          Rundown + Custom Fields
        </label>
        <label className={style.toggleOption}>
          <Switch variant='ontime' {...register('viewSettings')} />
          View Settings
        </label>
        <span className={style.toggleOption}>
          <Switch variant='ontime' {...register('urlPresets')} />
          URL Presets
        </span>
        <label className={style.toggleOption}>
          <Switch variant='ontime' {...register('osc')} />
          OSC Integration
        </label>
        <label className={style.toggleOption}>
          <Switch variant='ontime' {...register('http')} />
          HTTP Integration
        </label>
      </div>
    </Panel.Section>
  );
}
