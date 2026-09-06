import { isHTTPOutput, isOSCOutput, isOntimeAction, timerLifecycleValues } from 'ontime-types';

import { automationRecipes, needsTarget } from '../automationRecipes';
import { operators } from '../automationUtils';

/**
 * Recipes are shipped as constants but saved through the same endpoint as a hand written
 * automation. These assertions stand in for the server side validation, so a recipe cannot
 * silently rot into something that 400s when the user presses save.
 */
describe('automationRecipes', () => {
  it('has unique ids', () => {
    const ids = automationRecipes.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('binds every recipe to at least one valid lifecycle', () => {
    for (const recipe of automationRecipes) {
      expect(recipe.triggers.length).toBeGreaterThan(0);
      for (const cycle of recipe.triggers) {
        expect(timerLifecycleValues).toContain(cycle);
      }
    }
  });

  it('gives every recipe a title and something to send', () => {
    for (const recipe of automationRecipes) {
      expect(recipe.automation.title).not.toBe('');
      expect(recipe.automation.outputs.length).toBeGreaterThan(0);

      for (const output of recipe.automation.outputs) {
        expect(isOSCOutput(output) || isHTTPOutput(output) || isOntimeAction(output)).toBe(true);
      }
    }
  });

  it('only uses filter operators the server accepts', () => {
    const allowed = operators.map(({ value }) => value);
    for (const recipe of automationRecipes) {
      for (const filter of recipe.automation.filters) {
        expect(allowed).toContain(filter.operator);
      }
    }
  });

  it('defaults every external target to this machine', () => {
    for (const recipe of automationRecipes) {
      for (const output of recipe.automation.outputs) {
        if (isOSCOutput(output)) {
          expect(output.targetIP).toBe('127.0.0.1');
        }
        if (isHTTPOutput(output)) {
          expect(output.url.startsWith('http://127.0.0.1')).toBe(true);
        }
      }
    }
  });

  it('flags the recipes that reach outside Ontime', () => {
    for (const recipe of automationRecipes) {
      const reachesOut = recipe.automation.outputs.some((output) => isOSCOutput(output) || isHTTPOutput(output));
      expect(needsTarget(recipe)).toBe(reachesOut);
    }
  });
});
