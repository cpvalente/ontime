import { expect, test } from '@playwright/test';

const baseURL = 'http://localhost:4001';
const automationsURL = `${baseURL}/data/automations`;
const dbURL = `${baseURL}/data/db`;

const templateName = 'e2e-automations-template';

/**
 * Covers the loop that makes automations shareable:
 * create one, clone only the automations into a template project, and check that
 * the template carries the automation and its trigger while leaving the rundown behind.
 */
test.describe('automations', () => {
  test.afterEach(async ({ request }) => {
    try {
      await request.delete(`${dbURL}/${templateName}.json`);
    } catch {
      /** nothing to do here */
    }
  });

  test('an automation and its trigger survive a round trip through a template project', async ({ request }) => {
    // 1. create an automation
    const createAutomation = await request.post(`${automationsURL}/automation`, {
      data: {
        title: 'e2e automation',
        filterRule: 'all',
        filters: [],
        outputs: [{ type: 'ontime', action: 'aux1-start' }],
      },
    });
    expect(createAutomation.status()).toBe(201);
    const automation = await createAutomation.json();

    // 2. bind it to a lifecycle
    const createTrigger = await request.post(`${automationsURL}/trigger`, {
      data: { title: 'e2e trigger', trigger: 'onStart', automationId: automation.id },
    });
    expect(createTrigger.status()).toBe(201);
    const trigger = await createTrigger.json();

    // 3. save the automations as a template, without touching the loaded project
    const projectList = await (await request.get(`${dbURL}/all`)).json();
    const currentProject = projectList.lastLoadedProject;

    const makeTemplate = await request.post(`${dbURL}/${currentProject}/partial-duplicate`, {
      data: { newFilename: templateName, sections: ['automation'] },
    });
    expect(makeTemplate.status()).toBe(201);

    // the running project is untouched
    const afterTemplate = await (await request.get(`${dbURL}/all`)).json();
    expect(afterTemplate.lastLoadedProject).toBe(currentProject);

    // 4. the template carries the automation and its trigger, and nothing else
    const template = await (await request.post(`${dbURL}/download`, { data: { filename: templateName } })).json();
    expect(Object.values(template.automation.automations)).toContainEqual(
      expect.objectContaining({ title: 'e2e automation' }),
    );
    expect(template.automation.triggers).toContainEqual(expect.objectContaining({ title: 'e2e trigger' }));
    expect(template.urlPresets).toEqual([]);

    // 5. clean up: the trigger has to go first, the server refuses to delete a referenced automation
    expect((await request.delete(`${automationsURL}/trigger/${trigger.id}`)).status()).toBe(204);
    expect((await request.delete(`${automationsURL}/automation/${automation.id}`)).status()).toBe(204);
  });

  test('refuses to delete an automation that a trigger still points at', async ({ request }) => {
    const automation = await (
      await request.post(`${automationsURL}/automation`, {
        data: {
          title: 'e2e referenced automation',
          filterRule: 'all',
          filters: [],
          outputs: [{ type: 'ontime', action: 'aux1-stop' }],
        },
      })
    ).json();

    const trigger = await (
      await request.post(`${automationsURL}/trigger`, {
        data: { title: 'e2e blocking trigger', trigger: 'onFinish', automationId: automation.id },
      })
    ).json();

    const refused = await request.delete(`${automationsURL}/automation/${automation.id}`);
    expect(refused.status()).toBe(400);
    expect((await refused.json()).message).toContain('e2e blocking trigger');

    await request.delete(`${automationsURL}/trigger/${trigger.id}`);
    expect((await request.delete(`${automationsURL}/automation/${automation.id}`)).status()).toBe(204);
  });
});
