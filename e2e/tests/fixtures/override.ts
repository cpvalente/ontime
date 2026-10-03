import { test as base, expect } from '@playwright/test';

export { expect };

// fail tests which contain errors in any page of the test context
// contexts created manually (ie: browser.newContext() in hooks) are not covered
export const test = base.extend({
  context: async ({ context }, use) => {
    const messages: Error[] = [];
    context.on('weberror', (webError) => {
      const exception = webError.error();
      console.log(`Uncaught exception: "${exception.message}"`);
      messages.push(exception);
    });
    await use(context);
    expect(messages).toEqual([]);
  },
});
