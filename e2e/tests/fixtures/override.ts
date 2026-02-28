import { test as base, expect } from '@playwright/test';

// fail tests which contain errors
export const test = base.extend({
  page: async ({ page }, use) => {
    const messages = [];
    page.on('pageerror', (exception) => {
      console.log(`Uncaught exception: "${exception.message}"`);
      messages.push(exception);
    });
    await use(page);
    expect(messages).toEqual([]);
  },
});
