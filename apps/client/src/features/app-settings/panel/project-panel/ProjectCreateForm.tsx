import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { createProject } from '../../../../common/api/db';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Input from '../../../../common/components/input/input/Input';
import { preventEscape } from '../../../../common/utils/keyEvent';
import * as Panel from '../../panel-utils/PanelUtils';

import style from './ProjectPanel.module.scss';

interface ProjectCreateFromProps {
  onClose: () => void;
}

type ProjectCreateFormValues = {
  title?: string;
  description?: string;
  info?: string;
  url?: string;
  custom?: { title: string; value: string }[];
};

export default function ProjectCreateForm({ onClose }: ProjectCreateFromProps) {
  'use no memo'; // RHF and react-compiler don't seem to get along
  const [error, setError] = useState<string | null>(null);

  const {
    handleSubmit,
    register,
    formState: { isSubmitting, isValid },
    setFocus,
  } = useForm<ProjectCreateFormValues>({
    defaultValues: { title: '' },
    values: { title: '' },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  // set focus to first field
  useEffect(() => {
    setFocus('title');
  }, [setFocus]);

  const handleSubmitCreate = async (values: ProjectCreateFormValues) => {
    try {
      setError(null);

      const filename = values.title ?? 'untitled';

      await createProject({ filename });

      onClose();
    } catch (error) {
      setError(maybeAxiosError(error));
    }
  };

  return (
    <Panel.Section
      as='form'
      onSubmit={handleSubmit(handleSubmitCreate)}
      onKeyDown={(event) => preventEscape(event, onClose)}
    >
      <Panel.Title>
        Create new project
        <Panel.InlineElements>
          <Button onClick={onClose} variant='ghosted' disabled={isSubmitting}>
            Cancel
          </Button>
          <Button disabled={!isValid} type='submit' loading={isSubmitting} variant='primary'>
            Create project
          </Button>
        </Panel.InlineElements>
      </Panel.Title>
      {error && <Panel.Error>{error}</Panel.Error>}
      <Panel.Section className={style.innerColumn}>
        <label>
          Project title
          <Input fluid placeholder='Your project name' {...register('title')} />
        </label>
      </Panel.Section>
    </Panel.Section>
  );
}
