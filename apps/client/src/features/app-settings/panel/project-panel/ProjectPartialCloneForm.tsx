import type { TemplateSection } from 'ontime-types';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { partialDuplicateProject } from '../../../../common/api/db';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Info from '../../../../common/components/info/Info';
import Input from '../../../../common/components/input/input/Input';
import Modal from '../../../../common/components/modal/Modal';
import Switch from '../../../../common/components/switch/Switch';
import { removeFileExtension } from '../../../../common/utils/uploadUtils';
import * as Panel from '../../panel-utils/PanelUtils';

import style from './ProjectPanel.module.scss';

const formId = 'project-partial-clone-form';

type CloneFormValues = Record<TemplateSection, boolean> & { filename: string };

const sectionCopy: Array<{ key: TemplateSection; title: string; body: string }> = [
  { key: 'project', title: 'Project data', body: 'Core project metadata and settings.' },
  { key: 'rundowns', title: 'Rundown + Custom Fields', body: 'All rundowns and any associated custom fields.' },
  { key: 'customFields', title: 'Custom Fields', body: 'Custom field definitions on their own.' },
  { key: 'viewSettings', title: 'View Settings', body: 'View configuration, and display preferences.' },
  { key: 'urlPresets', title: 'URL Presets', body: 'Saved links and preset launch parameters.' },
  { key: 'automation', title: 'Automation Settings', body: 'Automations and the triggers that run them.' },
];

interface ProjectPartialCloneFormProps {
  onClose: () => void;
  onCreated: () => Promise<void>;
  fileName: string;
  /** sections switched on when the form opens */
  preselected?: TemplateSection[];
}

/**
 * Creates a template: a new project file holding only the selected sections of this one.
 * The inverse of the partial load in ProjectMergeForm, and the pair of them is what lets a
 * user share, say, a set of automations without handing over an entire show.
 */
export default function ProjectPartialCloneForm({
  onClose,
  onCreated,
  fileName,
  preselected,
}: ProjectPartialCloneFormProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    handleSubmit,
    register,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<CloneFormValues>({
    defaultValues: {
      filename: `${removeFileExtension(fileName)} template`,
      project: preselected?.includes('project') ?? false,
      rundowns: preselected?.includes('rundowns') ?? false,
      customFields: preselected?.includes('customFields') ?? false,
      viewSettings: preselected?.includes('viewSettings') ?? false,
      urlPresets: preselected?.includes('urlPresets') ?? false,
      automation: preselected?.includes('automation') ?? false,
    },
  });

  const handleCreate = async (values: CloneFormValues) => {
    const sections = sectionCopy.map(({ key }) => key).filter((key) => values[key]);

    if (sections.length === 0) {
      setError('At least one section must be selected');
      return;
    }

    try {
      setError(null);
      await partialDuplicateProject(fileName, values.filename, sections);
      await onCreated();
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
      title='Save as template'
      bodyElements={
        <form id={formId} onSubmit={handleSubmit(handleCreate)}>
          <Panel.Section className={style.mergeBody}>
            <div className={style.mergeIntro}>
              <Panel.Description>
                Create a new project containing only the selected parts of{' '}
                <span className={style.sourceFile}>{`"${fileName}"`}</span>. Use it as a starting point for new shows,
                or share it with someone who needs the same setup.
              </Panel.Description>
              <div className={style.mergeSummary}>
                The current project is not changed and stays loaded. Apply a template to another project with Partial
                Load.
              </div>
            </div>

            <label>
              Template name
              <Input
                {...register('filename', { required: { value: true, message: 'Required field' } })}
                fluid
                placeholder='Automations template'
              />
              <Panel.Error>{errors.filename?.message}</Panel.Error>
            </label>

            <Panel.ListGroup className={style.optionList}>
              {sectionCopy.map(({ key, title, body }) => (
                <Panel.ListItem key={key}>
                  <label className={style.optionRow}>
                    <div className={style.optionCopy}>
                      <span className={style.optionTitle}>{title}</span>
                      <span className={style.optionBody}>{body}</span>
                    </div>
                    <Switch
                      size='large'
                      checked={watch(key)}
                      onCheckedChange={(value: boolean) => setValue(key, value, { shouldDirty: true })}
                    />
                  </label>
                </Panel.ListItem>
              ))}
            </Panel.ListGroup>

            <Info>
              <Info.Body>
                Automations attached to individual events live in the rundown. A template without rundowns carries the
                automations themselves, but not the events that point at them.
              </Info.Body>
            </Info>
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
            <Button type='submit' form={formId} loading={isSubmitting} variant='primary'>
              Create template
            </Button>
          </div>
        </div>
      }
    />
  );
}
