import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';

import { PROJECT_DATA } from '../../../../common/api/constants';
import { getDb, patchData } from '../../../../common/api/db';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Switch from '../../../../common/components/switch/Switch';
import { cx } from '../../../../common/utils/styleUtils';
import * as Panel from '../../panel-utils/PanelUtils';

import { makeProjectPatch } from './project.utils';

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
  automation: boolean;
};

export default function ProjectMergeForm({ onClose, fileName }: ProjectMergeFromProps) {
  'no memo'; // RHF and react-compiler don't seem to get along
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting, isValid, isDirty },
  } = useForm<ProjectMergeFormValues>({
    defaultValues: {
      project: false,
      rundown: false,
      viewSettings: false,
      urlPresets: false,
      automation: false,
    },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  const handleSubmitCreate = async (values: ProjectMergeFormValues) => {
    const allFalse = Object.values(values).every((value) => !value);
    if (allFalse) {
      setError('At least one option must be selected');
      return;
    }

    try {
      setError(null);

      // make patch object
      const { data } = await getDb(fileName);
      const patch = await makeProjectPatch(data, values);

      // request patch
      await patchData(patch);
      await queryClient.invalidateQueries({ queryKey: PROJECT_DATA });
      onClose();
    } catch (error) {
      setError(maybeAxiosError(error));
    }
  };

  return (
    <Panel.Section as='form' onSubmit={handleSubmit(handleSubmitCreate)}>
      <Panel.Title>
        Merge {`"${fileName}"`}
        <Panel.InlineElements>
          <Button onClick={onClose} variant='ghosted' disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type='submit' disabled={!isValid || !isDirty} loading={isSubmitting} variant='primary'>
            Merge
          </Button>
        </Panel.InlineElements>
      </Panel.Title>
      {error && <Panel.Error>{error}</Panel.Error>}
      <Panel.Section className={cx([style.innerColumn, style.inlineLabels])}>
        <Panel.Description>
          Select partial data from {`"${fileName}"`} to merge into the current project.
          <br /> This process is irreversible.
        </Panel.Description>
        <label>
          <Switch
            size='large'
            checked={watch('project')}
            onCheckedChange={(value: boolean) => setValue('project', value, { shouldDirty: true })}
          />
          Project data
        </label>
        <label>
          <Switch
            size='large'
            checked={watch('rundown')}
            onCheckedChange={(value: boolean) => setValue('rundown', value, { shouldDirty: true })}
          />
          Rundown + Custom Fields
        </label>
        <label>
          <Switch
            size='large'
            checked={watch('viewSettings')}
            onCheckedChange={(value: boolean) => setValue('viewSettings', value, { shouldDirty: true })}
          />
          View Settings
        </label>
        <label>
          <Switch
            size='large'
            checked={watch('urlPresets')}
            onCheckedChange={(value: boolean) => setValue('urlPresets', value, { shouldDirty: true })}
          />
          URL Presets
        </label>
        <label>
          <Switch
            size='large'
            checked={watch('automation')}
            onCheckedChange={(value: boolean) => setValue('automation', value, { shouldDirty: true })}
          />
          Automation Settings
        </label>
      </Panel.Section>
    </Panel.Section>
  );
}
