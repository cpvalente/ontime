import { isHTTPOutput, isOSCOutput } from 'ontime-types';

import { recipeGroups, withoutOscRecipes } from '../automationRecipes';
import { makeFieldList } from '../automationUtils';

describe('automationRecipes', () => {
  const recipes = recipeGroups.flatMap(({ recipes }) => recipes);
  const outputs = recipes.flatMap(({ automation }) => automation.outputs);

  it('names every recipe uniquely', () => {
    const titles = recipes.map(({ automation }) => automation.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('only filters on fields the form can show', () => {
    const fields = makeFieldList([]).map(({ value }) => value);
    for (const filter of recipes.flatMap(({ automation }) => automation.filters)) {
      expect(fields).toContain(filter.field);
    }
  });

  it('points every external target at this machine', () => {
    expect(outputs.filter(isOSCOutput).filter(({ targetIP }) => targetIP !== '127.0.0.1')).toEqual([]);
    expect(outputs.filter(isHTTPOutput).filter(({ url }) => !url.startsWith('http://127.0.0.1:'))).toEqual([]);
  });

  it('leaves out OSC recipes, and the software left without recipes', () => {
    const cloudGroups = withoutOscRecipes(recipeGroups);
    const cloudOutputs = cloudGroups.flatMap(({ recipes }) => recipes.flatMap(({ automation }) => automation.outputs));

    expect(cloudOutputs.filter(isOSCOutput)).toEqual([]);
    expect(cloudGroups.map(({ software }) => software)).toEqual(['Ontime', 'vMix', 'ProPresenter']);
  });
});
