const { test } = require('node:test');
const assert = require('node:assert/strict');

const { isUpdate } = require('../updateCheck.js');

test('offers a newer release', () => {
  assert.equal(isUpdate('v4.16.0', '4.15.1'), true);
  assert.equal(isUpdate('v5.0.0', '5.0.0-alpha.0'), true);
});

test('does not offer the running version', () => {
  assert.equal(isUpdate('v4.15.1', '4.15.1'), false);
});

test('does not offer an older major to a prerelease of a newer major', () => {
  assert.equal(isUpdate('v4.15.1', '5.0.0-alpha.0'), false);
});
