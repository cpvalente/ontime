import { IoChevronForward } from 'react-icons/io5';

import Modal from '../../../../common/components/modal/Modal';
import Tag from '../../../../common/components/tag/Tag';
import { getLifecycleLabel } from '../../../../common/constants/timerLifecycle';
import { summariseOutputs } from '../../../../common/utils/automationOutputs';
import { isOntimeCloud } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';
import { automationRecipes, needsTarget, type AutomationRecipe } from './automationRecipes';

import style from './NewAutomationDialog.module.scss';

interface NewAutomationDialogProps {
  onClose: () => void;
  /** called with the recipe to pre-fill the form with, or null to start from an empty one */
  onSelect: (recipe: AutomationRecipe | null) => void;
}

/**
 * The single entry point for making an automation: a list of starting points.
 * Picking one opens the ordinary automation form pre-filled, so a recipe is a head start
 * rather than a separate kind of object. Nothing is saved until the user saves the form.
 */
export default function NewAutomationDialog({ onClose, onSelect }: NewAutomationDialogProps) {
  // OSC is not available in the cloud service, offering those recipes there would be a lie
  const recipes = isOntimeCloud
    ? automationRecipes.filter((recipe) => !recipe.automation.outputs.some((output) => output.type === 'osc'))
    : automationRecipes;

  return (
    <Modal
      isOpen
      onClose={onClose}
      showBackdrop
      showCloseButton
      title='New automation'
      bodyElements={
        <div className={style.list}>
          <button type='button' className={style.option} onClick={() => onSelect(null)}>
            <div className={style.optionText}>
              <div className={style.optionTitle}>Empty automation</div>
              <div className={style.optionDescription}>Start from scratch.</div>
            </div>
            <IoChevronForward className={style.chevron} />
          </button>

          <div className={style.listLabel}>
            Or start from a recipe. Each one opens as a normal automation you can edit before saving.
          </div>

          {recipes.map((recipe) => (
            <button
              type='button'
              key={recipe.id}
              className={style.option}
              onClick={() => onSelect(recipe)}
              aria-label={`Start from ${recipe.automation.title}`}
            >
              <div className={style.optionText}>
                <div className={style.optionTitle}>{recipe.automation.title}</div>
                <div className={style.optionDescription}>{recipe.description}</div>
                <Panel.InlineElements relation='inner' wrap='wrap'>
                  {recipe.triggers.map((cycle) => (
                    <Tag key={cycle}>{getLifecycleLabel(cycle)}</Tag>
                  ))}
                  {summariseOutputs(recipe.automation.outputs).map(({ type, label, count }) => (
                    <Tag key={type}>{count > 1 ? `${label} ×${count}` : label}</Tag>
                  ))}
                  {needsTarget(recipe) && <Tag variant='warning'>Point it at your device</Tag>}
                </Panel.InlineElements>
              </div>
              <IoChevronForward className={style.chevron} />
            </button>
          ))}
        </div>
      }
    />
  );
}
