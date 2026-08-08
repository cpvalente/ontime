import {
  Automation,
  AutomationDTO,
  AutomationFilter,
  HTTPOutput,
  OSCOutput,
  OntimeAction,
  TimerLifeCycle,
  Trigger,
  isHTTPOutput,
  isOSCOutput,
  isOntimeAction,
} from 'ontime-types';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { IoAdd, IoCheckmark, IoTrash } from 'react-icons/io5';

import {
  addAutomation,
  addTrigger,
  deleteTrigger,
  editAutomation,
  testOutput,
} from '../../../../common/api/automation';
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
import Tag from '../../../../common/components/tag/Tag';
import useAutomationSettings from '../../../../common/hooks-query/useAutomationSettings';
import useCustomFields from '../../../../common/hooks-query/useCustomFields';
import { startsWithHttp } from '../../../../common/utils/regex';
import * as Panel from '../../panel-utils/PanelUtils';
import { cycles, isAutomation, makeFieldList, operators } from './automationUtils';
import OntimeActionForm from './OntimeActionForm';
import TemplateInput from './template-input/TemplateInput';

import style from './AutomationForm.module.scss';

const integrationsDocsUrl = 'https://docs.getontime.no/api/automation/#using-variables-in-automation';
const formId = 'automation-form';

/** how long a successful test keeps its confirmation on screen */
const testFeedbackDuration = 2000;

type TestState = { status: 'sending' | 'ok' | 'error'; message?: string };

/** lifecycles that fire continuously, and are worth a warning before a user picks one */
const continuousCycles: TimerLifeCycle[] = [TimerLifeCycle.onClock, TimerLifeCycle.onUpdate];

interface AutomationFormProps {
  automation: Automation | AutomationDTO;
  /** global triggers, used to resolve which lifecycles this automation is currently bound to */
  triggers: Trigger[];
  onClose: () => void;
}

export default function AutomationForm({ automation, triggers, onClose }: AutomationFormProps) {
  const isEdit = isAutomation(automation);
  const { data } = useCustomFields();
  const { refetch } = useAutomationSettings();
  const fieldList = useMemo(() => makeFieldList(data), [data]);

  /**
   * Triggers are a separate entity, so they live outside the form state.
   *
   * We snapshot the automation's triggers when the form opens and reconcile against that
   * snapshot, never against the live prop: settings are polled, so a trigger created
   * elsewhere while this form is open must not be deleted by a save that never saw it.
   */
  const [initialTriggers] = useState<Trigger[]>(() =>
    isAutomation(automation) ? triggers.filter((trigger) => trigger.automationId === automation.id) : [],
  );
  const initialCycles = useMemo(
    () => Array.from(new Set(initialTriggers.map((trigger) => trigger.trigger))),
    [initialTriggers],
  );
  const [selectedCycles, setSelectedCycles] = useState<TimerLifeCycle[]>(initialCycles);
  /** set once a create succeeds, so a retry after a failed trigger sync edits instead of creating a duplicate */
  const [createdId, setCreatedId] = useState<string | null>(null);

  const cyclesAreDirty =
    selectedCycles.length !== initialCycles.length ||
    selectedCycles.some((cycle) => !initialCycles.includes(cycle)) ||
    initialCycles.some((cycle) => !selectedCycles.includes(cycle));

  const toggleCycle = (cycle: TimerLifeCycle) => {
    setSelectedCycles((prev) => (prev.includes(cycle) ? prev.filter((c) => c !== cycle) : [...prev, cycle]));
  };

  /**
   * A lifecycle can carry several differently named triggers, which the chips collapse into one.
   * Unchecking it removes all of them, so say which ones rather than deleting them quietly.
   */
  const triggersToRemove = initialTriggers.filter((trigger) => !selectedCycles.includes(trigger.trigger));

  /**
   * Test results are keyed by the field array id rather than the index:
   * removing an output shifts every index after it, which would leave feedback on the wrong row
   */
  const [testResults, setTestResults] = useState<Record<string, TestState>>({});
  const feedbackTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const {
    control,
    handleSubmit,
    getValues,
    register,
    setError,
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

  // the timers outlive a fast close, clearing them avoids setting state on an unmounted form
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

  const handleAddnewOntimeAction = () => {
    appendOutput({ type: 'ontime', action: 'aux1-start' });
  };

  const handleTestOSCOutput = async (index: number, key: string) => {
    const values = getValues(`outputs.${index}`) as OSCOutput;
    if (!values.targetIP || !values.targetPort || !values.address) {
      reportTest(key, { status: 'error', message: 'Fill in the target and address before testing' });
      return;
    }

    reportTest(key, { status: 'sending' });
    try {
      await testOutput({
        type: 'osc',
        targetIP: values.targetIP,
        targetPort: values.targetPort,
        address: values.address,
        args: values.args,
      });
      // OSC is fire and forget over UDP, the most we can honestly claim is that we sent it
      reportTest(key, { status: 'ok', message: 'Sent' });
    } catch (error) {
      reportTest(key, { status: 'error', message: maybeAxiosError(error) });
    }
  };

  const handleTestHTTPOutput = async (index: number, key: string) => {
    const values = getValues(`outputs.${index}`) as HTTPOutput;
    if (!values.url) {
      reportTest(key, { status: 'error', message: 'Add a target URL before testing' });
      return;
    }

    reportTest(key, { status: 'sending' });
    try {
      await testOutput({ type: 'http', url: values.url });
      reportTest(key, { status: 'ok', message: 'Sent' });
    } catch (error) {
      reportTest(key, { status: 'error', message: maybeAxiosError(error) });
    }
  };

  const handleTestOntimeAction = async (index: number, key: string) => {
    const values = getValues(`outputs.${index}`) as OntimeAction;

    reportTest(key, { status: 'sending' });
    try {
      // NOTE: there is no meaningful validation to do here, we let the server deal with the data
      await testOutput({ ...values, type: 'ontime' });
      reportTest(key, { status: 'ok', message: 'Done' });
    } catch (error) {
      reportTest(key, { status: 'error', message: maybeAxiosError(error) });
    }
  };

  /**
   * Reconciles the lifecycle selection against the global triggers.
   * Runs after the automation itself is saved: a new automation has no id until then.
   *
   * Both sides are diffed against the mount-time snapshot, so this only ever removes
   * triggers the user could actually see when they made the change.
   */
  const syncTriggers = async (automationId: string, title: string) => {
    for (const trigger of triggersToRemove) {
      await deleteTrigger(trigger.id);
    }

    const toAdd = selectedCycles.filter((cycle) => !initialCycles.includes(cycle));
    for (const cycle of toAdd) {
      const label = cycles.find(({ value }) => value === cycle)?.label ?? cycle;
      await addTrigger({ title: `${title} — ${label}`, trigger: cycle, automationId });
    }
  };

  const onSubmit = async (values: AutomationDTO) => {
    // saving happens in two requests, so a retry after a partial failure must edit rather than create again
    const existingId = isAutomation(automation) ? automation.id : createdId;
    let automationId: string;

    try {
      if (existingId) {
        await editAutomation(existingId, { id: existingId, ...values });
        automationId = existingId;
      } else {
        const created = await addAutomation(values);
        setCreatedId(created.id);
        automationId = created.id;
      }
    } catch (error) {
      setError('root', { message: maybeAxiosError(error) });
      return;
    }

    try {
      await syncTriggers(automationId, values.title);
    } catch (error) {
      // the automation itself is saved, only its triggers failed. Keep the form open so the user can retry
      refetch();
      setError('root', { message: `Automation saved, but its triggers failed: ${maybeAxiosError(error)}` });
      return;
    }

    refetch();
    onClose();
  };

  /** describes a filter in plain language so the user does not have to read the form back to themselves */
  const describeFilter = (index: number): string | null => {
    const field = watch(`filters.${index}.field`);
    if (!field) {
      return null;
    }

    const fieldLabel = fieldList.find((option) => option.value === field)?.label ?? field;
    const operator = watch(`filters.${index}.operator`);
    const operatorLabel = operators.find((option) => option.value === operator)?.label ?? operator;
    const value = watch(`filters.${index}.value`);

    return `${fieldLabel} ${operatorLabel} ${value ? `“${value}”` : 'nothing'}`;
  };

  const canSubmit = !isSubmitting && (isDirty || cyclesAreDirty) && isValid;
  const hasContinuousCycle = selectedCycles.some((cycle) => continuousCycles.includes(cycle));

  return (
    <Modal
      isOpen
      onClose={onClose}
      showBackdrop
      showCloseButton
      size='wide'
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
                  placeholder='Load preset'
                />
              </label>
              <Panel.Error>{errors.title?.message}</Panel.Error>
            </div>

            <div className={style.titleSection}>
              <label id='runs-on-label'>Runs on</label>
              <Panel.Description>
                Pick the moments in the timer lifecycle that should run this automation. You can also attach it to a
                single event from the event editor.
              </Panel.Description>
              <Panel.InlineElements relation='inner' wrap='wrap' aria-labelledby='runs-on-label' role='group'>
                {cycles.map(({ id, label, value }) => {
                  const cycle = value as TimerLifeCycle;
                  const isSelected = selectedCycles.includes(cycle);
                  return (
                    <Button
                      key={id}
                      size='small'
                      variant={isSelected ? 'primary' : 'subtle'}
                      aria-pressed={isSelected}
                      onClick={() => toggleCycle(cycle)}
                    >
                      {label}
                    </Button>
                  );
                })}
              </Panel.InlineElements>
              {hasContinuousCycle && (
                <Panel.Description tone='warning'>
                  Every second and On Timer Update fire continuously while the timer runs. Add a filter unless you mean
                  to send on every tick.
                </Panel.Description>
              )}
              {triggersToRemove.length > 0 && (
                <Panel.Description tone='warning'>
                  {`Saving removes ${triggersToRemove.length === 1 ? 'the trigger' : `${triggersToRemove.length} triggers`}: ${triggersToRemove
                    .map((trigger) => trigger.title)
                    .join(', ')}`}
                </Panel.Description>
              )}
            </div>
          </div>

          <div className={style.innerColumn}>
            <h3>Filters (optional)</h3>
            <Panel.Description>
              Without filters the outputs are sent every time the automation is triggered.
            </Panel.Description>
            <div className={style.ruleSection}>
              {fieldFilters.length > 1 && (
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
                </label>
              )}
              {fieldFilters.map((field, index) => {
                const description = describeFilter(index);
                return (
                  <div key={field.id} className={style.card}>
                    <div className={style.cardHeader}>
                      <Tag>Filter</Tag>
                      <span className={style.cardSummary}>{description}</span>
                      <IconButton
                        aria-label='Delete filter'
                        variant='ghosted-destructive'
                        onClick={() => removeFilter(index)}
                      >
                        <IoTrash />
                      </IconButton>
                    </div>
                    <div className={style.cardBody}>
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
                            setValue(`filters.${index}.operator`, value as AutomationFilter['operator'], {
                              shouldDirty: true,
                            });
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
              Use Ontime runtime data in these fields with template strings. Type {'{{'} to see autocomplete, or{' '}
              <ExternalLink href={integrationsDocsUrl}>read the docs</ExternalLink>
            </Info>

            {fieldOutputs.length === 0 && (
              <Panel.EmptyState
                title='This automation does nothing yet'
                description='An automation without outputs will be triggered, but it has nothing to send.'
              />
            )}

            {fieldOutputs.map((output, index) => {
              if (isOSCOutput(output)) {
                const rowErrors = errors.outputs?.[index] as
                  | {
                      targetIP?: { message?: string };
                      targetPort?: { message?: string };
                      address?: { message?: string };
                      args?: { message?: string };
                    }
                  | undefined;

                return (
                  <OutputCard
                    key={output.id}
                    label='OSC'
                    kindClass={style.tagOsc}
                    summary={watch(`outputs.${index}.address`)}
                    testState={testResults[output.id]}
                    onTest={() => handleTestOSCOutput(index, output.id)}
                    onDelete={() => removeOutput(index)}
                  >
                    <label>
                      Target IP
                      <Input
                        {...register(`outputs.${index}.targetIP`, {
                          required: { value: true, message: 'Required field' },
                        })}
                        fluid
                        placeholder='127.0.0.1'
                      />
                      <Panel.Error>{rowErrors?.targetIP?.message}</Panel.Error>
                    </label>
                    <label>
                      Target Port
                      <Input
                        {...register(`outputs.${index}.targetPort`, {
                          required: { value: true, message: 'Required field' },
                          setValueAs: (value) => (value === '' ? 0 : Number(value)),
                          max: { value: 65535, message: 'Port must be within range 1024 - 65535' },
                          min: { value: 1024, message: 'Port must be within range 1024 - 65535' },
                        })}
                        fluid
                        type='number'
                        maxLength={5}
                        placeholder='8000'
                      />
                      <Panel.Error>{rowErrors?.targetPort?.message}</Panel.Error>
                    </label>
                    <label className={style.spanFull}>
                      Address
                      <TemplateInput
                        {...register(`outputs.${index}.address`)}
                        value={output.address}
                        fluid
                        placeholder='/cue/start'
                      />
                      <Panel.Error>{rowErrors?.address?.message}</Panel.Error>
                    </label>
                    <label className={style.spanFull}>
                      Arguments
                      <TemplateInput {...register(`outputs.${index}.args`)} value={output.args} fluid placeholder='1' />
                      <Panel.Error>{rowErrors?.args?.message}</Panel.Error>
                    </label>
                  </OutputCard>
                );
              }

              if (isHTTPOutput(output)) {
                const rowErrors = errors.outputs?.[index] as
                  | {
                      url?: { message?: string };
                    }
                  | undefined;
                return (
                  <OutputCard
                    key={output.id}
                    label='HTTP'
                    kindClass={style.tagHttp}
                    testState={testResults[output.id]}
                    onTest={() => handleTestHTTPOutput(index, output.id)}
                    onDelete={() => removeOutput(index)}
                  >
                    <label className={style.spanFull}>
                      Target URL
                      <TemplateInput
                        {...register(`outputs.${index}.url`, {
                          required: { value: true, message: 'Required field' },
                          pattern: {
                            value: startsWithHttp,
                            message: 'HTTP messages should target http:// or https://',
                          },
                        })}
                        value={output.url}
                        fluid
                        placeholder='http://127.0.0.1/start/1'
                      />
                      <Panel.Error>{rowErrors?.url?.message}</Panel.Error>
                    </label>
                  </OutputCard>
                );
              }

              if (isOntimeAction(output)) {
                const rowErrors = errors.outputs?.[index] as
                  | {
                      action?: { message?: string };
                      time?: { message?: string };
                      text?: { message?: string };
                      visible?: { message?: string };
                      secondarySource?: { message?: string };
                    }
                  | undefined;
                return (
                  <OutputCard
                    key={output.id}
                    label='Ontime action'
                    kindClass={style.tagOntime}
                    testState={testResults[output.id]}
                    onTest={() => handleTestOntimeAction(index, output.id)}
                    onDelete={() => removeOutput(index)}
                  >
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
            <div>
              <DropdownMenu
                render={<Button />}
                items={[
                  {
                    type: 'item',
                    label: 'OSC',
                    description: 'Send an OSC message to a device on the network',
                    onClick: handleAddNewOSCOutput,
                  },
                  {
                    type: 'item',
                    label: 'HTTP',
                    description: 'Call a URL, for webhooks and REST APIs',
                    onClick: handleAddNewHTTPOutput,
                  },
                  {
                    type: 'item',
                    label: 'Ontime action',
                    description: 'Change something inside Ontime, like a message or an aux timer',
                    onClick: handleAddnewOntimeAction,
                  },
                ]}
              >
                Add output <IoAdd />
              </DropdownMenu>
            </div>
          </div>
        </form>
      }
      footerElements={
        <>
          {errors?.root && <Panel.Error>{errors.root.message}</Panel.Error>}
          <Button onClick={onClose}>Cancel</Button>
          <Button variant='primary' type='submit' form={formId} disabled={!canSubmit} loading={isSubmitting}>
            Save
          </Button>
        </>
      }
    />
  );
}

interface OutputCardProps {
  label: string;
  kindClass?: string;
  summary?: string;
  testState?: TestState;
  onTest: () => void;
  onDelete: () => void;
  children: ReactNode;
}

/**
 * Shared chrome for every output kind: the type tag and the actions live in the header,
 * so they stop competing with the form fields for grid columns
 */
function OutputCard({ label, kindClass, summary, testState, onTest, onDelete, children }: OutputCardProps) {
  return (
    <div className={style.card}>
      <div className={style.cardHeader}>
        <Tag className={kindClass}>{label}</Tag>
        <span className={style.cardSummary}>{summary}</span>
        {testState?.status === 'ok' && (
          <span className={style.testOk}>
            <IoCheckmark />
            {testState.message}
          </span>
        )}
        <Button variant='ghosted-white' onClick={onTest} loading={testState?.status === 'sending'}>
          Test
        </Button>
        <IconButton aria-label='Delete output' variant='ghosted-destructive' onClick={onDelete}>
          <IoTrash />
        </IconButton>
      </div>
      {testState?.status === 'error' && <Panel.Error className={style.testError}>{testState.message}</Panel.Error>}
      <div className={style.cardBody}>{children}</div>
    </div>
  );
}
