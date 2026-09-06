import { isHTTPOutput, isOSCOutput, isOntimeAction, timerLifecycleValues } from 'ontime-types';

import { automationRecipes, defaultValues, needsTarget, recipeCategoryOrder } from '../automationRecipes';
import { operators } from '../automationUtils';

/**
 * Recipes are shipped as constants but created through the same endpoint as a hand written
 * automation. These assertions stand in for the server side validation, so a recipe cannot
 * silently rot into something that 400s when the user presses create.
 */
describe('automationRecipes', () => {
  const built = automationRecipes.map((recipe) => ({ recipe, automation: recipe.build(defaultValues(recipe)) }));

  it('has unique ids', () => {
    const ids = automationRecipes.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only uses categories the picker knows how to render', () => {
    for (const { recipe } of built) {
      expect(recipeCategoryOrder).toContain(recipe.category);
    }
  });

  it('binds every recipe to at least one valid lifecycle', () => {
    for (const { recipe } of built) {
      expect(recipe.triggers.length).toBeGreaterThan(0);
      for (const cycle of recipe.triggers) {
        expect(timerLifecycleValues).toContain(cycle);
      }
    }
  });

  it('builds a titled automation with something to send, from its own defaults', () => {
    for (const { automation } of built) {
      expect(automation.title).not.toBe('');
      expect(automation.outputs.length).toBeGreaterThan(0);

      for (const output of automation.outputs) {
        expect(isOSCOutput(output) || isHTTPOutput(output) || isOntimeAction(output)).toBe(true);
      }
    }
  });

  it('reads every parameter it declares', () => {
    // a param the builder ignores is a field the user fills in for nothing, and a typo in
    // either half would put the literal 'undefined' inside a URL
    for (const { recipe } of built) {
      for (const param of recipe.params) {
        const marker = param.type === 'number' ? '4242' : 'ontime-probe';
        const probed = { ...defaultValues(recipe), [param.name]: marker };
        expect(JSON.stringify(recipe.build(probed))).toContain(marker);
      }
    }
  });

  it('only uses filter operators the server accepts', () => {
    const allowed = operators.map(({ value }) => value);
    for (const { automation } of built) {
      for (const filter of automation.filters) {
        expect(allowed).toContain(filter.operator);
      }
    }
  });

  it('defaults every external target to this machine', () => {
    const outputs = built.flatMap(({ automation }) => automation.outputs);
    const osc = outputs.filter(isOSCOutput);
    const http = outputs.filter(isHTTPOutput);

    // filtering rather than asserting in a branch, so a failure names the offending recipe
    expect(osc.filter(({ targetIP }) => targetIP !== '127.0.0.1')).toEqual([]);
    expect(osc.filter(({ targetPort }) => !Number.isFinite(targetPort))).toEqual([]);
    expect(http.filter(({ url }) => !url.startsWith('http://127.0.0.1'))).toEqual([]);
  });

  it('flags the recipes that reach outside Ontime', () => {
    for (const { recipe, automation } of built) {
      const reachesOut = automation.outputs.some((output) => isOSCOutput(output) || isHTTPOutput(output));
      expect(needsTarget(recipe)).toBe(reachesOut);
    }
  });

  /** the outputs a recipe builds from the given answers, as plain JSON to assert against */
  function buildWith(id: string, values: Record<string, string>) {
    const recipe = automationRecipes.find((candidate) => candidate.id === id);
    return JSON.stringify(recipe?.build(values).outputs);
  }

  it('tolerates a URL that already carries a query', () => {
    expect(buildWith('webhook-event-title', { url: 'http://127.0.0.1:3000/now?source=ontime' })).toContain(
      '/now?source=ontime&title=',
    );
  });

  it('tolerates an address pasted with a trailing slash', () => {
    expect(
      buildWith('companion-press', { host: 'http://127.0.0.1:8888/', page: '1', row: '0', column: '0' }),
    ).toContain('http://127.0.0.1:8888/api/location/1/0/0/press');
  });
});
