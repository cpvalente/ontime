import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { IoAdd, IoTrash } from 'react-icons/io5';
import { useQueryClient } from '@tanstack/react-query';

import { PROJECT_LIST } from '../../../../common/api/constants';
import { createProject } from '../../../../common/api/db';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Input from '../../../../common/components/input/input/Input';
import Textarea from '../../../../common/components/input/textarea/Textarea';
import { preventEscape } from '../../../../common/utils/keyEvent';
import { documentationUrl } from '../../../../externals';
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

export default function ProjectCreateForm(props: ProjectCreateFromProps) {
  const { onClose } = props;

  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    handleSubmit,
    register,
    control,
    formState: { isSubmitting, isValid },
    setFocus,
  } = useForm<ProjectCreateFormValues>({
    defaultValues: { title: '' },
    values: { title: '' },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'custom',
  });

  // set focus to first field
  useEffect(() => {
    setFocus('title');
  }, [setFocus]);

  const handleSubmitCreate = async (values: ProjectCreateFormValues) => {
    try {
      setError(null);

      const filename = values.title ?? 'untitled';

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

  const handleAddCustom = () => {
    append({ title: '', value: '' });
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
          <Input fluid maxLength={50} placeholder='Your project name' {...register('title')} />
        </label>
        <label>
          Project description
          <Input fluid maxLength={100} placeholder='Euro Love, Malmö 2024' {...register('description')} />
        </label>
        <label>
          Project info
          <Textarea fluid maxLength={150} placeholder='Wi-Fi password: 1234' resize='vertical' {...register('info')} />
        </label>
        <label>
          Project QR code URL
          <Input fluid placeholder={documentationUrl} {...register('url')} />
        </label>
        <Panel.Section>
          <Panel.ListItem>
            <Panel.Field title='Custom data' description='Add custom data for your project' />
            <Button onClick={handleAddCustom}>
              Add <IoAdd />
            </Button>
          </Panel.ListItem>
          {fields.map((field, idx) => (
            <div key={field.id} className={style.customDataItem}>
              <Panel.Paragraph>{idx + 1}.</Panel.Paragraph>
              <label>
                Title
                <Input placeholder={field.title} {...register(`custom.${idx}.title` as const)} />
              </label>
              <label>
                Value
                <Input placeholder={field.value} autoComplete='off' {...register(`custom.${idx}.value` as const)} />
              </label>
              <Button variant='ghosted' onClick={() => remove(idx)}>
                <IoTrash />
              </Button>
            </div>
          ))}
        </Panel.Section>
      </Panel.Section>
    </Panel.Section>
  );
}
