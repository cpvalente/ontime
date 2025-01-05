import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';

import { PROJECT_DATA } from '../../../../common/api/constants';
import { getDb, patchData } from '../../../../common/api/db';
import { maybeAxiosError } from '../../../../common/api/utils';
import { cx } from '../../../../common/utils/styleUtils';
import { Button } from '../../../../components/ui/button';
import { Switch } from '../../../../components/ui/switch';
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
  osc: boolean;
  http: boolean;
};

export default function ProjectMergeForm(props: ProjectMergeFromProps) {
  const { onClose, fileName } = props;
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    handleSubmit,
    control,
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
        <div className={style.createActionButtons}>
          <Button onClick={onClose} variant='ontime-ghosted' size='sm' disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            disabled={!isValid || !isDirty}
            type='submit'
            loading={isSubmitting}
            variant='ontime-filled'
            size='sm'
          >
            Merge
          </Button>
        </div>
      </Panel.Title>
      {error && <Panel.Error>{error}</Panel.Error>}
      <Panel.Section className={cx([style.innerColumn, style.inlineLabels])}>
        <Panel.Description>
          Select partial data from {`"${fileName}"`} to merge into the current project.
          <br /> This process is irreversible.
        </Panel.Description>
        <Controller
          name='project'
          control={control}
          render={({ field }) => (
            <label>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
              Project data
            </label>
          )}
        />
        <Controller
          name='rundown'
          control={control}
          render={({ field }) => (
            <label>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
              Rundown + Custom Fields
            </label>
          )}
        />
        <Controller
          name='viewSettings'
          control={control}
          render={({ field }) => (
            <label>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
              View Settings
            </label>
          )}
        />
        <Controller
          name='urlPresets'
          control={control}
          render={({ field }) => (
            <label>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
              URL Presets
            </label>
          )}
        />
        <Controller
          name='osc'
          control={control}
          render={({ field }) => (
            <label>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
              OSC Integration
            </label>
          )}
        />
        <Controller
          name='http'
          control={control}
          render={({ field }) => (
            <label>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
              HTTP Integration
            </label>
          )}
        />
      </Panel.Section>
    </Panel.Section>
  );
}
