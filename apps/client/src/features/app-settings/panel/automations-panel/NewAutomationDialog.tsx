import type { Automation } from 'ontime-types';
import { useState, type KeyboardEvent } from 'react';
import { IoAdd, IoArrowBack, IoChevronForward, IoClose, IoSearch } from 'react-icons/io5';

import { addAutomation } from '../../../../common/api/automation';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import IconButton from '../../../../common/components/buttons/IconButton';
import Input from '../../../../common/components/input/input/Input';
import Modal from '../../../../common/components/modal/Modal';
import ScrollArea from '../../../../common/components/scroll-area/ScrollArea';
import Select from '../../../../common/components/select/Select';
import Tag from '../../../../common/components/tag/Tag';
import { getLifecycleLabel } from '../../../../common/constants/timerLifecycle';
import { summariseOutputs } from '../../../../common/utils/automationOutputs';
import { cx } from '../../../../common/utils/styleUtils';
import { isOntimeCloud } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';
import {
  defaultValues,
  getAvailableRecipes,
  recipeCategoryLabels,
  recipeCategoryOrder,
  type AutomationRecipe,
  type RecipeValues,
  validateRecipeValues,
} from './automationRecipes';
import { makeTriggerTitle } from './automationUtils';

import style from './NewAutomationDialog.module.scss';

const availableRecipes = getAvailableRecipes(Boolean(isOntimeCloud));

interface NewAutomationDialogProps {
  onClose: () => void;
  onStartEmpty: () => void;
  onCreated: (automation: Automation) => void;
}

export default function NewAutomationDialog({ onClose, onStartEmpty, onCreated }: NewAutomationDialogProps) {
  const [selected, setSelected] = useState<AutomationRecipe | null>(null);

  return selected === null ? (
    <RecipePicker onClose={onClose} onStartEmpty={onStartEmpty} onSelect={setSelected} />
  ) : (
    <RecipeSetup recipe={selected} onClose={onClose} onBack={() => setSelected(null)} onCreated={onCreated} />
  );
}

function matches(recipe: AutomationRecipe, query: string): boolean {
  const haystack = [recipe.title, recipe.description, recipeCategoryLabels[recipe.category], ...(recipe.keywords ?? [])]
    .join(' ')
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((term) => haystack.includes(term));
}

interface RecipePickerProps {
  onClose: () => void;
  onStartEmpty: () => void;
  onSelect: (recipe: AutomationRecipe) => void;
}

function RecipePicker({ onClose, onStartEmpty, onSelect }: RecipePickerProps) {
  const [query, setQuery] = useState('');

  const trimmed = query.trim();
  const results = trimmed ? availableRecipes.filter((recipe) => matches(recipe, trimmed)) : availableRecipes;

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
      size='default'
      title='New automation'
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

          {results.length === 0 && (
            <Panel.EmptyState
              title='No recipe matches that'
              description='Try the name of the software, or start from an empty automation.'
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
      footerElements={
        <>
          <Button variant='ghosted-white' className={style.apart} onClick={onStartEmpty}>
            Start from an empty automation
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </>
      }
    />
  );
}

interface RecipeSetupProps {
  recipe: AutomationRecipe;
  onClose: () => void;
  onBack: () => void;
  onCreated: (automation: Automation) => void;
}

function RecipeSetup({ recipe, onClose, onBack, onCreated }: RecipeSetupProps) {
  const [values, setValues] = useState<RecipeValues>(() => defaultValues(recipe));
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const automation = recipe.build(values);
  const validationErrors = validateRecipeValues(recipe, values);
  const isComplete = Object.keys(validationErrors).length === 0;

  const setValue = (name: string, value: string) => setValues((prev) => ({ ...prev, [name]: value }));

  const handleCreate = async () => {
    setError(null);
    setIsCreating(true);
    try {
      const created = await addAutomation(
        automation,
        recipe.triggers.map((cycle) => ({
          title: makeTriggerTitle(automation.title, cycle),
          trigger: cycle,
        })),
      );
      onCreated(created);
    } catch (error) {
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
      title={recipe.title}
      bodyElements={
        <div className={style.setup}>
          <p className={style.setupDescription}>{recipe.description}</p>

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

          {recipe.params.length > 0 && (
            <div className={style.fields}>
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
                      aria-invalid={Boolean(validationErrors[param.name])}
                      fluid
                    />
                  )}
                  {param.hint && <span className={style.hint}>{param.hint}</span>}
                  <Panel.Error>{validationErrors[param.name]}</Panel.Error>
                </label>
              ))}
            </div>
          )}
        </div>
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
          <Button variant='primary' onClick={handleCreate} loading={isCreating} disabled={!isComplete}>
            Create automation <IoAdd />
          </Button>
        </>
      }
    />
  );
}
