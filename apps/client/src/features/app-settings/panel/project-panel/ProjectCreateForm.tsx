import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { IoTrash } from 'react-icons/io5';
import { Button, Input, Textarea } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';

import { PROJECT_LIST } from '../../../../common/api/constants';
import { createProject } from '../../../../common/api/db';
import { maybeAxiosError } from '../../../../common/api/utils';
import { preventEscape } from '../../../../common/utils/keyEvent';
import { documentationUrl, websiteUrl } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';

import style from './ProjectPanel.module.scss';

interface ProjectCreateFromProps {
  onClose: () => void;
}

type ProjectCreateFormValues = {
  title?: string;
  description?: string;
  backstageInfo?: string;
  backstageUrl?: string;
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
          <Button onClick={onClose} variant='ontime-ghosted' size='sm' isDisabled={isSubmitting}>
            Cancel
          </Button>
          <Button isDisabled={!isValid} type='submit' isLoading={isSubmitting} variant='ontime-filled' size='sm'>
            Create project
          </Button>
        </Panel.InlineElements>
      </Panel.Title>
      {error && <Panel.Error>{error}</Panel.Error>}
      <Panel.Section className={style.innerColumn}>
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
            placeholder={documentationUrl}
            autoComplete='off'
            {...register('backstageUrl')}
          />
        </label>
        <Panel.Section>
          <Panel.ListItem>
            <Panel.Field title='Custom data' description='Add custom data for your project' />
            <Button variant='ontime-subtle' onClick={handleAddCustom}>
              +
            </Button>
          </Panel.ListItem>
          {fields.map((field, idx) => (
            <div key={field.id} className={style.customDataItem}>
              <Panel.Paragraph>{idx + 1}.</Panel.Paragraph>
              <label>
                Title
                <Input
                  variant='ontime-filled'
                  size='sm'
                  placeholder={field.title}
                  autoComplete='off'
                  {...register(`custom.${idx}.title` as const)}
                />
              </label>
              <label>
                Value
                <Input
                  variant='ontime-filled'
                  size='sm'
                  placeholder={field.value}
                  autoComplete='off'
                  {...register(`custom.${idx}.value` as const)}
                />
              </label>
              <Button variant='ontime-ghosted' onClick={() => remove(idx)}>
                <IoTrash />
              </Button>
            </div>
          ))}
        </Panel.Section>
      </Panel.Section>
    </Panel.Section>
  );
}
