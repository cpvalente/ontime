import { test as base, expect } from '@playwright/test';

export { expect };

// fail tests which contain errors in any page of the test context
// or which request server paths outside the base URL, ie: missing the router prefix
// contexts created manually (ie: browser.newContext() in hooks) are not covered
export const test = base.extend({
  context: async ({ context, baseURL }, use) => {
    const messages: Error[] = [];
    context.on('weberror', (webError) => {
      const exception = webError.error();
      console.log(`Uncaught exception: "${exception.message}"`);
      messages.push(exception);
    });

    const scope = baseURL ? new URL(baseURL) : null;
    const escapedRequests: string[] = [];
    context.on('request', (request) => {
      const url = new URL(request.url());
      if (scope && url.origin === scope.origin && !url.pathname.startsWith(scope.pathname)) {
        escapedRequests.push(url.pathname);
      }
    });

    await use(context);
    expect(messages).toEqual([]);
    expect(escapedRequests).toEqual([]);
  },
});
