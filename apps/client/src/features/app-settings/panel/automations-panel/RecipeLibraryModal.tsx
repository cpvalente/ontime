import type { AutomationDTO, TimerLifeCycle } from 'ontime-types';
import { useState } from 'react';

import Button from '../../../../common/components/buttons/Button';
import Input from '../../../../common/components/input/input/Input';
import Modal from '../../../../common/components/modal/Modal';
import * as Panel from '../../panel-utils/PanelUtils';
import { automationRecipes, defaultRecipeValues, type AutomationRecipe, type RecipeValues } from './automationRecipes';

interface RecipeLibraryModalProps {
  onClose: () => void;
  onSelect: (automation: AutomationDTO, lifecycles: TimerLifeCycle[]) => void;
}

export default function RecipeLibraryModal({ onClose, onSelect }: RecipeLibraryModalProps) {
  const [recipe, setRecipe] = useState<AutomationRecipe>();
  const [values, setValues] = useState<RecipeValues>({});

  const selectRecipe = (nextRecipe: AutomationRecipe) => {
    setRecipe(nextRecipe);
    setValues(defaultRecipeValues(nextRecipe));
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      showBackdrop
      showCloseButton
      title={recipe ? recipe.title : 'Automation recipes'}
      bodyElements={
        recipe ? (
          <div>
            <Panel.Description>{recipe.description}</Panel.Description>
            {recipe.params.map((param) => (
              <label key={param.name}>
                {param.label}
                <Input
                  fluid
                  type={param.type ?? 'text'}
                  value={values[param.name] ?? ''}
                  onChange={(event) => setValues((current) => ({ ...current, [param.name]: event.target.value }))}
                />
              </label>
            ))}
          </div>
        ) : (
          <Panel.ListGroup>
            {automationRecipes.map((candidate) => (
              <Panel.ListItem key={candidate.id}>
                <Panel.Field title={candidate.title} description={candidate.description} />
                <Button onClick={() => selectRecipe(candidate)}>Choose</Button>
              </Panel.ListItem>
            ))}
          </Panel.ListGroup>
        )
      }
      footerElements={
        recipe ? (
          <>
            <Button onClick={() => setRecipe(undefined)}>Back</Button>
            <Button variant='primary' onClick={() => onSelect(recipe.build(values), recipe.lifecycles)}>
              Continue
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>Cancel</Button>
        )
      }
    />
  );
}
