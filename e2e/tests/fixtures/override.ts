import { test as base, expect } from '@playwright/test';

export { expect };

// fail tests which contain errors in any of their pages
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
