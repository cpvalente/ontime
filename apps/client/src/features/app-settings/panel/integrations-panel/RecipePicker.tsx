import Button from '../../../../common/components/buttons/Button';
import Modal from '../../../../common/components/modal/Modal';
import { lifecycleLabels } from '../../../../common/constants/timerLifecycle';
import { capabilities } from '../../../../externals';
import { type AutomationRecipe, recipeGroups, withoutOscRecipes } from './automationRecipes';

import style from './RecipePicker.module.scss';

const availableGroups = capabilities.canUseOsc ? recipeGroups : withoutOscRecipes(recipeGroups);

interface RecipePickerProps {
  onPick: (recipe: AutomationRecipe) => void;
  onClose: () => void;
}

export default function RecipePicker({ onPick, onClose }: RecipePickerProps) {
  return (
    <Modal
      isOpen
      onClose={onClose}
      showBackdrop
      showCloseButton
      title='New automation from a recipe'
      bodyElements={
        <div className={style.groups}>
          {availableGroups.map(({ software, recipes }) => (
            <section key={software} className={style.group} aria-labelledby={`recipes-${software}`}>
              <h3 id={`recipes-${software}`} className={style.software}>
                {software}
              </h3>
              {recipes.map((recipe) => (
                <Button
                  key={recipe.automation.title}
                  variant='subtle-white'
                  fluid
                  className={style.recipe}
                  onClick={() => onPick(recipe)}
                >
                  {recipe.automation.title}
                  <span className={style.when}>{lifecycleLabels[recipe.trigger]}</span>
                </Button>
              ))}
            </section>
          ))}
        </div>
      }
    />
  );
}
