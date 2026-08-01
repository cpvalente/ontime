import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { PROJECT_DATA } from '../../../../common/api/constants';
import { getDb, patchData } from '../../../../common/api/db';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Info from '../../../../common/components/info/Info';
import Modal from '../../../../common/components/modal/Modal';
import Switch from '../../../../common/components/switch/Switch';
import * as Panel from '../../panel-utils/PanelUtils';
import { makeProjectPatch } from './project.utils';

import style from './ProjectPanel.module.scss';

const formId = 'project-merge-form';

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
    <Modal
      isOpen
      onClose={onClose}
      showBackdrop
      showCloseButton
      size='compact'
      title='Partial project merge'
      bodyElements={
        <form id={formId} onSubmit={handleSubmit(handleSubmitCreate)}>
          <Panel.Section className={style.mergeBody}>
            <div className={style.mergeIntro}>
              <Panel.Description>
                Select the sections from <span className={style.sourceFile}>{`"${fileName}"`}</span> that you want to
                merge into the current project.
              </Panel.Description>
              <div className={style.mergeSummary}>
                Only the enabled sections are copied. Existing data stays intact.
              </div>
            </div>

            <Info type='warning' className={style.mergeWarningInfo}>
              <Info.Title>Back up before merging</Info.Title>
              <Info.Body>
                This action can overwrite project data. Create a duplicate project first if you want a recovery point.
              </Info.Body>
            </Info>

            <Panel.ListGroup className={style.optionList}>
              <Panel.ListItem>
                <label className={style.optionRow}>
                  <div className={style.optionCopy}>
                    <span className={style.optionTitle}>Project data</span>
                    <span className={style.optionBody}>Core project metadata and settings.</span>
                  </div>
                  <Switch
                    size='large'
                    checked={watch('project')}
                    onCheckedChange={(value: boolean) => setValue('project', value, { shouldDirty: true })}
                  />
                </label>
              </Panel.ListItem>
              <Panel.ListItem>
                <label className={style.optionRow}>
                  <div className={style.optionCopy}>
                    <span className={style.optionTitle}>Rundown + Custom Fields</span>
                    <span className={style.optionBody}>Copies all rundowns and any associated custom fields.</span>
                  </div>
                  <Switch
                    size='large'
                    checked={watch('rundowns')}
                    onCheckedChange={(value: boolean) => setValue('rundowns', value, { shouldDirty: true })}
                  />
                </label>
              </Panel.ListItem>
              <Panel.ListItem>
                <label className={style.optionRow}>
                  <div className={style.optionCopy}>
                    <span className={style.optionTitle}>View Settings</span>
                    <span className={style.optionBody}>View configuration, and display preferences.</span>
                  </div>
                  <Switch
                    size='large'
                    checked={watch('viewSettings')}
                    onCheckedChange={(value: boolean) => setValue('viewSettings', value, { shouldDirty: true })}
                  />
                </label>
              </Panel.ListItem>
              <Panel.ListItem>
                <label className={style.optionRow}>
                  <div className={style.optionCopy}>
                    <span className={style.optionTitle}>URL Presets</span>
                    <span className={style.optionBody}>Saved links and preset launch parameters.</span>
                  </div>
                  <Switch
                    size='large'
                    checked={watch('urlPresets')}
                    onCheckedChange={(value: boolean) => setValue('urlPresets', value, { shouldDirty: true })}
                  />
                </label>
              </Panel.ListItem>
              <Panel.ListItem>
                <label className={style.optionRow}>
                  <div className={style.optionCopy}>
                    <span className={style.optionTitle}>Automation Settings</span>
                    <span className={style.optionBody}>Triggers and automation configuration.</span>
                  </div>
                  <Switch
                    size='large'
                    checked={watch('automation')}
                    onCheckedChange={(value: boolean) => setValue('automation', value, { shouldDirty: true })}
                  />
                </label>
              </Panel.ListItem>
            </Panel.ListGroup>
          </Panel.Section>
        </form>
      }
      footerElements={
        <div className={style.footerContent}>
          {error && <Panel.Error>{error}</Panel.Error>}
          <div className={style.footerActions}>
            <Button onClick={onClose} variant='ghosted' disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type='submit'
              form={formId}
              disabled={!isValid || !isDirty}
              loading={isSubmitting}
              variant='primary'
            >
              Merge
            </Button>
          </div>
        </div>
      }
    />
  );
}
