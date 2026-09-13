import { TimerLifeCycle, isHTTPOutput, isOSCOutput, isOntimeAction } from 'ontime-types';

import { automationRecipes, defaultRecipeValues } from '../automationRecipes';

describe('automation recipes', () => {
  it('builds valid OSC, HTTP, and Ontime definitions with explicit global lifecycles', () => {
    const built = automationRecipes.map((recipe) => ({
      recipe,
      automation: recipe.build(defaultRecipeValues(recipe)),
    }));

    expect(built.some(({ automation }) => automation.outputs.some(isOSCOutput))).toBe(true);
    expect(built.some(({ automation }) => automation.outputs.some(isHTTPOutput))).toBe(true);
    expect(built.some(({ automation }) => automation.outputs.some(isOntimeAction))).toBe(true);
    expect(built.every(({ recipe }) => recipe.lifecycles.length > 0)).toBe(true);
    expect(built.flatMap(({ recipe }) => recipe.lifecycles)).toContain(TimerLifeCycle.onStart);
  });
});
