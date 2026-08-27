import { expect, test } from '@playwright/test';

const baseURL = 'http://localhost:4001';
const automationsURL = `${baseURL}/data/automations`;

/**
 * Covers the automation delete flow: the server refuses to delete an automation that a
 * trigger still points at, and clears once the reference is removed.
 */
test.describe('automations', () => {
  let createdTriggers: string[] = [];
  let createdAutomations: string[] = [];

  test.afterEach(async ({ request }) => {
    try {
      // triggers first, the server refuses to delete an automation that is still referenced
      for (const id of createdTriggers) {
        await request.delete(`${automationsURL}/trigger/${id}`);
      }
      for (const id of createdAutomations) {
        await request.delete(`${automationsURL}/automation/${id}`);
      }
    } catch {
      // cleanup is best effort, it must not turn a passing test red
    } finally {
      createdTriggers = [];
      createdAutomations = [];
    }
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
    createdAutomations.push(automation.id);

    const trigger = await (
      await request.post(`${automationsURL}/trigger`, {
        data: { title: 'e2e blocking trigger', trigger: 'onFinish', automationId: automation.id },
      })
    ).json();
    createdTriggers.push(trigger.id);

    const refused = await request.delete(`${automationsURL}/automation/${automation.id}`);
    expect(refused.status()).toBe(400);
    expect((await refused.json()).message).toContain('e2e blocking trigger');

    // and it goes through once the reference is removed
    expect((await request.delete(`${automationsURL}/trigger/${trigger.id}`)).status()).toBe(204);
    expect((await request.delete(`${automationsURL}/automation/${automation.id}`)).status()).toBe(204);
  });
});
