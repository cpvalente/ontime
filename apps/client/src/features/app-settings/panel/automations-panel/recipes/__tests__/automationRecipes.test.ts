import { isHTTPOutput, isOSCOutput, isOntimeAction, timerLifecycleValues } from 'ontime-types';

import { operators } from '../../automationUtils';
import { automationRecipes, recipeCategoryOrder } from '../automationRecipes';

/**
 * Recipes are shipped as constants but installed through the same endpoints as a
 * hand written automation. These assertions stand in for the server side validation,
 * so a recipe cannot silently rot into something that 400s on install.
 */
describe('automationRecipes', () => {
  it('ships recipes', () => {
    expect(automationRecipes.length).toBeGreaterThan(0);
  });

  it('has unique ids', () => {
    const ids = automationRecipes.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only uses categories the library knows how to render', () => {
    for (const recipe of automationRecipes) {
      expect(recipeCategoryOrder).toContain(recipe.category);
    }
  });

  it('binds every recipe to at least one valid lifecycle', () => {
    for (const recipe of automationRecipes) {
      expect(recipe.triggers.length).toBeGreaterThan(0);
      for (const cycle of recipe.triggers) {
        expect(timerLifecycleValues).toContain(cycle);
      }
    }
  });

  it('gives every recipe something to send', () => {
    for (const recipe of automationRecipes) {
      expect(recipe.automation.outputs.length).toBeGreaterThan(0);
      expect(recipe.automation.title).not.toBe('');

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

  it('marks recipes that reach outside Ontime as needing a target', () => {
    for (const recipe of automationRecipes) {
      const reachesOut = recipe.automation.outputs.some((output) => isOSCOutput(output) || isHTTPOutput(output));
      expect(recipe.needsSetup).toBe(reachesOut);
    }
  });
});
