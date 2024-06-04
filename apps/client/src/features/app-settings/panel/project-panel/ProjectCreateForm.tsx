import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, Textarea } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import filenamify from 'filenamify';

import { PROJECT_LIST } from '../../../../common/api/constants';
import { createProject } from '../../../../common/api/db';
import { maybeAxiosError } from '../../../../common/api/utils';
import * as Panel from '../PanelUtils';

import style from './ProjectPanel.module.scss';

interface ProjectCreateFromProps {
  onClose: () => void;
}

type ProjectCreateFormValues = {
  title?: string;
  description?: string;
  publicInfo?: string;
  publicUrl?: string;
  backstageInfo?: string;
  backstageUrl?: string;
};

export default function ProjectCreateForm(props: ProjectCreateFromProps) {
  const { onClose } = props;

  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

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

      const maybeFileName = values.title === '' || values.title === undefined ? 'untitled' : values.title.trim();

      const filename = filenamify(`${maybeFileName}.json`, {
        replacement: '_',
      });

      await createProject({
        ...values,
        filename,
      });
      await queryClient.invalidateQueries({ queryKey: PROJECT_LIST });
      onClose();
    } catch (error) {
      setError(maybeAxiosError(error));
    }
  };

  return (
    <Panel.Section as='form' onSubmit={handleSubmit(handleSubmitCreate)}>
      <Panel.Title>
        Create new project
        <div className={style.createActionButtons}>
          <Button onClick={onClose} variant='ontime-ghosted' size='sm' isDisabled={isSubmitting}>
            Cancel
          </Button>
          <Button isDisabled={!isValid} type='submit' isLoading={isSubmitting} variant='ontime-filled' size='sm'>
            Create
          </Button>
        </div>
      </Panel.Title>
      {error && <Panel.Error>{error}</Panel.Error>}
      <div className={style.innerColumn}>
        <label>
          Project title
          <Input
            variant='ontime-filled'
            size='sm'
            maxLength={50}
            placeholder='Your project name'
            autoComplete='off'
            {...register('title')}
          />
        </label>
        <label>
          Project description
          <Input
            variant='ontime-filled'
            size='sm'
            maxLength={100}
            placeholder='Euro Love, Malmö 2024'
            autoComplete='off'
            {...register('description')}
          />
        </label>
        <label>
          Public info
          <Textarea
            variant='ontime-filled'
            size='sm'
            maxLength={150}
            placeholder='Shows always start ontime'
            autoComplete='off'
            resize='none'
            {...register('publicInfo')}
          />
        </label>
        <label>
          Public QR code Url
          <Input
            variant='ontime-filled'
            size='sm'
            placeholder='www.getontime.no'
            autoComplete='off'
            {...register('publicUrl')}
          />
        </label>
        <label>
          Backstage info
          <Textarea
            variant='ontime-filled'
            size='sm'
            maxLength={150}
            placeholder='Wi-Fi password: 1234'
            autoComplete='off'
            resize='none'
            {...register('backstageInfo')}
          />
        </label>
        <label>
          Backstage QR code Url
          <Input
            variant='ontime-filled'
            size='sm'
            placeholder='http://docs.getontime.no'
            autoComplete='off'
            {...register('backstageUrl')}
          />
        </label>
      </div>
    </Panel.Section>
  );
}
