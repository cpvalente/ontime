import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, Textarea } from '@chakra-ui/react';

import { maybeAxiosError } from '../../../../common/api/apiUtils';
import { createProject } from '../../../../common/api/ontimeApi';
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
      const filename = values.title?.trim();

      await createProject({
        ...values,
        filename,
      });
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
      <div className={style.createFormInputField}>
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
      </div>
      <div className={style.createFormInputField}>
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
      </div>
      <div className={style.createFormInputField}>
        <label>
          Public info
          <Textarea
            variant='ontime-filled'
            size='sm'
            maxLength={150}
            placeholder='Shows always start ontime'
            autoComplete='off'
            {...register('publicInfo')}
          />
        </label>
      </div>
      <div className={style.createFormInputField}>
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
      </div>
      <div className={style.createFormInputField}>
        <label>
          Backstage info
          <Textarea
            variant='ontime-filled'
            size='sm'
            maxLength={150}
            placeholder='Wi-Fi password: 1234'
            autoComplete='off'
            {...register('backstageInfo')}
          />
        </label>
      </div>
      <div className={style.createFormInputField}>
        <label>
          Backstage QR code Url
          <Input
            variant='ontime-filled'
            size='sm'
            placeholder='www.ontime.gitbook.io'
            autoComplete='off'
            {...register('backstageUrl')}
          />
        </label>
      </div>
    </Panel.Section>
  );
}
