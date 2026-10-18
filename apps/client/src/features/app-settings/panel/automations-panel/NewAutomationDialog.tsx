import type { Automation, TimerLifeCycle } from 'ontime-types';
import { useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { IoAdd, IoArrowBack, IoChevronForward, IoClose, IoSearch } from 'react-icons/io5';

import { addAutomation, addTrigger, editAutomation } from '../../../../common/api/automation';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import IconButton from '../../../../common/components/buttons/IconButton';
import ToggleButton from '../../../../common/components/buttons/ToggleButton';
import Info from '../../../../common/components/info/Info';
import Input from '../../../../common/components/input/input/Input';
import Modal from '../../../../common/components/modal/Modal';
import ScrollArea from '../../../../common/components/scroll-area/ScrollArea';
import Select from '../../../../common/components/select/Select';
import Tag from '../../../../common/components/tag/Tag';
import useAutomationSettings from '../../../../common/hooks-query/useAutomationSettings';
import { cx } from '../../../../common/utils/styleUtils';
import { isOntimeCloud } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';
import { summariseOutputs } from './automationOutputs';
import {
  automationRecipes,
  defaultValues,
  recipeCategoryLabels,
  recipeCategoryOrder,
  recipeSoftwareLabels,
  recipeSoftwareOrder,
  type AutomationRecipe,
  type RecipeSoftware,
  type RecipeValues,
} from './automationRecipes';
import { makeTriggerTitle } from './automationUtils';
import { getLifecycleLabel } from './timerLifecycle';

import style from './NewAutomationDialog.module.scss';

interface NewAutomationDialogProps {
  onClose: () => void;
  onCreated: (automation: Automation) => void;
}

/**
 * Builds a working automation for a known workflow.
 *
 * Two steps in one dialog rather than two stacked ones: pick a recipe, then answer only
 * what that recipe cannot know — where your gear is, how long the timer runs. Everything
 * else the recipe already decided, which is the point of having recipes at all.
 */
export default function NewAutomationDialog({ onClose, onCreated }: NewAutomationDialogProps) {
  const [selected, setSelected] = useState<AutomationRecipe | null>(null);
  // held here rather than in the picker, so going back finds the list as the user left it
  const [query, setQuery] = useState('');
  const [software, setSoftware] = useState<RecipeSoftware | null>(null);

  return selected === null ? (
    <RecipePicker
      query={query}
      software={software}
      onQueryChange={setQuery}
      onSoftwareChange={setSoftware}
      onClose={onClose}
      onSelect={setSelected}
    />
  ) : (
    <RecipeSetup recipe={selected} onClose={onClose} onBack={() => setSelected(null)} onCreated={onCreated} />
  );
}

/** matches on everything the user might type: the software, its protocol, the job it does */
function matches(recipe: AutomationRecipe, query: string): boolean {
  const haystack = [
    recipe.title,
    recipe.description,
    recipeCategoryLabels[recipe.category],
    recipeSoftwareLabels[recipe.software],
    ...(recipe.keywords ?? []),
  ]
    .join(' ')
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((term) => haystack.includes(term));
}

interface RecipePickerProps {
  query: string;
  /** null shows every software */
  software: RecipeSoftware | null;
  onQueryChange: (query: string) => void;
  onSoftwareChange: (software: RecipeSoftware | null) => void;
  onClose: () => void;
  onSelect: (recipe: AutomationRecipe) => void;
}

function RecipePicker({
  query,
  software,
  onQueryChange: setQuery,
  onSoftwareChange: setSoftware,
  onClose,
  onSelect,
}: RecipePickerProps) {
  const available = useMemo(
    () =>
      // OSC is not available in the cloud service, offering those recipes there would be a lie
      isOntimeCloud
        ? automationRecipes.filter(
            (recipe) => !recipe.build(defaultValues(recipe)).outputs.some((output) => output.type === 'osc'),
          )
        : automationRecipes,
    [],
  );

  // a filter with nothing behind it would only ever lead to an empty list
  const softwareFilters = recipeSoftwareOrder.filter((option) =>
    available.some((recipe) => recipe.software === option),
  );

  const trimmed = query.trim();
  const results = available.filter(
    (recipe) => (software === null || recipe.software === software) && (!trimmed || matches(recipe, trimmed)),
  );

  const handleSearchKey = (event: KeyboardEvent<HTMLInputElement>) => {
    // the dialog is the only thing listening for escape, and losing it while clearing a
    // search would be a bigger surprise than the search staying put
    if (event.key === 'Escape' && trimmed.length > 0) {
      event.stopPropagation();
      setQuery('');
      return;
    }

    if (event.key === 'Enter' && results.length > 0) {
      onSelect(results[0]);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      showBackdrop
      showCloseButton
      size='compact'
      title='Start from a recipe'
      bodyElements={
        <div className={style.picker}>
          <div className={style.search}>
            <IoSearch className={style.searchIcon} />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleSearchKey}
              placeholder='Search recipes, eg. QLab, OSC, message'
              className={style.searchInput}
              aria-label='Search recipes'
              fluid
              autoFocus
            />
            {trimmed.length > 0 && (
              <IconButton
                variant='ghosted-white'
                size='small'
                aria-label='Clear search'
                className={style.searchClear}
                onClick={() => setQuery('')}
              >
                <IoClose />
              </IconButton>
            )}
          </div>

          <div className={style.filters} role='group' aria-label='Filter recipes by software'>
            <ToggleButton size='small' pressed={software === null} onClick={() => setSoftware(null)}>
              All
            </ToggleButton>
            {softwareFilters.map((option) => (
              <ToggleButton
                key={option}
                size='small'
                pressed={software === option}
                onClick={() => setSoftware(software === option ? null : option)}
              >
                {recipeSoftwareLabels[option]}
              </ToggleButton>
            ))}
          </div>

          {results.length === 0 && (
            <Panel.EmptyState
              title={software ? `No ${recipeSoftwareLabels[software]} recipe matches that` : 'No recipe matches that'}
              description={
                software
                  ? 'Try another search, show all software, or close this and build the automation yourself.'
                  : 'Try the name of the software, or close this and build the automation yourself.'
              }
            />
          )}

          <ScrollArea viewportClassName={style.listViewport} contentClassName={style.list}>
            {recipeCategoryOrder.map((category) => {
              const inCategory = results.filter((recipe) => recipe.category === category);
              if (inCategory.length === 0) {
                return null;
              }

              return (
                <section key={category} className={style.group}>
                  <h4 className={style.groupTitle}>{recipeCategoryLabels[category]}</h4>
                  {inCategory.map((recipe) => (
                    <button type='button' key={recipe.id} className={style.recipe} onClick={() => onSelect(recipe)}>
                      <div className={style.recipeText}>
                        <div className={style.recipeTitle}>{recipe.title}</div>
                        <div className={style.recipeDescription}>{recipe.description}</div>
                      </div>
                      <div className={style.recipeTags}>
                        {recipe.triggers.map((cycle) => (
                          <Tag key={cycle}>{getLifecycleLabel(cycle)}</Tag>
                        ))}
                        <IoChevronForward className={style.chevron} />
                      </div>
                    </button>
                  ))}
                </section>
              );
            })}
          </ScrollArea>
        </div>
      }
      footerElements={<Button onClick={onClose}>Cancel</Button>}
    />
  );
}

interface RecipeSetupProps {
  recipe: AutomationRecipe;
  onClose: () => void;
  onBack: () => void;
  onCreated: (automation: Automation) => void;
}

const setupFormId = 'recipe-setup-form';

function RecipeSetup({ recipe, onClose, onBack, onCreated }: RecipeSetupProps) {
  const { data: settings } = useAutomationSettings();
  const [values, setValues] = useState<RecipeValues>(() => defaultValues(recipe));
  /** null until the user types a title, so the suggestion keeps up with the answers until then */
  const [customTitle, setCustomTitle] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const built = recipe.build(values);
  const title = customTitle ?? built.title;
  const automation = { ...built, title: title.trim() };
  const isComplete = automation.title !== '' && recipe.params.every(({ name }) => values[name]?.trim());

  const setValue = (name: string, value: string) => setValues((prev) => ({ ...prev, [name]: value }));

  /**
   * What this dialog has already put on the server: creating takes one request per trigger
   * on top of the automation itself, so a second attempt edits what exists and adds only
   * the triggers still missing, rather than making a duplicate that fires the same cycles twice.
   */
  const created = useRef<Automation | null>(null);
  const createdCycles = useRef<Set<TimerLifeCycle>>(new Set());

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isComplete || isCreating) {
      return;
    }
    setError(null);
    setIsCreating(true);
    try {
      // the server generates the id, so the automation has to exist before a trigger points at it
      const existing = created.current;
      created.current = existing
        ? await editAutomation(existing.id, { id: existing.id, ...automation })
        : await addAutomation(automation);

      for (const cycle of recipe.triggers) {
        if (createdCycles.current.has(cycle)) {
          continue;
        }
        await addTrigger({
          title: makeTriggerTitle(automation.title, cycle),
          trigger: cycle,
          automationId: created.current.id,
        });
        createdCycles.current.add(cycle);
      }
      onCreated(created.current);
    } catch (error) {
      // whatever landed is a normal automation, visible in the list. Report the failure and
      // leave the retry to the user rather than rolling back work behind their back
      setError(maybeAxiosError(error));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      showBackdrop
      showCloseButton
      size='compact'
      title={recipe.title}
      bodyElements={
        <form id={setupFormId} onSubmit={handleCreate} className={style.setup}>
          <p className={style.setupDescription}>{recipe.description}</p>

          {settings.enabledAutomations === false && (
            <Info type='warning'>
              Automations are disabled. This one will be created, but it won&apos;t run until you enable automations in
              the automation settings.
            </Info>
          )}

          <dl className={style.summary}>
            <dt>Runs on</dt>
            <dd>
              {recipe.triggers.map((cycle) => (
                <Tag key={cycle}>{getLifecycleLabel(cycle)}</Tag>
              ))}
            </dd>
            <dt>Sends</dt>
            <dd>
              {summariseOutputs(automation.outputs).map(({ type, label, count }) => (
                <Tag key={type}>{count > 1 ? `${label} ×${count}` : label}</Tag>
              ))}
            </dd>
          </dl>

          <div className={style.fields}>
            <label className={cx([style.field, style.wide])}>
              Title
              <Input
                value={title}
                onChange={(event) => setCustomTitle(event.target.value)}
                placeholder='Automation title'
                maxLength={80}
                fluid
                autoFocus
              />
              <span className={style.hint}>
                How it is named in the automations list and the event editor
                {customTitle !== null && customTitle !== built.title && (
                  <>
                    {' · '}
                    <button type='button' className={style.inlineAction} onClick={() => setCustomTitle(null)}>
                      Use suggested
                    </button>
                  </>
                )}
              </span>
            </label>
            {recipe.params.map((param) => (
              <label key={param.name} className={cx([style.field, param.wide && style.wide])}>
                {param.label}
                {param.type === 'choice' ? (
                  <Select
                    value={values[param.name]}
                    onValueChange={(value: string | null) => {
                      if (value === null) return;
                      setValue(param.name, value);
                    }}
                    options={param.options ?? []}
                    aria-label={param.label}
                    fluid
                  />
                ) : (
                  <Input
                    type={param.type === 'number' ? 'number' : 'text'}
                    value={values[param.name]}
                    onChange={(event) => setValue(param.name, event.target.value)}
                    fluid
                  />
                )}
                {param.hint && <span className={style.hint}>{param.hint}</span>}
              </label>
            ))}
          </div>

          <Panel.Description>
            Created as a normal automation with a global trigger, so it runs for every event. Edit it afterwards to add
            filters or more outputs.
          </Panel.Description>
        </form>
      }
      footerElements={
        <>
          {error && <Panel.Error>{error}</Panel.Error>}
          <Button variant='ghosted-white' className={style.apart} onClick={onBack} disabled={isCreating}>
            <IoArrowBack /> All recipes
          </Button>
          <Button onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button variant='primary' type='submit' form={setupFormId} loading={isCreating} disabled={!isComplete}>
            Create automation <IoAdd />
          </Button>
        </>
      }
    />
  );
}
