import { isHTTPOutput, isOSCOutput, isOntimeAction, timerLifecycleValues } from 'ontime-types';

import {
  automationRecipes,
  defaultValues,
  getAvailableRecipes,
  recipeCategoryOrder,
  validateRecipeValues,
} from '../automationRecipes';
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

  it('gives every choice parameter options, and a default that is one of them', () => {
    const choices = automationRecipes.flatMap(({ params }) => params.filter(({ type }) => type === 'choice'));
    expect(choices.filter(({ options }) => !options?.length)).toEqual([]);
    expect(choices.filter(({ options, defaultValue }) => !options?.some((o) => o.value === defaultValue))).toEqual([]);
  });

  it('reads every parameter it declares', () => {
    // a param the builder ignores is a field the user fills in for nothing, and a typo in
    // either half would put the literal 'undefined' inside a URL
    for (const { recipe } of built) {
      for (const param of recipe.params) {
        // a choice can only take one of its own options, so probe with the last one
        if (param.type === 'choice') {
          const last = param.options?.at(-1)?.value ?? '';
          expect(JSON.stringify(recipe.build({ ...defaultValues(recipe), [param.name]: last }))).toContain(last);
          continue;
        }
        const marker =
          param.type === 'number' ? '4242' : param.validation?.kind === 'url' ? 'http://ontime-probe' : 'ontime-probe';
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

  it('hides local-network recipes in Ontime Cloud', () => {
    expect(getAvailableRecipes(true).map(({ id }) => id)).toEqual([
      'ontime-aux-timer',
      'ontime-aux-stop',
      'ontime-warn-stage',
      'ontime-clear-message',
      'ontime-secondary-message',
      'webhook-event-title',
    ]);
  });

  it('validates recipe addresses and numeric bounds', () => {
    const qlab = automationRecipes.find(({ id }) => id === 'qlab-go');
    const companion = automationRecipes.find(({ id }) => id === 'companion-press');
    const vmix = automationRecipes.find(({ id }) => id === 'vmix-overlay-warning');
    const webhook = automationRecipes.find(({ id }) => id === 'webhook-event-title');

    expect(qlab && validateRecipeValues(qlab, { ip: 'not a host', port: '70000' })).toEqual({
      ip: 'Enter an IP address or hostname',
      port: 'Enter a whole number from 1024 to 65535',
    });
    expect(
      companion && validateRecipeValues(companion, { host: 'localhost:8888', page: '1.5', row: '-1', column: '0' }),
    ).toEqual({
      host: 'Enter a URL starting with http:// or https://',
      page: 'Enter a whole number of 1 or more',
      row: 'Enter a whole number of 0 or more',
    });
    expect(vmix && validateRecipeValues(vmix, { host: 'http://127.0.0.1:8088', overlay: '5' })).toEqual({
      overlay: 'Enter a whole number from 1 to 4',
    });
    expect(webhook && validateRecipeValues(webhook, { url: 'ftp://example.com' })).toEqual({
      url: 'Enter a URL starting with http:// or https://',
    });
  });

  it('accepts every recipe default', () => {
    for (const recipe of automationRecipes) {
      expect(validateRecipeValues(recipe, defaultValues(recipe))).toEqual({});
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

  it('marks the event title for URL-safe substitution', () => {
    expect(buildWith('webhook-event-title', { url: 'http://127.0.0.1:3000/now' })).toContain(
      'title={{url:eventNow.title}}',
    );
  });

  it('adds webhook query parameters before a URL fragment', () => {
    expect(buildWith('webhook-event-title', { url: 'http://127.0.0.1:3000/now#details' })).toContain(
      '/now?title={{url:eventNow.title}}#details',
    );
  });

  it('rejects invalid aux timer durations', () => {
    const auxTimer = automationRecipes.find(({ id }) => id === 'ontime-aux-timer');

    expect(auxTimer && validateRecipeValues(auxTimer, { aux: '1', duration: 'abc' })).toEqual({
      duration: 'Enter a valid duration',
    });
  });

  it('rejects unsupported OSC targets', () => {
    const qlab = automationRecipes.find(({ id }) => id === 'qlab-go');

    expect(qlab && validateRecipeValues(qlab, { ip: '::1', port: '53000' })).toEqual({
      ip: 'Enter an IP address or hostname',
    });
  });

  it('keeps recipe previews available while an address is invalid', () => {
    expect(() => buildWith('companion-press', { host: 'http:', page: '1', row: '0', column: '0' })).not.toThrow();
  });

  it('tolerates an address pasted with a trailing slash', () => {
    expect(
      buildWith('companion-press', { host: 'http://127.0.0.1:8888/', page: '1', row: '0', column: '0' }),
    ).toContain('http://127.0.0.1:8888/api/location/1/0/0/press');
  });

  it('drops a pasted query before adding a Companion path', () => {
    expect(
      buildWith('companion-press', { host: 'http://127.0.0.1:8888?token=value', page: '1', row: '0', column: '0' }),
    ).toContain('http://127.0.0.1:8888/api/location/1/0/0/press');
  });
});
