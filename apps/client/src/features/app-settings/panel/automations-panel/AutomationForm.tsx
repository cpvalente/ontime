import { Automation, AutomationDTO, isHTTPOutput, isOSCOutput, isOntimeAction } from 'ontime-types';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { IoAdd, IoTrash } from 'react-icons/io5';

import { addAutomation, editAutomation, testOutput } from '../../../../common/api/automation';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import IconButton from '../../../../common/components/buttons/IconButton';
import { DropdownMenu } from '../../../../common/components/dropdown-menu/DropdownMenu';
import Info from '../../../../common/components/info/Info';
import Input from '../../../../common/components/input/input/Input';
import ExternalLink from '../../../../common/components/link/external-link/ExternalLink';
import Modal from '../../../../common/components/modal/Modal';
import RadioGroup from '../../../../common/components/radio-group/RadioGroup';
import Select from '../../../../common/components/select/Select';
import useAutomationSettings from '../../../../common/hooks-query/useAutomationSettings';
import useCustomFields from '../../../../common/hooks-query/useCustomFields';
import { isOntimeCloud } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';
import { isAutomation, makeFieldList, operators, type OutputErrors } from './automationUtils';
import HttpOutputForm from './HttpOutputForm';
import OntimeActionForm from './OntimeActionForm';
import OscOutputForm from './OscOutputForm';
import OutputCard, { type TestState } from './OutputCard';

import style from './AutomationForm.module.scss';

const integrationsDocsUrl = 'https://docs.getontime.no/api/automation/#using-variables-in-automation';
const formId = 'automation-form';
const testFeedbackDuration = 2000;

interface AutomationFormProps {
  automation: Automation | AutomationDTO;
  onClose: () => void;
}

export default function AutomationForm({ automation, onClose }: AutomationFormProps) {
  const isEdit = isAutomation(automation);
  const { data } = useCustomFields();
  const { refetch } = useAutomationSettings();
  const fieldList = useMemo(() => makeFieldList(data), [data]);
  const [testResults, setTestResults] = useState<Record<string, TestState>>({});
  const [submitError, setSubmitError] = useState<string>();
  const feedbackTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const {
    control,
    handleSubmit,
    getValues,
    register,
    setFocus,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<AutomationDTO>({
    mode: 'onChange',
    defaultValues: {
      title: automation?.title ?? '',
      filterRule: automation?.filterRule ?? 'all',
      filters: automation?.filters ?? [],
      outputs: automation?.outputs ?? [],
    },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  const {
    fields: fieldFilters,
    append: appendFilter,
    remove: removeFilter,
  } = useFieldArray({
    name: 'filters',
    control,
  });

  const {
    fields: fieldOutputs,
    append: appendOutput,
    remove: removeOutput,
  } = useFieldArray({
    name: 'outputs',
    control,
  });

  // give initial focus to the title field
  useEffect(() => {
    setFocus('title');
  }, [setFocus]);

  // Clear delayed output-test feedback when the modal unmounts.
  useEffect(() => {
    const timers = feedbackTimers.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, []);

  const reportTest = (key: string, state: TestState) => {
    setTestResults((prev) => ({ ...prev, [key]: state }));
    clearTimeout(feedbackTimers.current[key]);

    if (state.status === 'ok') {
      feedbackTimers.current[key] = setTimeout(() => {
        setTestResults((prev) => {
          const { [key]: _discarded, ...rest } = prev;
          return rest;
        });
      }, testFeedbackDuration);
    }
  };

  const getOutputErrors = (index: number) => errors.outputs?.[index] as OutputErrors | undefined;

  const handleAddNewFilter = () => {
    appendFilter({ field: '', operator: 'equals', value: '' });
  };

  const handleAddNewOSCOutput = () => {
    // @ts-expect-error -- we dont want to pass a port to the new object
    appendOutput({ type: 'osc', targetIP: '', targetPort: undefined, address: '', args: '' });
  };

  const handleAddNewHTTPOutput = () => {
    appendOutput({ type: 'http', url: '' });
  };

  const handleAddNewOntimeAction = () => {
    appendOutput({ type: 'ontime', action: 'aux1-start' });
  };

  const handleTest = async (index: number, key: string) => {
    const values = getValues(`outputs.${index}`);

    if (isOSCOutput(values) && (!values.targetIP || !values.targetPort || !values.address)) {
      reportTest(key, { status: 'error', message: 'Fill in the target and address before testing' });
      return;
    }
    if (isHTTPOutput(values) && !values.url) {
      reportTest(key, { status: 'error', message: 'Add a target URL before testing' });
      return;
    }

    reportTest(key, { status: 'sending' });
    try {
      await testOutput(values);
      reportTest(key, { status: 'ok', message: 'Request sent' });
    } catch (error) {
      reportTest(key, { status: 'error', message: maybeAxiosError(error) });
    }
  };

  const onSubmit = async (values: AutomationDTO) => {
    setSubmitError(undefined);
    if (isAutomation(automation)) {
      await handleEdit(automation.id, { id: automation.id, ...values });
    } else {
      await handleCreate(values);
    }
    refetch();

    async function handleEdit(id: string, values: Automation) {
      try {
        await editAutomation(id, values);
        onClose();
      } catch (error) {
        setSubmitError(maybeAxiosError(error));
      }
    }

    async function handleCreate(values: AutomationDTO) {
      try {
        await addAutomation(values);
        onClose();
      } catch (error) {
        setSubmitError(maybeAxiosError(error));
      }
    }
  };

  const canSubmit = !isSubmitting && isDirty && isValid;
  const addOutputMenu = (
    <DropdownMenu
      render={<Button />}
      items={[
        ...(isOntimeCloud
          ? []
          : [
              {
                type: 'item' as const,
                label: 'OSC',
                description: 'Send an OSC message to a device on the network',
                onClick: handleAddNewOSCOutput,
              },
            ]),
        {
          type: 'item' as const,
          label: 'HTTP',
          description: 'Call a URL, for webhooks and REST APIs',
          onClick: handleAddNewHTTPOutput,
        },
        {
          type: 'item' as const,
          label: 'Ontime action',
          description: 'Change something inside Ontime, like a message or an aux timer',
          onClick: handleAddNewOntimeAction,
        },
      ]}
    >
      Add output <IoAdd />
    </DropdownMenu>
  );

  return (
    <Modal
      isOpen
      onClose={onClose}
      showBackdrop
      showCloseButton
      title={isEdit ? 'Edit automation' : 'Create automation'}
      bodyElements={
        <form id={formId} onSubmit={handleSubmit(onSubmit)} className={style.outerColumn}>
          <div className={style.innerColumn}>
            <h3>Automation options</h3>
            <div className={style.titleSection}>
              <label>
                Title
                <Input
                  {...register('title', { required: { value: true, message: 'Required field' } })}
                  fluid
                  placeholder='Automation title'
                />
              </label>
              <Panel.Error>{errors.title?.message}</Panel.Error>
            </div>
          </div>

          <div className={style.innerColumn}>
            <h3>Filters (optional)</h3>
            <div className={style.ruleSection}>
              <label>
                Trigger outputs if
                <RadioGroup
                  orientation='horizontal'
                  value={watch('filterRule')}
                  onValueChange={(value) => setValue('filterRule', value, { shouldDirty: true })}
                  items={[
                    { value: 'all', label: 'All filters pass' },
                    { value: 'any', label: 'Any filter passes' },
                  ]}
                />
                <Panel.Description>
                  All filters pass requires every condition to match. Any filter passes requires at least one match.
                </Panel.Description>
              </label>
              {fieldFilters.map((field, index) => {
                const key = `filters.${index}.field.${field.id}`;
                return (
                  <div key={key} className={style.filterSection}>
                    <label>
                      Runtime data source
                      <Select<string | null>
                        // need to normalize '' to null for the Select to show the placeholder
                        value={watch(`filters.${index}.field`) || null}
                        onValueChange={(value) => {
                          if (value === null) return;
                          setValue(`filters.${index}.field`, value, { shouldDirty: true });
                        }}
                        options={fieldList.map(({ value, label }) => ({
                          value,
                          label,
                          disabled: value === null,
                        }))}
                        aria-label='Event field'
                      />
                      <Panel.Error>{errors.filters?.[index]?.field?.message}</Panel.Error>
                    </label>
                    <label>
                      Matching condition
                      <Select
                        value={watch(`filters.${index}.operator`)}
                        onValueChange={(value: string | null) => {
                          if (value === null) return;
                          setValue(
                            `filters.${index}.operator`,
                            value as
                              | 'equals'
                              | 'not_equals'
                              | 'greater_than'
                              | 'less_than'
                              | 'contains'
                              | 'not_contains',
                            { shouldDirty: true },
                          );
                        }}
                        options={operators}
                        aria-label='Operator'
                      />
                      <Panel.Error>{errors.filters?.[index]?.operator?.message}</Panel.Error>
                    </label>
                    <label>
                      Value to match
                      <Input {...register(`filters.${index}.value`)} fluid placeholder='<empty / no value>' />
                    </label>
                    <div>
                      <span>&nbsp;</span>
                      <div>
                        <IconButton
                          aria-label='Delete'
                          variant='ghosted-destructive'
                          onClick={() => removeFilter(index)}
                        >
                          <IoTrash />
                        </IconButton>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div>
                <Button onClick={handleAddNewFilter}>
                  Add filter <IoAdd />
                </Button>
              </div>
            </div>
          </div>

          <div className={style.innerColumn}>
            <h3>Outputs</h3>
            <Info>
              Automation outputs can be used to send data from Ontime to external software <br />
              or to change properties of Ontime itself. <br /> <br />
              <span>
                Use Ontime runtime data in these fields with template strings. Type{' '}
                <Panel.Highlight>{'{{'}</Panel.Highlight> to see autocomplete, or{' '}
                <ExternalLink href={integrationsDocsUrl}>read the docs</ExternalLink>
              </span>
            </Info>

            {fieldOutputs.length === 0 && (
              <Panel.EmptyState
                title='This automation does nothing yet'
                description='An automation without outputs will be triggered, but it has nothing to send.'
                action={addOutputMenu}
              />
            )}
            {fieldOutputs.map((output, index) => {
              const cardProps = {
                testState: testResults[output.id],
                onTest: () => handleTest(index, output.id),
                onDelete: () => removeOutput(index),
              };
              const rowErrors = getOutputErrors(index);

              if (isOSCOutput(output)) {
                return (
                  <OutputCard
                    key={output.id}
                    label='OSC'
                    kindClass={style.tagOsc}
                    summary={watch(`outputs.${index}.address`)}
                    unavailableReason={isOntimeCloud ? 'Unavailable in Ontime Cloud' : undefined}
                    {...cardProps}
                  >
                    <OscOutputForm index={index} output={output} register={register} rowErrors={rowErrors} />
                  </OutputCard>
                );
              }
              if (isHTTPOutput(output)) {
                return (
                  <OutputCard key={output.id} label='HTTP' kindClass={style.tagHttp} {...cardProps}>
                    <HttpOutputForm index={index} output={output} register={register} rowErrors={rowErrors} />
                  </OutputCard>
                );
              }
              if (isOntimeAction(output)) {
                return (
                  <OutputCard key={output.id} label='Ontime action' kindClass={style.tagOntime} {...cardProps}>
                    <OntimeActionForm
                      value={output.action}
                      index={index}
                      register={register}
                      rowErrors={rowErrors}
                      setValue={setValue}
                      watch={watch}
                    />
                  </OutputCard>
                );
              }
              return null;
            })}
            {fieldOutputs.length > 0 && addOutputMenu}
          </div>
        </form>
      }
      footerElements={
        <>
          {submitError && <Panel.Error>{submitError}</Panel.Error>}
          <Button onClick={onClose}>Cancel</Button>
          <Button variant='primary' type='submit' form={formId} disabled={!canSubmit} loading={isSubmitting}>
            Save
          </Button>
        </>
      }
    />
  );
}
