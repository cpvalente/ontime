import {
  Automation,
  AutomationDTO,
  AutomationFilter,
  TimerLifeCycle,
  Trigger,
  isHTTPOutput,
  isOSCOutput,
  isOntimeAction,
} from 'ontime-types';
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
import ScrollArea from '../../../../common/components/scroll-area/ScrollArea';
import Select from '../../../../common/components/select/Select';
import Tag from '../../../../common/components/tag/Tag';
import useAutomationSettings from '../../../../common/hooks-query/useAutomationSettings';
import useCustomFields from '../../../../common/hooks-query/useCustomFields';
import { isOntimeCloud } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';
import { cycles, isAutomation, makeFieldList, makeTriggerTitle, operators, type OutputErrors } from './automationUtils';
import HttpOutputForm from './HttpOutputForm';
import OntimeActionForm from './OntimeActionForm';
import OscOutputForm from './OscOutputForm';
import OutputCard, { type TestState } from './OutputCard';

import style from './AutomationForm.module.scss';

const integrationsDocsUrl = 'https://docs.getontime.no/api/automation/#using-variables-in-automation';
const formId = 'automation-form';

/** how long a successful test keeps its confirmation on screen */
const testFeedbackDuration = 2000;

/** lifecycles that fire continuously, and are worth a warning before a user picks one */
const continuousCycles: TimerLifeCycle[] = [TimerLifeCycle.onClock, TimerLifeCycle.onUpdate];

interface AutomationFormProps {
  automation: Automation | AutomationDTO;
  triggers?: Trigger[];
  onClose: () => void;
}

export default function AutomationForm({ automation, triggers = [], onClose }: AutomationFormProps) {
  const isEdit = isAutomation(automation);
  const { data } = useCustomFields();
  const { refetch } = useAutomationSettings();
  const fieldList = useMemo(() => makeFieldList(data), [data]);

  const [initialCycles] = useState<TimerLifeCycle[]>(() =>
    isAutomation(automation)
      ? Array.from(
          new Set(
            triggers.filter((trigger) => trigger.automationId === automation.id).map((trigger) => trigger.trigger),
          ),
        )
      : [],
  );
  const [selectedCycles, setSelectedCycles] = useState<TimerLifeCycle[]>(initialCycles);
  const cyclesAreDirty =
    selectedCycles.length !== initialCycles.length || selectedCycles.some((cycle) => !initialCycles.includes(cycle));

  const toggleCycle = (cycle: TimerLifeCycle) => {
    setSelectedCycles((prev) => (prev.includes(cycle) ? prev.filter((c) => c !== cycle) : [...prev, cycle]));
  };

  const [testResults, setTestResults] = useState<Record<string, TestState>>({});
  const feedbackTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const {
    clearErrors,
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
      title: automation.title,
      filterRule: automation.filterRule,
      filters: automation.filters,
      outputs: automation.outputs,
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

  useEffect(() => {
    setFocus('title');
  }, [setFocus]);

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

  /**
   * Sends a single output as configured, without saving the automation.
   * OSC is fire and forget over UDP, so the most we can honestly claim is that we sent it.
   */
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
    // a stale failure from the previous attempt would otherwise sit under a successful retry
    clearErrors('root');

    try {
      if (!isAutomation(automation)) {
        await addAutomation(
          values,
          selectedCycles.map((cycle) => ({ title: makeTriggerTitle(values.title, cycle), trigger: cycle })),
        );
        refetch();
        onClose();
        return;
      }

      await editAutomation(
        automation.id,
        { id: automation.id, ...values },
        selectedCycles.map((cycle) => ({ title: makeTriggerTitle(values.title, cycle), trigger: cycle })),
      );
    } catch (error) {
      setError('root', { message: maybeAxiosError(error) });
      return;
    }

    refetch();
    onClose();
  };

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

  /**
   * A failed save reports itself as a root error, which react-hook-form counts against
   * isValid. Left alone that disables the very retry the message is asking the user to make,
   * so a root error on its own does not block submitting again.
   */
  const invalidFields = Object.keys(errors).filter((field) => field !== 'root');
  const canSubmit = !isSubmitting && (isDirty || cyclesAreDirty) && (isValid || invalidFields.length === 0);
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
        <form id={formId} onSubmit={handleSubmit(onSubmit)} className={style.form}>
          <ScrollArea className={style.formScroll} contentClassName={style.outerColumn}>
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
                  {cycles.map(({ label, value }) => {
                    const isSelected = selectedCycles.includes(value);
                    return (
                      <Button
                        key={value}
                        size='small'
                        variant={isSelected ? 'primary' : 'subtle'}
                        aria-pressed={isSelected}
                        onClick={() => toggleCycle(value)}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </Panel.InlineElements>
                {hasContinuousCycle && (
                  <Panel.Description tone='warning'>
                    Every second and On Timer Update fire continuously while the timer runs. Add a filter unless you
                    mean to send on every tick.
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
                Type {'{{'} in any field to drop in Ontime runtime data, like the running event title.{' '}
                <ExternalLink href={integrationsDocsUrl}>read the docs</ExternalLink>
              </Info>

              {fieldOutputs.length === 0 && (
                <Panel.EmptyState
                  title='This automation does nothing yet'
                  description='An automation without outputs will be triggered, but it has nothing to send.'
                />
              )}

              {fieldOutputs.map((output, index) => {
                const rowErrors = getOutputErrors(index);
                const cardProps = {
                  testState: testResults[output.id],
                  onTest: () => handleTest(index, output.id),
                  onDelete: () => removeOutput(index),
                };

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
              <div>
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
                      type: 'item',
                      label: 'HTTP',
                      description: 'Call a URL, for webhooks and REST APIs',
                      onClick: handleAddNewHTTPOutput,
                    },
                    {
                      type: 'item',
                      label: 'Ontime action',
                      description: 'Change something inside Ontime, like a message or an aux timer',
                      onClick: handleAddNewOntimeAction,
                    },
                  ]}
                >
                  Add output <IoAdd />
                </DropdownMenu>
              </div>
            </div>
          </ScrollArea>
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
