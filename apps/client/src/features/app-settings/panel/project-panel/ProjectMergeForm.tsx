import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { PROJECT_DATA } from '../../../../common/api/constants';
import { getDb, patchData } from '../../../../common/api/db';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Info from '../../../../common/components/info/Info';
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
  rundowns: boolean;
  viewSettings: boolean;
  urlPresets: boolean;
  automation: boolean;
};

export default function ProjectMergeForm({ onClose, fileName }: ProjectMergeFromProps) {
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
      rundowns: false,
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
      if (!data.settings.version.startsWith('4.')) {
        setError('The project you are attempting to merge is from an older version and it need to be migrated first');
        return;
      }
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
        Partial project merge
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
          Select data from <i>{`"${fileName}"`}</i> to merge into the current project.
        </Panel.Description>
        <Info type='warning'>
          This process is irreversible and can result in data loss. <br />
          You may want to create a duplicate backup beforehand.
        </Info>
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
            checked={watch('rundowns')}
            onCheckedChange={(value: boolean) => setValue('rundowns', value, { shouldDirty: true })}
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
