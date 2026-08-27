import type { Automation } from 'ontime-types';
import { useState } from 'react';

import { maybeAxiosError } from '../../../../../common/api/utils';
import Button from '../../../../../common/components/buttons/Button';
import Info from '../../../../../common/components/info/Info';
import ExternalLink from '../../../../../common/components/link/external-link/ExternalLink';
import Modal from '../../../../../common/components/modal/Modal';
import Tag from '../../../../../common/components/tag/Tag';
import { getLifecycleLabel } from '../../../../../common/constants/timerLifecycle';
import { summariseOutputs } from '../../../../../common/utils/automationOutputs';
import { isOntimeCloud } from '../../../../../externals';
import * as Panel from '../../../panel-utils/PanelUtils';
import {
  automationRecipes,
  recipeCategoryLabels,
  recipeCategoryOrder,
  type AutomationRecipe,
} from './automationRecipes';
import { installRecipe } from './recipeUtils';

import style from './RecipeLibraryModal.module.scss';

interface RecipeLibraryModalProps {
  onClose: () => void;
  /** called with the installed automation so the caller can open it for editing */
  onInstalled: (automation: AutomationRecipe, created: Automation) => void;
}

export default function RecipeLibraryModal({ onClose, onInstalled }: RecipeLibraryModalProps) {
  const [installing, setInstalling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // OSC is not available in the cloud service, offering those recipes there would be a lie
  const available = isOntimeCloud
    ? automationRecipes.filter((recipe) => !recipe.automation.outputs.some((output) => output.type === 'osc'))
    : automationRecipes;

  const handleInstall = async (recipe: AutomationRecipe) => {
    setError(null);
    setInstalling(recipe.id);
    try {
      const created = await installRecipe(recipe);
      onInstalled(recipe, created);
    } catch (error) {
      setError(maybeAxiosError(error));
    } finally {
      setInstalling(null);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      showBackdrop
      showCloseButton
      size='wide'
      title='Automation recipes'
      bodyElements={
        <div className={style.library}>
          <Info>
            <Info.Body>
              Recipes are a starting point, not a black box. Each one is added as a normal automation that you can edit,
              test or delete. Recipes that reach external software are set to this machine, so point them at the right
              device before you rely on them.
            </Info.Body>
          </Info>

          {recipeCategoryOrder.map((category) => {
            const recipes = available.filter((recipe) => recipe.category === category);
            if (recipes.length === 0) {
              return null;
            }

            return (
              <section key={category} className={style.category}>
                <Panel.Title>{recipeCategoryLabels[category]}</Panel.Title>
                <div className={style.recipeGrid}>
                  {recipes.map((recipe) => (
                    <article key={recipe.id} className={style.recipe}>
                      <div className={style.recipeTitle}>{recipe.title}</div>
                      <div className={style.recipeDescription}>{recipe.description}</div>
                      <Panel.InlineElements relation='inner' wrap='wrap'>
                        {recipe.triggers.map((cycle) => (
                          <Tag key={cycle}>{getLifecycleLabel(cycle)}</Tag>
                        ))}
                        {summariseOutputs(recipe.automation.outputs).map(({ type, label, count }) => (
                          <Tag key={type}>{count > 1 ? `${label} ×${count}` : label}</Tag>
                        ))}
                        {recipe.needsSetup && <Tag variant='warning'>Needs a target</Tag>}
                      </Panel.InlineElements>
                      <div className={style.recipeActions}>
                        {recipe.docsUrl && <ExternalLink href={recipe.docsUrl}>Docs</ExternalLink>}
                        <Button
                          variant='primary'
                          size='small'
                          loading={installing === recipe.id}
                          disabled={installing !== null}
                          onClick={() => handleInstall(recipe)}
                        >
                          {recipe.needsSetup ? 'Add and configure' : 'Add'}
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      }
      footerElements={
        <>
          {error && <Panel.Error>{error}</Panel.Error>}
          <Button onClick={onClose}>Close</Button>
        </>
      }
    />
  );
}
